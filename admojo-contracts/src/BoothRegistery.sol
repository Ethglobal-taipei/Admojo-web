 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BoothRegistery {
    // Enum for booth status
    enum BoothStatus {
        Unbooked,
        Booked,
        UnderMaintenance
    }

    // Struct to store booth details
    struct Booth {
        uint deviceId;      // IoT device ID assigned by the backend
        bytes metadata;     // Metadata (e.g., asp address, location, display size)
        address owner;      // Address of the ad service provider
        bool active;        // Activation status of the booth
        BoothStatus status; // Current status of the booth
    }

    // Struct to store campaign details
    struct Campaign {
        address advertiser;     // Address of the advertiser
        bytes metadata;         // Campaign metadata       
        bool active;            // Whether the campaign is active
        uint[] bookedLocations; // Array of booked device IDs
    }

    // Mapping of deviceId to Booth details
    mapping(uint => Booth) public booths;
    
    
    // Address of the admin (e.g., backend or deployer)
    address public admin;
    
    // Array to store all registered device IDs
    uint[] public allDeviceIds;

    // Mapping of campaignId to Campaign details
    mapping(uint => Campaign) public campaigns;
    // Counter for generating unique campaign IDs
    uint public campaignCount;
    
    // Mapping of device ID to list of active campaign IDs
    mapping(uint => uint[]) public deviceToCampaigns;
    // Mapping of advertiser address to their campaign IDs
    mapping(address => uint[]) public advertiserToCampaigns;

    // Events for tracking actions
    event BoothRegistered(uint deviceId, bytes metadata, address owner);
    event BoothActivated(uint deviceId);
    event BoothDeactivated(uint deviceId);
    event BoothStatusUpdated(uint deviceId, BoothStatus status);
    event CampaignCreated(uint campaignId, address advertiser, bytes metadata);
    event LocationAddedToCampaign(uint campaignId, uint deviceId);
    event LocationRemovedFromCampaign(uint campaignId, uint deviceId);
    event CampaignEnded(uint campaignId);

    // Modifier to restrict access to booth owner or admin
    modifier onlyOwnerOrAdmin(uint deviceId) {
        require(
            msg.sender == booths[deviceId].owner || msg.sender == admin,
            "Not authorized"
        );
        _;
    }

    // Modifier to restrict access to admin (backend)
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    // Modifier to ensure only the campaign owner can modify it
    modifier onlyCampaignOwner(uint campaignId) {
        require(
            msg.sender == campaigns[campaignId].advertiser,
            "Only the campaign owner can perform this action"
        );
        _;
    }

    // Constructor sets the deployer as the admin
    constructor() {
        admin = msg.sender;
    }

    // Register a new booth (called by backend after assigning deviceId)
    function registerBooth(uint _deviceId, bytes memory metadata) external {
    require(booths[_deviceId].deviceId == 0, "Device ID already registered");

    // Store the booth details
    booths[_deviceId] = Booth({
            deviceId: _deviceId,
        metadata: metadata,
            owner: msg.sender,
            active: true,
            status: BoothStatus.Unbooked
    });

    allDeviceIds.push(_deviceId);

        emit BoothRegistered(_deviceId, metadata, msg.sender);
    }

    // Activate a booth
    function activateBooth(uint _deviceId) external onlyOwnerOrAdmin(_deviceId) {
        require(booths[_deviceId].deviceId > 0, "Booth does not exist");
        booths[_deviceId].active = true;
        emit BoothActivated(_deviceId);
    }

    // Deactivate a booth
    function deactivateBooth(uint _deviceId) external onlyOwnerOrAdmin(_deviceId) {
        require(booths[_deviceId].deviceId > 0, "Booth does not exist");
        booths[_deviceId].active = false;
        emit BoothDeactivated(_deviceId);
        emit BoothStatusUpdated(_deviceId, BoothStatus.UnderMaintenance);
    }

    // Update booth status
    function updateBoothStatus(uint _deviceId, BoothStatus _status) external onlyOwnerOrAdmin(_deviceId) {
        require(booths[_deviceId].deviceId > 0, "Booth does not exist");
        booths[_deviceId].status = _status;
        emit BoothStatusUpdated(_deviceId, _status);
    }

    // Get booth details with status
    function getBoothDetails(uint _deviceId) external view returns (
        uint deviceId,
        bytes memory metadata,
        address owner,
        bool active,
        BoothStatus status
    ) {
        Booth memory booth = booths[_deviceId];
        require(booth.deviceId > 0, "Booth does not exist");
        return (
            booth.deviceId,
            booth.metadata,
            booth.owner,
            booth.active,
            booth.status
        );
    }
    
    // Get all active booths (for advertisers to browse)
    function getActiveBooths() external view returns (uint[] memory) {
        uint activeCount = 0;
        
        // First, count active booths
        for (uint i = 0; i < allDeviceIds.length; i++) {
            if (booths[allDeviceIds[i]].active) {
                activeCount++;
            }
        }
        
        // Then create and populate the array of active device IDs
        uint[] memory activeDeviceIds = new uint[](activeCount);
        uint index = 0;
        
        for (uint i = 0; i < allDeviceIds.length; i++) {
            if (booths[allDeviceIds[i]].active) {
                activeDeviceIds[index] = allDeviceIds[i];
                index++;
            }
        }
        
        return activeDeviceIds;
    }

    // Create a new campaign with at least one location
    // Allows multiple locations to be added during creation
    function createCampaign(bytes calldata _metadata, uint[] calldata _deviceIds) external returns (uint) {
        require(_deviceIds.length > 0, "At least one location must be provided");
        
        // Verify all deviceIds are valid and available
        for (uint i = 0; i < _deviceIds.length; i++) {
            uint deviceId = _deviceIds[i];
            require(booths[deviceId].deviceId > 0, "Booth does not exist");
            require(booths[deviceId].active, "Booth is not active");
            require(booths[deviceId].status == BoothStatus.Unbooked, "Booth is not available");
        }
        
        campaignCount++;
        
        // Create a storage array for the booked locations
        uint[] storage bookedLocations = campaigns[campaignCount].bookedLocations;
        
        // Create the campaign
        campaigns[campaignCount] = Campaign({
            advertiser: msg.sender,
            metadata: _metadata,
            active: true,
            bookedLocations: new uint[](0)  // Initialize with empty array, will be filled below
        });
        
        advertiserToCampaigns[msg.sender].push(campaignCount);
        
        // Add all provided locations
        for (uint i = 0; i < _deviceIds.length; i++) {
            uint deviceId = _deviceIds[i];
            
            // Add device to campaign's locations
            campaigns[campaignCount].bookedLocations.push(deviceId);
            
            // Update booth status
            booths[deviceId].status = BoothStatus.Booked;
            
            // Add to device's campaigns
            deviceToCampaigns[deviceId].push(campaignCount);
            
            emit LocationAddedToCampaign(campaignCount, deviceId);
        }
        
        emit CampaignCreated(campaignCount, msg.sender, _metadata);
        
        return campaignCount;
    }

    // Add a location to a campaign
    function addLocationToCampaign(uint _campaignId, uint _deviceId) external onlyCampaignOwner(_campaignId) {
        require(booths[_deviceId].deviceId > 0, "Booth does not exist");
        require(booths[_deviceId].active, "Booth is not active");
        require(booths[_deviceId].status == BoothStatus.Unbooked, "Booth is not available");
        require(campaigns[_campaignId].active, "Campaign is not active");
        
        Campaign storage campaign = campaigns[_campaignId];
        
        // Check if device is already added
        for(uint i = 0; i < campaign.bookedLocations.length; i++) {
            require(campaign.bookedLocations[i] != _deviceId, "Location already added to this campaign");
        }
        
        // Add device to campaign's locations
        campaign.bookedLocations.push(_deviceId);
        
        // Update booth status
        booths[_deviceId].status = BoothStatus.Booked;
        
        // Add to device's campaigns
        deviceToCampaigns[_deviceId].push(_campaignId);
        
        emit LocationAddedToCampaign(_campaignId, _deviceId);
    }

    // Remove a location from a campaign
    function removeLocationFromCampaign(uint _campaignId, uint _deviceId) external onlyCampaignOwner(_campaignId) {
        require(campaigns[_campaignId].active, "Campaign is not active");
        
        Campaign storage campaign = campaigns[_campaignId];
        
        // Find and remove device from campaign's locations
        bool found = false;
        for(uint i = 0; i < campaign.bookedLocations.length; i++) {
            if(campaign.bookedLocations[i] == _deviceId) {
                campaign.bookedLocations[i] = campaign.bookedLocations[campaign.bookedLocations.length - 1];
                campaign.bookedLocations.pop();
                found = true;
                break;
            }
        }
        require(found, "Location not found in this campaign");
        
        // Update booth status
        booths[_deviceId].status = BoothStatus.Unbooked;
        
        // Remove campaign from device's campaigns
        uint[] storage deviceCampaigns = deviceToCampaigns[_deviceId];
        for(uint i = 0; i < deviceCampaigns.length; i++) {
            if(deviceCampaigns[i] == _campaignId) {
                deviceCampaigns[i] = deviceCampaigns[deviceCampaigns.length - 1];
                deviceCampaigns.pop();
                break;
            }
        }
        
        emit LocationRemovedFromCampaign(_campaignId, _deviceId);
    }

    // Get all locations of a campaign
    function getCampaignLocations(uint _campaignId) external view returns (uint[] memory) {
        return campaigns[_campaignId].bookedLocations;
    }

    // Get all active locations
    function getActiveLocations() external view returns (uint[] memory) {
        uint activeCount = 0;
        
        // Count active and unbooked booths
        for (uint i = 0; i < allDeviceIds.length; i++) {
            if (booths[allDeviceIds[i]].active && booths[allDeviceIds[i]].status == BoothStatus.Unbooked) {
                activeCount++;
            }
        }
        
        // Create and populate array of active device IDs
        uint[] memory activeDeviceIds = new uint[](activeCount);
        uint index = 0;
        
        for (uint i = 0; i < allDeviceIds.length; i++) {
            if (booths[allDeviceIds[i]].active && booths[allDeviceIds[i]].status == BoothStatus.Unbooked) {
                activeDeviceIds[index] = allDeviceIds[i];
                index++;
            }
        }
        
        return activeDeviceIds;
    }

    // Get all locations of a provider
    function getProviderLocations(address _provider) external view returns (uint[] memory) {
        uint[] memory providerLocations = new uint[](allDeviceIds.length);
        uint index = 0;
        for (uint i = 0; i < allDeviceIds.length; i++) {
            if (booths[allDeviceIds[i]].owner == _provider) {
                providerLocations[index] = allDeviceIds[i];
                index++;
            }
        }
        return providerLocations;
    }

    // Get campaign details
    function getCampaignDetails(uint _campaignId) external view returns (
        address advertiser,
        bytes memory metadata,
        bool active,
        uint[] memory bookedLocations
    ) {
        Campaign memory campaign = campaigns[_campaignId];
        return (
            campaign.advertiser,
            campaign.metadata,
            campaign.active,
            campaign.bookedLocations
        );
    }

    // Get previous campaign details for a device
    function getDevicePreviousCampaigns(uint _deviceId) external view returns (
        uint[] memory campaignIds,
        address[] memory advertisers,
        bytes[] memory metadata,
        bool[] memory activeStatus
    ) {
        require(booths[_deviceId].deviceId > 0, "Device does not exist");
        
        uint[] memory deviceCampaignIds = deviceToCampaigns[_deviceId];
        uint length = deviceCampaignIds.length;
        
        // Initialize arrays
        campaignIds = new uint[](length);
        advertisers = new address[](length);
        metadata = new bytes[](length);
        activeStatus = new bool[](length);
        
        // Populate arrays with campaign details
        for(uint i = 0; i < length; i++) {
            uint campaignId = deviceCampaignIds[i];
            Campaign memory campaign = campaigns[campaignId];
            
            campaignIds[i] = campaignId;
            advertisers[i] = campaign.advertiser;
            metadata[i] = campaign.metadata;
            activeStatus[i] = campaign.active;
        }
        
        return (campaignIds, advertisers, metadata, activeStatus);
    }
}
