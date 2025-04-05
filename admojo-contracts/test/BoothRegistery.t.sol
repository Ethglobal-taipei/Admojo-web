// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// import "forge-std/Test.sol";
// import "../src/BoothRegistery.sol";

// contract BoothRegisteryTest is Test {
//     BoothRegistery public registry;
    
//     // Test accounts
//     address public admin;
//     address public boothOwner1;
//     address public boothOwner2;
//     address public advertiser1;
//     address public advertiser2;
//     address public nonOwner;
    
//     // Test data
//     uint public constant DEVICE_ID_1 = 1;
//     uint public constant DEVICE_ID_2 = 2;
//     uint public constant DEVICE_ID_3 = 3;
//     uint public constant NONEXISTENT_DEVICE_ID = 999;
//     bytes public metadata1 = abi.encode("Location: NYC, Size: Large");
//     bytes public metadata2 = abi.encode("Location: LA, Size: Medium");
//     bytes public campaignMetadata1 = abi.encode("Summer Campaign 2025");
//     bytes public campaignMetadata2 = abi.encode("Winter Campaign 2025");
    
//     // Events for verification
//     event BoothRegistered(uint deviceId, bytes metadata, address owner);
//     event BoothActivated(uint deviceId);
//     event BoothDeactivated(uint deviceId);
//     event BoothStatusUpdated(uint deviceId, BoothRegistery.BoothStatus status);
//     event CampaignCreated(uint campaignId, address advertiser, bytes metadata);
//     event LocationAddedToCampaign(uint campaignId, uint deviceId);
//     event LocationRemovedFromCampaign(uint campaignId, uint deviceId);
//     event CampaignEnded(uint campaignId);
    
//     function setUp() public {
//         // Set up accounts
//         admin = address(this);
//         boothOwner1 = makeAddr("boothOwner1");
//         boothOwner2 = makeAddr("boothOwner2");
//         advertiser1 = makeAddr("advertiser1");
//         advertiser2 = makeAddr("advertiser2");
//         nonOwner = makeAddr("nonOwner");
        
//         // Deploy contract
//         registry = new BoothRegistery();
        
//         // Fund accounts
//         vm.deal(boothOwner1, 10 ether);
//         vm.deal(boothOwner2, 10 ether);
//         vm.deal(advertiser1, 10 ether);
//         vm.deal(advertiser2, 10 ether);
//         vm.deal(nonOwner, 10 ether);
//     }
    
//     // ================ BOOTH REGISTRATION TESTS ================
    
//     function test_RegisterBooth() public {
//         // Register booth
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Check booth details
//         (uint deviceId, bytes memory meta, address owner, bool active, BoothRegistery.BoothStatus status) = registry.getBoothDetails(DEVICE_ID_1);
        
//         assertEq(deviceId, DEVICE_ID_1);
//         assertEq(keccak256(meta), keccak256(metadata1));
//         assertEq(owner, admin);
//         assertTrue(active);
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Unbooked));
        
//         // Check booth count
//         assertEq(registry.boothCount(), 1);
//     }
    
//     function test_RegisterMultipleBooths() public {
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         assertEq(registry.boothCount(), 2);
        
//         // Verify both devices are in the activeBooths array
//         uint[] memory activeBooths = registry.getActiveBooths();
//         assertEq(activeBooths.length, 2);
//     }
    
//     function test_RevertWhen_RegisteringDuplicateBooth() public {
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         vm.expectRevert("Device ID already registered");
//         registry.registerBooth(DEVICE_ID_1, metadata2);
//     }
    
//     function test_RevertWhen_NonAdminRegistersBooths() public {
//         vm.prank(nonOwner);
//         vm.expectRevert("Only admin can call this function");
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//     }
    
//     // ================ BOOTH ACTIVATION/DEACTIVATION TESTS ================
    
//     function test_ActivateDeactivateBooth() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Verify initial status
//         (,,,bool active, BoothRegistery.BoothStatus status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertTrue(active);
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Unbooked));
        
