import { Inter } from "next/font/google"
import "./globals.css"
import GlobalNavigation from "@/components/global-navigation"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import ModalProvider from "@/components/providers/modal-provider"
import WalletProvider from "@/components/providers/wallet-provider"
import { BlockchainProvider } from "@/hooks"
import { ReactNode } from "react";
import AppWrapper from "@/components/app-wrapper";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AdNet - Decentralized Advertising Protocol",
  description: "Connect real-world displays with digital advertisers through blockchain technology",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <BlockchainProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              <GlobalNavigation />
              <div className="pt-24">
                <AppWrapper>
                  {children}
                </AppWrapper>
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "white",
                    color: "black",
                    border: "4px solid black",
                    borderRadius: "0",
                    boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
                    padding: "16px",
                    fontWeight: "bold",
                  },
                  classNames: {
                    toast: "group",
                    title: "font-bold",
                    description: "text-sm",
                    actionButton:
                      "bg-[#0055FF] text-white border-2 border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm px-3 py-1 h-auto rounded-none",
                    cancelButton:
                      "bg-white text-black border-2 border-black hover:bg-[#f5f5f5] transition-all font-bold text-sm px-3 py-1 h-auto rounded-none",
                    error: "bg-[#FF3366] text-white",
                    success: "bg-[#0055FF] text-white",
                    warning: "bg-[#FFCC00] text-black",
                    info: "bg-white text-black",
                  },
                }}
              />
              <ModalProvider />
            </ThemeProvider>
          </BlockchainProvider>
        </WalletProvider>
      </body>
    </html>
  )
}

