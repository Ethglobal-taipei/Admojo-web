'use client';

import { ThemeProvider } from 'next-themes';
import WalletProvider from '@/components/providers/wallet-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
}

export default Providers; 