"use client"

import React, { useState, useEffect } from 'react';
import { useAdContract } from '@/hooks/use-ad-contract';
import { Check, X, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransactionHistory() {
  const { pendingTransactions, adContract } = useAdContract();
  
  if (!adContract) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-200 bg-gray-50 rounded">
        <p className="text-center text-gray-500">Connect wallet to view transaction history</p>
      </div>
    );
  }
  
  if (pendingTransactions.size === 0) {
    return (
      <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-xl font-bold mb-3">Transaction History</h3>
        <p className="text-center text-gray-500 my-4">No transactions yet</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-xl font-bold mb-3">Transaction History</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto p-2">
        {Array.from(pendingTransactions.entries()).map(([hash, { description, status }]) => (
          <div 
            key={hash} 
            className={`p-3 border-l-4 ${
              status === 'pending' ? 'border-blue-500 bg-blue-50' : 
              status === 'confirmed' ? 'border-green-500 bg-green-50' : 
              'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                {status === 'pending' && <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />}
                {status === 'confirmed' && <Check className="mr-2 h-4 w-4 text-green-500" />}
                {status === 'failed' && <X className="mr-2 h-4 w-4 text-red-500" />}
                <span className="font-bold">{description}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                status === 'pending' ? 'bg-blue-100 text-blue-800' : 
                status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {status}
              </span>
            </div>
            
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-mono break-all">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
              <a 
                href={`https://holesky.etherscan.io/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs flex items-center hover:underline text-blue-600"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Etherscan
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

