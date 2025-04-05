# AdNet Blockchain Integration

This directory contains a modular, extensible blockchain integration system for the AdNet protocol. The system is designed to work with the Holesky testnet and can be easily extended to support other networks and contracts.

## Architecture

The blockchain integration follows a layered architecture:

1. **Core Layer** (`blockchain-service.ts`)
   - Provides basic connectivity to Ethereum networks
   - Handles wallet connections and transaction tracking
   - Provides generic interfaces for blockchain operations

2. **Contract Services** (`booth-registry-service.ts`, `performance-oracle-service.ts`)
   - Implements specific contract interfaces
   - Encapsulates contract logic and data structures
   - Provides type-safe methods for interacting with contracts

3. **Unified Service** (`blockchain-service-factory.ts`)
   - Combines multiple services into a single API
   - Provides cross-contract functionality
   - Handles admin privileges for certain operations

4. **Utility Layer** (`encoding-utils.ts`, `types.ts`)
   - Provides utilities for encoding/decoding contract data
   - Defines shared types and interfaces
   - Ensures consistent data handling across the system

## Usage

### Basic Setup

```typescript
import { createBlockchainService } from '@/lib/blockchain';

// Create a blockchain service with a provider
const service = createBlockchainService(provider, userAddress);

// Connect to the blockchain
await service.connect();

// Switch to the correct chain
if (service.chainId !== targetChainId) {
  await service.switchChain(targetChainId);
}
```

### Working with Booth Registry

```typescript
// Get the booth registry service
const registry = service.boothRegistry;

// Register a new booth
const tx = await registry.registerBooth(deviceId, {
  location: 'New York',
  displaySize: '1920x1080',
  additionalInfo: 'Corner booth'
});

// Wait for transaction confirmation
const receipt = await tx.wait();

// Get booth details
const booth = await registry.getBoothDetails(deviceId);

// Get active locations
const activeLocations = await registry.getActiveLocations();
```

### Working with Performance Oracle

```typescript
// Get the performance oracle service
const oracle = service.performanceOracle;

// Update metrics
const tx = await oracle.updateMetrics(deviceId, timestamp, views, taps);

// Get metrics for a specific timestamp
const metrics = await oracle.getMetrics(deviceId, timestamp);

// Get aggregated metrics
const aggregated = await oracle.getAggregatedMetrics(deviceId, startTime, endTime);

// Get daily metrics
const daily = await oracle.getDailyMetrics(deviceId);
```

### Using the Unified Service

```typescript
// Get campaign metrics by aggregating metrics from all campaign locations
const campaignMetrics = await service.getCampaignMetrics(campaignId, startTime, endTime);

// Update metrics with admin privileges
service.setAdminAddress(adminAddress);
const tx = await service.updateMetrics(deviceId, timestamp, views, taps);
```

## React Integration

The blockchain integration is exposed to React components through custom hooks:

- `useBlockchainService`: Provides access to the main blockchain service
- `useBoothRegistry`: Provides access to booth registry operations
- `usePerformanceOracle`: Provides access to performance oracle operations

Example:

```tsx
import { useBoothRegistry } from '@/hooks';

function BoothComponent() {
  const {
    registerBooth,
    getBoothDetails,
    boothDetails,
    isRegistering,
    isLoadingBooth
  } = useBoothRegistry();

  return (
    <div>
      <button onClick={() => registerBooth(123, metadata)}>
        {isRegistering ? 'Registering...' : 'Register Booth'}
      </button>
      
      <button onClick={() => getBoothDetails(123)}>
        {isLoadingBooth ? 'Loading...' : 'Get Booth Details'}
      </button>
      
      {boothDetails && (
        <div>
          <h2>Booth {boothDetails.deviceId}</h2>
          <p>Location: {boothDetails.metadata.location}</p>
        </div>
      )}
    </div>
  );
}
```

## Extending the System

### Adding a New Contract

1. Define the contract interface in `types.ts`
2. Create a new service implementation class that extends `ViemBlockchainService`
3. Add the service to the `AdNetBlockchainService` class
4. Create a factory function to instantiate the service
5. Create a React hook to expose the service to components

### Supporting a New Network

1. Update the `network` property in `ViemBlockchainService`
2. Add the network to the `switchChain` method
3. Update the network configuration in the React hooks

## Contract Addresses

| Contract           | Address                                    |
|--------------------|--------------------------------------------|
| BoothRegistry      | 0x75e0d911Fe9c359f5bbf72C8DB50FAE9C05321B6 |
| PerformanceOracle  | 0xAe5513f536E89D08E59bD1271De7a818e3bBf24B | 