//         // Deactivate booth - this updates active to false but doesn't change status
//         // The contract emits a BoothStatusUpdated event but doesn't actually update the status field
//         registry.deactivateBooth(DEVICE_ID_1);
        
//         // Check active flag is false after deactivation
//         (,,,active, status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertFalse(active);
//         // Status should still be Unbooked (0) since deactivateBooth doesn't update the status field
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Unbooked));
        
//         // Reactivate
//         registry.activateBooth(DEVICE_ID_1);
        
//         // Check active is true after reactivation
//         (,,,active,status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertTrue(active);
//         // Status should still be Unbooked (0)
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Unbooked));
        
//         // Now explicitly update the status to UnderMaintenance
//         registry.updateBoothStatus(DEVICE_ID_1, BoothRegistery.BoothStatus.UnderMaintenance);
//         (,,,active,status) = registry.getBoothDetails(DEVICE_ID_1);
//         // Status should now be UnderMaintenance (2)
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.UnderMaintenance));
//     }
    
//     function test_RevertWhen_ActivatingNonexistentBooth() public {
//         vm.expectRevert("Booth does not exist");
//         registry.activateBooth(NONEXISTENT_DEVICE_ID);
//     }
    
//     function test_RevertWhen_DeactivatingNonexistentBooth() public {
//         vm.expectRevert("Booth does not exist");
//         registry.deactivateBooth(NONEXISTENT_DEVICE_ID);
//     }
    
//     function test_RevertWhen_UnauthorizedUserActivatesBooth() public {
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         vm.prank(nonOwner);
//         vm.expectRevert("Not authorized");
//         registry.activateBooth(DEVICE_ID_1);
//     }
    
//     function test_UpdateBoothStatus() public {
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         registry.updateBoothStatus(DEVICE_ID_1, BoothRegistery.BoothStatus.Booked);
        
//         (,,,,BoothRegistery.BoothStatus status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Booked));
//     }
    
//     function test_RevertWhen_UpdatingNonexistentBoothStatus() public {
//         vm.expectRevert("Booth does not exist");
//         registry.updateBoothStatus(NONEXISTENT_DEVICE_ID, BoothRegistery.BoothStatus.Booked);
//     }
    
//     // ================ BOOTH QUERIES TESTS ================
    
//     function test_GetActiveBooths() public {
//         // Register and set up booths
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.deactivateBooth(DEVICE_ID_2);
        
//         // Get active booths
//         uint[] memory activeBooths = registry.getActiveBooths();
        
//         // Verify
//         assertEq(activeBooths.length, 1);
//         assertEq(activeBooths[0], DEVICE_ID_1);
//     }
    
//     function test_GetActiveLocations() public {
//         // Register and set up booths
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.updateBoothStatus(DEVICE_ID_2, BoothRegistery.BoothStatus.Booked);
        
//         // Get active locations
//         uint[] memory activeLocations = registry.getActiveLocations();
        
//         // Verify
//         assertEq(activeLocations.length, 1);
//         assertEq(activeLocations[0], DEVICE_ID_1);
//     }
    
//     function test_RevertWhen_QueryingNonexistentBoothDetails() public {
//         vm.expectRevert("Booth does not exist");
//         registry.getBoothDetails(NONEXISTENT_DEVICE_ID);
//     }
    
//     // ================ CAMPAIGN CREATION TESTS ================
    
//     function test_CreateCampaign() public {
//         // Setup - register a booth first as campaigns require at least one location
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Create an array with one location
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Verify
//         assertEq(campaignId, 1);
        
//         // Check campaign details
//         (address advertiser, bytes memory metadata, bool active, uint[] memory bookedLocations) = registry.getCampaignDetails(campaignId);
//         assertEq(advertiser, advertiser1);
//         assertEq(keccak256(metadata), keccak256(campaignMetadata1));
//         assertTrue(active);
        
