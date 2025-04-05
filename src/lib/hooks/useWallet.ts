"use client"

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletConnect } from './useWalletConnect'

export function useWallet() {
  const { user, authenticated, ready } = usePrivy()
  const { userId } = useWalletConnect()
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    if (ready && authenticated && user) {
      const walletAddress = user.wallet?.address
      setAddress(walletAddress || null)
      setIsConnected(!!walletAddress)
    } else {
      setAddress(null)
      setIsConnected(false)
    }
  }, [ready, authenticated, user])
  
  return {
    address,
    isConnected,
    userId
  }
} 