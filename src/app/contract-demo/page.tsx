'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import AdContractDemo from '@/components/ad-contract-demo';
import TransactionHistory from '@/components/transaction-history';
import { toast } from '@/lib/toast';
import { BlockchainProvider } from '@/hooks';

export default function ContractDemoPage() {
  const { login, authenticated, user } = usePrivy();

  const handleConnectWallet = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
      toast(
        "Login Failed",
        { description: "Failed to connect wallet. Please try again." },
        "error"
      );
    }
  };

  return (
    <BlockchainProvider>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-black mb-6">Smart Contract Integration Demo</h1>
        
        <div className="mb-8">
          <p className="text-lg mb-4">
            This page demonstrates how AdNet connects with blockchain smart contracts using Privy wallet integration.
          </p>
          
          <div className="bg-[#f5f5f5] p-6 border-2 border-dashed border-gray-400 mb-6">
            <h2 className="text-xl font-bold mb-2">How it works:</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Connect your wallet using Privy</li>
              <li>The AdContractSystem initializes with your wallet</li>
              <li>Create a new ad campaign on the blockchain</li>
              <li>View the transaction details and campaign data</li>
            </ol>
          </div>
          
          {!authenticated ? (
            <div className="flex flex-col items-center gap-4 p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white mb-8">
              <p className="text-lg font-bold">Connect your wallet to get started</p>
              <Button
                onClick={handleConnectWallet}
                className="bg-[#0055FF] text-white border-4 border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-lg px-6 py-5 h-auto rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-8">
              <div className="flex items-center">
                <div>
                  <p className="font-bold">Wallet Connected</p>
                  <p className="text-sm">
                    {user?.wallet?.address ? 
                      `Address: ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                      "Wallet address not available"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AdContractDemo />
          </div>
          <div>
            <TransactionHistory />
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-[#f5f5f5] border-t-2 border-gray-300">
          <h2 className="text-xl font-bold mb-2">Technical Notes:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>The AdContractSystem integrates with Privy wallet through the useBlockchainService hook</li>
            <li>Contracts run on the Holesky testnet - no real funds are used</li>
            <li>All transactions are verified on-chain and can be tracked via block explorer</li>
            <li>The BlockchainProvider makes the blockchain services available throughout the app</li>
          </ul>
        </div>
      </div>
    </BlockchainProvider>
  );
} 