//         // Check that the location was added
//         assertEq(bookedLocations.length, 1);
//         assertEq(bookedLocations[0], DEVICE_ID_1);
        
//         // Check booth status is now Booked
//         (,,,,BoothRegistery.BoothStatus status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Booked));
//     }
    
//     function test_CreateMultipleCampaigns() public {
//         // Setup - register booths first
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create location arrays
//         uint[] memory locations1 = new uint[](1);
//         locations1[0] = DEVICE_ID_1;
        
//         uint[] memory locations2 = new uint[](1);
//         locations2[0] = DEVICE_ID_2;
        
//         vm.startPrank(advertiser1);
//         uint campaignId1 = registry.createCampaign(campaignMetadata1, locations1);
//         uint campaignId2 = registry.createCampaign(campaignMetadata2, locations2);
//         vm.stopPrank();
        
//         // Verify
//         assertEq(campaignId1, 1);
//         assertEq(campaignId2, 2);
//         assertEq(registry.campaignCount(), 2);
//     }

//     function test_CreateCampaignWithMultipleLocations() public {
//         // Setup - register booths
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.registerBooth(DEVICE_ID_3, abi.encode("Location: Chicago, Size: Small"));
        
//         // Create location array with multiple locations
//         uint[] memory locations = new uint[](3);
//         locations[0] = DEVICE_ID_1;
//         locations[1] = DEVICE_ID_2;
//         locations[2] = DEVICE_ID_3;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Verify campaign creation
//         assertEq(campaignId, 1);
        
//         // Check campaign details and locations
//         (,,, uint[] memory bookedLocations) = registry.getCampaignDetails(campaignId);
//         assertEq(bookedLocations.length, 3);
        
//         // Verify all locations are in the campaign
//         bool foundLocation1 = false;
//         bool foundLocation2 = false;
//         bool foundLocation3 = false;
        
//         for (uint i = 0; i < bookedLocations.length; i++) {
//             if (bookedLocations[i] == DEVICE_ID_1) foundLocation1 = true;
//             if (bookedLocations[i] == DEVICE_ID_2) foundLocation2 = true;
//             if (bookedLocations[i] == DEVICE_ID_3) foundLocation3 = true;
//         }
        
//         assertTrue(foundLocation1);
//         assertTrue(foundLocation2);
//         assertTrue(foundLocation3);
        
//         // Check that all booths are now booked
//         (,,,,BoothRegistery.BoothStatus status1) = registry.getBoothDetails(DEVICE_ID_1);
//         (,,,,BoothRegistery.BoothStatus status2) = registry.getBoothDetails(DEVICE_ID_2);
//         (,,,,BoothRegistery.BoothStatus status3) = registry.getBoothDetails(DEVICE_ID_3);
        
//         assertEq(uint(status1), uint(BoothRegistery.BoothStatus.Booked));
//         assertEq(uint(status2), uint(BoothRegistery.BoothStatus.Booked));
//         assertEq(uint(status3), uint(BoothRegistery.BoothStatus.Booked));
//     }

//     function test_RevertWhen_CreatingCampaignWithNoLocations() public {
//         vm.prank(advertiser1);
//         uint[] memory emptyLocations = new uint[](0);
        
//         vm.expectRevert("At least one location must be provided");
//         registry.createCampaign(campaignMetadata1, emptyLocations);
//     }

//     function test_RevertWhen_CreatingCampaignWithNonexistentLocation() public {
//         // Try to create campaign with non-existent deviceId
//         uint[] memory locations = new uint[](1);
//         locations[0] = NONEXISTENT_DEVICE_ID;
        
//         vm.prank(advertiser1);
//         vm.expectRevert("Booth does not exist");
//         registry.createCampaign(campaignMetadata1, locations);
//     }

//     function test_RevertWhen_CreatingCampaignWithInactiveLocation() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.deactivateBooth(DEVICE_ID_1);
        
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser1);
//         vm.expectRevert("Booth is not active");
//         registry.createCampaign(campaignMetadata1, locations);
//     }

