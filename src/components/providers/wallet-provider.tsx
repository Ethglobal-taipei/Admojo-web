'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { mainnet, polygon, optimism, arbitrum } from 'viem/chains';
import { defineChain } from 'viem';

// Define Holesky testnet chain (since it might not be in the default viem chains)
const holesky = defineChain({
  id: 17000,
  name: 'Holesky',
  network: 'holesky',
  nativeCurrency: {
    decimals: 18,
    name: 'Holesky Ether',
    symbol: 'ETH'
  },
  rpcUrls: {
    default: {
      http: ['https://ethereum-holesky.nodit.io/4I8CTQl1fobEdme9QgtY9DVkLbu3updE'],
    },
    public: {
      http: ['https://ethereum-holesky.nodit.io/4I8CTQl1fobEdme9QgtY9DVkLbu3updE'],
    }
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://holesky.etherscan.io'
    }
  },
  testnet: true
});

export default function WalletProvider({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cm8k2tswt005a886zwv3sxcbr"
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#0055FF',
          logo: '/logo.svg',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: [
          'email',
          'wallet',
          'google',
          'apple',
          'discord',
        ],
        // Set Holesky as the default chain
        defaultChain: holesky,
        // Include Holesky in the list of supported chains
        supportedChains: [holesky, mainnet, polygon, optimism, arbitrum],
      }}
    >
      {children}
    </PrivyProvider>
  );
}