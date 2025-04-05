"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoothRegistryDemo } from '@/components/blockchain/booth-registry-demo';
import { PerformanceOracleDemo } from '@/components/blockchain/performance-oracle-demo';
import { CampaignDemo } from '@/components/blockchain/campaign-demo';

export default function BlockchainDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Blockchain Integration Demo</h1>
      <p className="text-gray-600 mb-8">
        This demo showcases the integration with smart contracts on the Holesky testnet.
      </p>
      
      <Tabs defaultValue="booth-registry" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="booth-registry">Booth Registry</TabsTrigger>
          <TabsTrigger value="performance-oracle">Performance Oracle</TabsTrigger>
          <TabsTrigger value="campaign">Campaign Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="booth-registry">
          <BoothRegistryDemo />
        </TabsContent>
        
        <TabsContent value="performance-oracle">
          <PerformanceOracleDemo />
        </TabsContent>
        
        <TabsContent value="campaign">
          <CampaignDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
} 