//     function test_RevertWhen_CreatingCampaignWithAlreadyBookedLocation() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Create first campaign that books the location
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser1);
//         registry.createCampaign(campaignMetadata1, locations);
        
//         // Try to create another campaign with the same location
//         vm.prank(advertiser2);
//         vm.expectRevert("Booth is not available");
//         registry.createCampaign(campaignMetadata2, locations);
//     }
    
//     // ================ LOCATION BOOKING TESTS ================
    
//     function test_AddLocationToCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create location array with one location
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Add another location
//         registry.addLocationToCampaign(campaignId, DEVICE_ID_2);
//         vm.stopPrank();
        
//         // Verify
//         (,,, uint[] memory bookedLocations) = registry.getCampaignDetails(campaignId);
//         assertEq(bookedLocations.length, 2);
        
//         // Check both locations are in the campaign
//         bool foundLocation1 = false;
//         bool foundLocation2 = false;
        
//         for (uint i = 0; i < bookedLocations.length; i++) {
//             if (bookedLocations[i] == DEVICE_ID_1) foundLocation1 = true;
//             if (bookedLocations[i] == DEVICE_ID_2) foundLocation2 = true;
//         }
        
//         assertTrue(foundLocation1);
//         assertTrue(foundLocation2);
        
//         // Check booth status
//         (,,,,BoothRegistery.BoothStatus status2) = registry.getBoothDetails(DEVICE_ID_2);
//         assertEq(uint(status2), uint(BoothRegistery.BoothStatus.Booked));
//     }
    
//     function test_RevertWhen_AddingLocationToNonexistentCampaign() public {
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         vm.prank(advertiser1);
//         // No specific error message for non-existent campaign, but it should revert
//         vm.expectRevert();
//         registry.addLocationToCampaign(999, DEVICE_ID_1);
//     }
    
//     function test_RevertWhen_AddingNonexistentLocationToCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Create campaign
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         vm.expectRevert("Booth does not exist");
//         registry.addLocationToCampaign(campaignId, NONEXISTENT_DEVICE_ID);
//         vm.stopPrank();
//     }
    
//     function test_RevertWhen_AddingInactiveLocationToCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.deactivateBooth(DEVICE_ID_2);
        
//         // Create campaign
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         vm.expectRevert("Booth is not active");
//         registry.addLocationToCampaign(campaignId, DEVICE_ID_2);
//         vm.stopPrank();
//     }
    
//     function test_RevertWhen_AddingAlreadyBookedLocationToCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create first campaign with DEVICE_ID_1
//         uint[] memory locations1 = new uint[](1);
//         locations1[0] = DEVICE_ID_1;
        
//         // Create second campaign with DEVICE_ID_2
//         uint[] memory locations2 = new uint[](1);
//         locations2[0] = DEVICE_ID_2;
        
//         vm.startPrank(advertiser1);
//         uint campaignId1 = registry.createCampaign(campaignMetadata1, locations1);
//         vm.stopPrank();
        
//         vm.prank(advertiser2);
//         uint campaignId2 = registry.createCampaign(campaignMetadata2, locations2);
        
//         // Try to add DEVICE_ID_2 to campaign1
//         vm.prank(advertiser1);
//         vm.expectRevert("Booth is not available");
//         registry.addLocationToCampaign(campaignId1, DEVICE_ID_2);
//     }
    
//     function test_RevertWhen_UnauthorizedUserAddsLocationToCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create campaign with DEVICE_ID_1
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         vm.prank(advertiser2);
//         vm.expectRevert("Only the campaign owner can perform this action");
//         registry.addLocationToCampaign(campaignId, DEVICE_ID_2);
//     }
    
//     // ================ LOCATION REMOVAL TESTS ================
    
//     function test_RemoveLocationFromCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create campaign with multiple locations
//         uint[] memory locations = new uint[](2);
//         locations[0] = DEVICE_ID_1;
//         locations[1] = DEVICE_ID_2;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Remove one location
//         registry.removeLocationFromCampaign(campaignId, DEVICE_ID_1);
//         vm.stopPrank();
        
