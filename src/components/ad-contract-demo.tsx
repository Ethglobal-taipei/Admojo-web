'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAdContract } from '@/hooks/use-ad-contract';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from '@/lib/toast';
import { 
  CirclePlus, 
  Bookmark, 
  Play, 
  Info, 
  Loader2, 
  Check, 
  X,
  ListPlus,
  Map,
  Plus,
  AlertCircle
} from 'lucide-react';
import { type Hash } from 'viem';
import { Badge } from '@/components/ui/badge';

// Helper function to format IDs for display
function formatId(id: string): string {
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

export default function AdContractDemo() {
  const { operations, adContract, isLoading, pendingTransactions, error, chainId, isCorrectChain, switchChain } = useAdContract();
  const { authenticated } = usePrivy();
  
  // State for campaign operations
  const [campaignId, setCampaignId] = useState<string>('');
  const [createdCampaignId, setCreatedCampaignId] = useState<string>('');
  const [transactionHash, setTransactionHash] = useState<Hash | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  
  // State for location operations
  const [locationId, setLocationId] = useState<string>('');
  const [amount, setAmount] = useState<string>('1000');
  
  // Fetch token balance when contract is ready
  useEffect(() => {
    const fetchBalance = async () => {
      if (adContract && authenticated) {
        const balance = await operations.getTokenBalance.execute();
        if (balance) {
          setTokenBalance(balance);
        }
      }
    };
    
    fetchBalance();
  }, [adContract, authenticated, operations.getTokenBalance]);

  // Generate a random campaign ID for demo purposes
  const generateRandomCampaignId = () => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    return '0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Create a new campaign
  const handleCreateCampaign = async () => {
    if (!authenticated) {
      toast(
        "Wallet not connected",
        { description: "Please connect your wallet first." },
        "error"
      );
      return;
    }

    // Check if on correct network
    if (!isCorrectChain) {
      toast(
        "Wrong Network",
        { description: "Please switch to Holesky testnet to continue." },
        "error"
      );
      return;
    }

    try {
      // Generate unique campaign ID
      const newCampaignId = generateRandomCampaignId();
      
      // Current timestamp + 1 day (in seconds)
      const startDate = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      // Duration in days
      const durationDays = 30;
      
      // Mock content URI
      const contentURI = "ipfs://QmYpfrsDB1DVNprp2mvKQVmXUHNRXUBvFaeCzJW5V9i9na";

      console.log("Creating campaign with ID:", newCampaignId);
      
      // Send transaction to create campaign
      const hash = await operations.createCampaign.execute(
        newCampaignId,
        startDate,
        durationDays,
        contentURI
      );
      
      if (hash) {
        // Store values
        setCreatedCampaignId(newCampaignId);
        setTransactionHash(hash);
        
        toast(
          "Campaign Creation Initiated",
          { description: "Transaction has been submitted to the blockchain." },
          "success"
        );
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
      toast(
        "Campaign Creation Failed",
        { description: err instanceof Error ? err.message : "Unknown error occurred" },
        "error"
      );
    }
  };

  // Add location to campaign
  const handleAddLocation = async () => {
    if (!authenticated || !createdCampaignId) {
      toast(
        "Cannot Add Location",
        { description: "Please create a campaign first." },
        "error"
      );
      return;
    }

    // Check if on correct network
    if (!isCorrectChain) {
      toast(
        "Wrong Network",
        { description: "Please switch to Holesky testnet to continue." },
        "error"
      );
      return;
    }

    if (!locationId) {
      toast(
        "Missing Location ID",
        { description: "Please enter a location ID." },
        "warning"
      );
      return;
    }

    try {
      // Format location ID as hex if needed
      const formattedLocationId = locationId.startsWith('0x') ? locationId : `0x${locationId}`;
      
      // Convert amount to bigint
      const amountBigInt = BigInt(Number(amount) * 10**18); // Convert to wei
      
      // Send transaction
      const hash = await operations.addLocationToCampaign.execute(
        createdCampaignId,
        formattedLocationId,
        amountBigInt
      );
      
      if (hash) {
        setTransactionHash(hash);
        
        toast(
          "Location Addition Initiated",
          { description: "Transaction has been submitted to the blockchain." },
          "success"
        );
      }
    } catch (err) {
      console.error("Error adding location:", err);
      toast(
        "Adding Location Failed",
        { description: err instanceof Error ? err.message : "Unknown error occurred" },
        "error"
      );
    }
  };

  // Activate campaign
  const handleActivateCampaign = async () => {
    if (!authenticated || !createdCampaignId) {
      toast(
        "Cannot Activate Campaign",
        { description: "Please create a campaign first." },
        "error"
      );
      return;
    }

    // Check if on correct network
    if (!isCorrectChain) {
      toast(
        "Wrong Network",
        { description: "Please switch to Holesky testnet to continue." },
        "error"
      );
      return;
    }

    try {
      const hash = await operations.activateCampaign.execute(createdCampaignId);
      
      if (hash) {
        setTransactionHash(hash);
        
        toast(
          "Campaign Activation Initiated",
          { description: "Transaction has been submitted to the blockchain." },
          "success"
        );
      }
    } catch (err) {
      console.error("Error activating campaign:", err);
      toast(
        "Campaign Activation Failed",
        { description: err instanceof Error ? err.message : "Unknown error occurred" },
        "error"
      );
    }
  };

  // View campaign details
  const handleViewCampaign = async () => {
    const targetCampaignId = campaignId || createdCampaignId;
    
    if (!targetCampaignId) {
      toast(
        "Cannot View Campaign",
        { description: "Please create a campaign or enter a campaign ID." },
        "error"
      );
      return;
    }

    // Check if on correct network
    if (!isCorrectChain) {
      toast(
        "Wrong Network",
        { description: "Please switch to Holesky testnet to continue." },
        "error"
      );
      return;
    }

    try {
      const details = await operations.getCampaignDetails.execute(targetCampaignId);
      console.log("Campaign details:", details);
      setCampaignDetails(details);
      
      toast(
        "Campaign Details Retrieved",
        { description: "Campaign details have been loaded." },
        "success"
      );
    } catch (err) {
      console.error("Error fetching campaign details:", err);
      toast(
        "Error Retrieving Campaign",
        { description: err instanceof Error ? err.message : "Unknown error occurred" },
        "error"
      );
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // Network warning banner
  const NetworkWarning = () => {
    if (!chainId || isCorrectChain) return null;
    
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <p className="font-bold">Wrong Network Detected</p>
            <p className="text-sm">
              Current Network ID: {chainId}. Expected: 17000 (Holesky)
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={switchChain}
              className="mt-2 bg-red-50 hover:bg-red-100 border-red-200"
            >
              Switch to Holesky Testnet
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render error state
  if (error) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-md p-4 my-4">
        <h3 className="text-lg font-bold text-red-700">Contract Error</h3>
        <p className="text-red-700">{error.message}</p>
        
        {error.message.includes('wallet provider') && (
          <div className="mt-4">
            <p className="font-medium">Possible solutions:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Make sure your wallet is properly connected</li>
              <li>Try refreshing the page and reconnecting</li>
              <li>Use a compatible wallet (MetaMask, Coinbase Wallet, etc.)</li>
            </ul>
          </div>
        )}
        
        {error.message.includes('chain') && (
          <div className="mt-4">
            <p>You need to switch to the Holesky testnet to use this application.</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={switchChain}
            >
              Switch to Holesky Testnet
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading contract system...</p>
      </div>
    );
  }

  // Render content when the contract is available
  return (
    <div className="space-y-6">
      {/* Network Status */}
      {chainId && (
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={isCorrectChain ? "outline" : "destructive"} className="h-6 px-2 py-1">
            {isCorrectChain ? 
              <Check className="h-3.5 w-3.5 mr-1" /> : 
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
            }
            Network: {isCorrectChain ? 'Holesky Testnet' : `Wrong Network (ID: ${chainId})`}
          </Badge>
          
          {!isCorrectChain && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={switchChain}
              className="h-6 px-2 py-1 text-xs"
            >
              Switch to Holesky
            </Button>
          )}
        </div>
      )}

      <NetworkWarning />
      
      <div className="p-6 border-4 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white mb-8">
        <h2 className="text-2xl font-bold mb-4">Smart Contract Operations</h2>
        
        <div className="mb-6">
          <p className="mb-2">
            {!authenticated 
              ? "Connect your wallet to interact with ad contracts" 
              : isLoading 
                ? "Loading contract..." 
                : adContract 
                  ? `Contract Ready (Connected as: ${adContract.account.slice(0, 6)}...${adContract.account.slice(-4)})` 
                  : "Contract not initialized"}
          </p>
          
          {tokenBalance !== null && (
            <div className="px-4 py-2 bg-green-50 border border-green-200 rounded mb-4">
              <p className="font-medium">Token Balance: {(Number(tokenBalance) / 10**18).toFixed(2)} ADC</p>
            </div>
          )}
        </div>
        
        {/* Campaign Creation */}
        <div className="mb-8 p-4 border-2 border-dashed border-gray-300 bg-gray-50">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <CirclePlus className="mr-2 h-5 w-5" />
            Create Campaign
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Creates a new advertising campaign on the blockchain with a 30-day duration.
          </p>
          
          <Button
            onClick={handleCreateCampaign}
            disabled={!adContract || !authenticated || operations.createCampaign.isLoading}
            className="bg-[#0055FF] text-white border-2 border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {operations.createCampaign.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create New Campaign"
            )}
          </Button>
        </div>
        
        {/* Campaign Details */}
        {createdCampaignId && (
          <div className="mb-8 p-4 border-2 border-black bg-white">
            <h3 className="text-xl font-bold mb-3">Campaign Created</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold mb-1">Campaign ID:</p>
                <p className="font-mono text-xs bg-gray-100 p-2 break-all">{createdCampaignId}</p>
              </div>
              
              {transactionHash && (
                <div>
                  <p className="text-sm font-semibold mb-1">Latest Transaction:</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 break-all">{transactionHash}</p>
                </div>
              )}
            </div>
            
            {/* Transaction Status */}
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-2">Transaction Status:</h4>
              <div className="max-h-32 overflow-y-auto">
                {Array.from(pendingTransactions.entries()).map(([hash, { description, status }]) => (
                  <div key={hash} className="flex items-center mb-2 text-sm">
                    {status === 'pending' && <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />}
                    {status === 'confirmed' && <Check className="mr-2 h-4 w-4 text-green-500" />}
                    {status === 'failed' && <X className="mr-2 h-4 w-4 text-red-500" />}
                    <span className="font-medium">{description}:</span>
                    <span className={`ml-2 ${
                      status === 'pending' ? 'text-blue-600' : 
                      status === 'confirmed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions for the created campaign */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Add Location Section */}
              <div className="p-3 border border-gray-200 bg-gray-50">
                <h4 className="font-bold mb-2 flex items-center">
                  <ListPlus className="mr-1 h-4 w-4" />
                  Add Location
                </h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Location ID</label>
                  <input
                    type="text"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full p-2 border border-gray-300 text-sm"
                    placeholder="Enter location ID (hex)"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Amount (ADC)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 text-sm"
                    min="0"
                  />
                </div>
                
                <Button
                  onClick={handleAddLocation}
                  disabled={operations.addLocationToCampaign.isLoading || !locationId}
                  className="w-full bg-white text-black border border-black hover:bg-gray-100 transition-all text-sm py-1"
                >
                  {operations.addLocationToCampaign.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Location"
                  )}
                </Button>
              </div>
              
              {/* Activate Campaign */}
              <div className="p-3 border border-gray-200 bg-gray-50">
                <h4 className="font-bold mb-2 flex items-center">
                  <Play className="mr-1 h-4 w-4" />
                  Activate Campaign
                </h4>
                
                <p className="text-xs text-gray-600 mb-4">
                  Start the campaign and make it live on the network.
                </p>
                
                <Button
                  onClick={handleActivateCampaign}
                  disabled={operations.activateCampaign.isLoading}
                  className="w-full bg-white text-black border border-black hover:bg-gray-100 transition-all text-sm py-1"
                >
                  {operations.activateCampaign.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Activate Campaign"
                  )}
                </Button>
              </div>
              
              {/* View Campaign Details */}
              <div className="p-3 border border-gray-200 bg-gray-50">
                <h4 className="font-bold mb-2 flex items-center">
                  <Info className="mr-1 h-4 w-4" />
                  View Details
                </h4>
                
                <p className="text-xs text-gray-600 mb-4">
                  Retrieve on-chain details for this campaign.
                </p>
                
                <Button
                  onClick={handleViewCampaign}
                  disabled={operations.getCampaignDetails.isLoading}
                  className="w-full bg-white text-black border border-black hover:bg-gray-100 transition-all text-sm py-1"
                >
                  {operations.getCampaignDetails.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "View Details"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* View Any Campaign Section */}
        <div className="mb-8 p-4 border-2 border-gray-300 bg-gray-50">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <Bookmark className="mr-2 h-5 w-5" />
            View Any Campaign
          </h3>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-grow">
              <input
                type="text"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full p-2 border-2 border-gray-300"
                placeholder="Enter campaign ID (hex)"
              />
            </div>
            
            <Button
              onClick={handleViewCampaign}
              disabled={operations.getCampaignDetails.isLoading || (!campaignId && !createdCampaignId)}
              className="bg-gray-800 text-white hover:bg-gray-700 transition-all font-bold px-4 py-2"
            >
              {operations.getCampaignDetails.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "View"
              )}
            </Button>
          </div>
        </div>
        
        {/* Campaign Details Display */}
        {campaignDetails && (
          <div className="p-4 border-2 border-black bg-white">
            <h3 className="text-xl font-bold mb-4">Campaign Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-sm font-semibold">Advertiser:</p>
                <p className="font-mono text-xs bg-gray-100 p-1">{campaignDetails[0]}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold">Total Budget:</p>
                <p>{Number(campaignDetails[2]) / 10**18} ADC</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold">Start Date:</p>
                <p>{formatTimestamp(campaignDetails[4])}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold">End Date:</p>
                <p>{formatTimestamp(campaignDetails[5])}</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold">Duration:</p>
                <p>{campaignDetails[6].toString()} days</p>
              </div>
              
              <div>
                <p className="text-sm font-semibold">Status:</p>
                <p className={`font-bold ${campaignDetails[7] ? 'text-green-600' : 'text-amber-600'}`}>
                  {campaignDetails[7] ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm font-semibold">Content URI:</p>
                <p className="font-mono text-xs break-all bg-gray-100 p-1">{campaignDetails[8]}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm font-semibold mb-1">Location IDs ({campaignDetails[1].length}):</p>
                {campaignDetails[1].length > 0 ? (
                  <div className="max-h-32 overflow-y-auto bg-gray-100 p-2">
                    {campaignDetails[1].map((locationId: string, index: number) => (
                      <div key={index} className="flex items-center mb-1">
                        <Map className="mr-1 h-3 w-3 text-gray-600" />
                        <span className="font-mono text-xs">{locationId}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No locations added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 