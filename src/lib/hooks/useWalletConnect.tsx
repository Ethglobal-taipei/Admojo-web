"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { toast } from '@/lib/toast'
import { createMetalHolder } from '@/lib/services/tokenomics.service'

export function useWalletConnect() {
  const { 
    ready, 
    authenticated, 
    user,
    login,
    logout,
    connectWallet
  } = usePrivy()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Create a Metal holder when the user connects their wallet
  useEffect(() => {
    const setupUserWithMetalHolder = async () => {
      if (ready && authenticated && user) {
        try {
          // Get the wallet address from Privy user
          const walletAddress = user.wallet?.address
          if (!walletAddress) {
            console.error("No wallet address found in user object")
            return
          }
          
          console.log("Setting up user with Metal holder", walletAddress)
          
          // Generate a user ID from the wallet address if not available
          const userId = user.id || `user-${walletAddress.slice(2, 10)}`
          
          // Create a Metal holder for this user
          const success = await createMetalHolder(userId, walletAddress)
          
          if (success) {
            console.log("Successfully created Metal holder for user")
            setUserId(userId)
          } else {
            console.error("Failed to create Metal holder for user")
          }
        } catch (error) {
          console.error("Error setting up user with Metal holder:", error)
        }
      }
    }
    
    setupUserWithMetalHolder()
  }, [ready, authenticated, user])
  
  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true)
      
      if (!authenticated) {
        await login()
      } else {
        await connectWallet()
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast("Connection Failed", { 
        description: "There was an error connecting your wallet. Please try again." 
      }, "error")
    } finally {
      setIsConnecting(false)
    }
  }, [authenticated, login, connectWallet])
  
  const handleDisconnect = useCallback(async () => {
    try {
      await logout()
      setUserId(null)
      toast("Wallet Disconnected", { 
        description: "Your wallet has been disconnected." 
      }, "info")
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      toast("Disconnection Failed", { 
        description: "There was an error disconnecting your wallet. Please try again." 
      }, "error")
    }
  }, [logout])
  
  return {
    ready,
    authenticated,
    user,
    userId,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect
  }
} 