//         // Verify
//         (,,, uint[] memory bookedLocations) = registry.getCampaignDetails(campaignId);
//         assertEq(bookedLocations.length, 1);
//         assertEq(bookedLocations[0], DEVICE_ID_2);
        
//         // Check booth status of removed location
//         (,,,,BoothRegistery.BoothStatus status) = registry.getBoothDetails(DEVICE_ID_1);
//         assertEq(uint(status), uint(BoothRegistery.BoothStatus.Unbooked));
//     }

//     function test_RevertWhen_RemovingLastLocationFromCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Create campaign with one location
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Attempt to remove the only location
//         vm.expectRevert("Campaign must have at least one location");
//         registry.removeLocationFromCampaign(campaignId, DEVICE_ID_1);
//         vm.stopPrank();
//     }
    
//     function test_RevertWhen_RemovingLocationNotInCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.registerBooth(DEVICE_ID_3, abi.encode("Location: Chicago, Size: Small"));
        
//         // Create campaign with DEVICE_ID_1 and DEVICE_ID_2
//         uint[] memory locations = new uint[](2);
//         locations[0] = DEVICE_ID_1;
//         locations[1] = DEVICE_ID_2;
        
//         vm.startPrank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         vm.expectRevert("Location not found in this campaign");
//         registry.removeLocationFromCampaign(campaignId, DEVICE_ID_3);
//         vm.stopPrank();
//     }
    
//     function test_RevertWhen_UnauthorizedUserRemovesLocationFromCampaign() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create campaign with multiple locations
//         uint[] memory locations = new uint[](2);
//         locations[0] = DEVICE_ID_1;
//         locations[1] = DEVICE_ID_2;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         vm.prank(advertiser2);
//         vm.expectRevert("Only the campaign owner can perform this action");
//         registry.removeLocationFromCampaign(campaignId, DEVICE_ID_1);
//     }
    
//     // ================ CAMPAIGN QUERY TESTS ================
    
//     function test_GetCampaignLocations() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create campaign with multiple locations
//         uint[] memory locations = new uint[](2);
//         locations[0] = DEVICE_ID_1;
//         locations[1] = DEVICE_ID_2;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Get campaign locations
//         uint[] memory campaignLocations = registry.getCampaignLocations(campaignId);
        
//         // Verify
//         assertEq(campaignLocations.length, 2);
        
//         bool foundLocation1 = false;
//         bool foundLocation2 = false;
        
//         for (uint i = 0; i < campaignLocations.length; i++) {
//             if (campaignLocations[i] == DEVICE_ID_1) foundLocation1 = true;
//             if (campaignLocations[i] == DEVICE_ID_2) foundLocation2 = true;
//         }
        
//         assertTrue(foundLocation1);
//         assertTrue(foundLocation2);
//     }
    
//     function test_GetProviderLocations() public {
//         // Setup - register booths with different owners
//         registry.registerBooth(DEVICE_ID_1, metadata1); // Admin owns this
        
//         // Change booth owner for second booth
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Get provider locations
//         uint[] memory adminLocations = registry.getProviderLocations(admin);
        
//         // Verify
//         assertEq(adminLocations.length > 0, true); // Admin should have at least one booth
//         bool foundDevice1 = false;
//         for (uint i = 0; i < adminLocations.length; i++) {
//             if (adminLocations[i] == DEVICE_ID_1) {
//                 foundDevice1 = true;
//                 break;
//             }
//         }
//         assertTrue(foundDevice1);
//     }
    
//     function test_GetCampaignDetails() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Create campaign
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser1);
//         uint campaignId = registry.createCampaign(campaignMetadata1, locations);
        
//         // Get details
//         (address advertiser, bytes memory metadata, bool active, uint[] memory bookedLocations) = registry.getCampaignDetails(campaignId);
        
//         // Verify
//         assertEq(advertiser, advertiser1);
//         assertEq(keccak256(metadata), keccak256(campaignMetadata1));
//         assertTrue(active);
//         assertEq(bookedLocations.length, 1);
//         assertEq(bookedLocations[0], DEVICE_ID_1);
//     }
    
//     function test_GetDevicePreviousCampaigns() public {
//         // Setup
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Create location array with one location
//         uint[] memory locations1 = new uint[](1);
//         locations1[0] = DEVICE_ID_1;
        
//         vm.startPrank(advertiser1);
//         uint campaignId1 = registry.createCampaign(campaignMetadata1, locations1);
//         vm.stopPrank();
        
//         // First remove from campaign 1
//         vm.prank(advertiser1);
        
//         // Add a second location to campaign1 so we can remove DEVICE_ID_1
//         registry.addLocationToCampaign(campaignId1, DEVICE_ID_2);
//         registry.removeLocationFromCampaign(campaignId1, DEVICE_ID_1);
        
//         // Create second campaign
//         uint[] memory locations2 = new uint[](1);
//         locations2[0] = DEVICE_ID_1;
        
//         vm.prank(advertiser2);
//         uint campaignId2 = registry.createCampaign(campaignMetadata2, locations2);
        
//         // Get previous campaigns
//         (uint[] memory campaignIds, address[] memory advertisers, bytes[] memory metadatas, bool[] memory activeStatus) = 
//             registry.getDevicePreviousCampaigns(DEVICE_ID_1);
        
//         // Verify - the deviceToCampaigns array only keeps current campaign mappings, not historical ones
//         // So after removing from campaign1, only campaign2 remains in the device's campaign list
//         assertEq(campaignIds.length, 1);
//         assertEq(advertisers.length, 1);
//         assertEq(metadatas.length, 1);
//         assertEq(activeStatus.length, 1);
        
//         // Verify it's the second campaign
//         assertEq(campaignIds[0], campaignId2);
//         assertEq(advertisers[0], advertiser2);
//     }
    
//     function test_RevertWhen_GettingPreviousCampaignsForNonexistentDevice() public {
//         vm.expectRevert("Device does not exist");
//         registry.getDevicePreviousCampaigns(NONEXISTENT_DEVICE_ID);
//     }
    
//     // ================ COMPLEX SCENARIO TESTS ================
    
//     function test_CompleteAdCampaignLifecycle() public {
//         // 1. Register multiple booths
//         registry.registerBooth(DEVICE_ID_1, metadata1);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
//         registry.registerBooth(DEVICE_ID_3, abi.encode("Location: Chicago, Size: Small"));
        
//         // 2. Create campaign as advertiser1 with two locations
//         uint[] memory locations1 = new uint[](2);
//         locations1[0] = DEVICE_ID_1;
//         locations1[1] = DEVICE_ID_2;
        
//         vm.startPrank(advertiser1);
//         uint campaignId1 = registry.createCampaign(campaignMetadata1, locations1);
//         vm.stopPrank();
        
//         // 3. Create another campaign as advertiser2 with one location
//         uint[] memory locations2 = new uint[](1);
//         locations2[0] = DEVICE_ID_3;
        
//         vm.prank(advertiser2);
//         uint campaignId2 = registry.createCampaign(campaignMetadata2, locations2);
        
//         // 4. Check active locations (should be none, all booked)
//         uint[] memory activeLocations = registry.getActiveLocations();
//         assertEq(activeLocations.length, 0);
        
//         // 5. Advertiser1 removes a location
//         vm.prank(advertiser1);
//         registry.removeLocationFromCampaign(campaignId1, DEVICE_ID_1);
        
//         // 6. Check active locations again (should now include DEVICE_ID_1)
//         activeLocations = registry.getActiveLocations();
//         assertEq(activeLocations.length, 1);
//         assertEq(activeLocations[0], DEVICE_ID_1);
        
//         // 7. Advertiser2 books the newly available location
//         vm.prank(advertiser2);
//         registry.addLocationToCampaign(campaignId2, DEVICE_ID_1);
        
//         // 8. Check previous campaigns for DEVICE_ID_1
//         (uint[] memory campaignIds,,, bool[] memory activeStatus) = 
//             registry.getDevicePreviousCampaigns(DEVICE_ID_1);
        
//         // The deviceToCampaigns mapping only tracks current mappings, not historical ones
//         // After removing device from campaign1, only campaign2 is in the list
//         assertEq(campaignIds.length, 1);
//         assertEq(campaignIds[0], campaignId2);
//         assertTrue(activeStatus[0]); // Campaign2 is active
        
//         // 9. Deactivate a booth that's in a campaign
//         registry.deactivateBooth(DEVICE_ID_2);
        
//         // Get active booths (should only include DEVICE_ID_1 and DEVICE_ID_3)
//         uint[] memory activeBooths = registry.getActiveBooths();
//         assertEq(activeBooths.length, 2);
        
//         // Find DEVICE_ID_1 and DEVICE_ID_3 in active booths
//         bool foundDevice1 = false;
//         bool foundDevice3 = false;
//         for (uint i = 0; i < activeBooths.length; i++) {
//             if (activeBooths[i] == DEVICE_ID_1) foundDevice1 = true;
//             if (activeBooths[i] == DEVICE_ID_3) foundDevice3 = true;
//         }
//         assertTrue(foundDevice1);
//         assertTrue(foundDevice3);
        
//         // 10. Verify campaign1 locations still include DEVICE_ID_2 even though booth is inactive
//         uint[] memory campaign1Locations = registry.getCampaignLocations(campaignId1);
//         assertEq(campaign1Locations.length, 1);
//         assertEq(campaign1Locations[0], DEVICE_ID_2);
//     }
    
//     function test_EventEmission() public {
//         // Register booth for campaign tests
//         registry.registerBooth(DEVICE_ID_1, metadata1);
        
//         // Test BoothRegistered event
//         vm.expectEmit(true, true, true, true);
//         emit BoothRegistered(DEVICE_ID_2, metadata2, admin);
//         registry.registerBooth(DEVICE_ID_2, metadata2);
        
//         // Test BoothActivated event
//         vm.expectEmit(true, true, true, true);
//         emit BoothActivated(DEVICE_ID_1);
//         registry.activateBooth(DEVICE_ID_1);
        
//         // Test BoothStatusUpdated event
//         vm.expectEmit(true, true, true, true);
//         emit BoothStatusUpdated(DEVICE_ID_1, BoothRegistery.BoothStatus.UnderMaintenance);
//         registry.updateBoothStatus(DEVICE_ID_1, BoothRegistery.BoothStatus.UnderMaintenance);
        
//         // Reset booth status for campaign tests
//         registry.updateBoothStatus(DEVICE_ID_1, BoothRegistery.BoothStatus.Unbooked);
        
//         // Create array with one location for campaign creation
//         uint[] memory locations = new uint[](1);
//         locations[0] = DEVICE_ID_1;
        
//         // Test CampaignCreated and LocationAddedToCampaign events
//         vm.startPrank(advertiser1);
//         vm.expectEmit(true, true, true, true);
//         emit CampaignCreated(1, advertiser1, campaignMetadata1);
//         vm.expectEmit(true, true, true, true);
//         emit LocationAddedToCampaign(1, DEVICE_ID_1);
//         registry.createCampaign(campaignMetadata1, locations);
        
//         // Add another booth for removal test
//         registry.registerBooth(DEVICE_ID_3, abi.encode("Location: Chicago, Size: Small"));
//         registry.addLocationToCampaign(1, DEVICE_ID_3);
        
//         // Test LocationRemovedFromCampaign event
//         vm.expectEmit(true, true, true, true);
//         emit LocationRemovedFromCampaign(1, DEVICE_ID_3);
//         registry.removeLocationFromCampaign(1, DEVICE_ID_3);
//         vm.stopPrank();
//     }
// }