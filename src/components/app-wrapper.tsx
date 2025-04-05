"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { createMetalHolder } from "@/lib/services/tokenomics.service";

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { user, authenticated, ready } = usePrivy();
  const hasAttemptedHolderCreation = useRef(false);

  useEffect(() => {
    // Check if user is authenticated, ready, wallet exists, and we haven't tried creating a holder yet
    if (ready && authenticated && user?.wallet?.address && !hasAttemptedHolderCreation.current) {
      hasAttemptedHolderCreation.current = true; // Mark as attempted
      
      console.log("User authenticated, attempting to create Metal holder...");
      createMetalHolder(user.wallet.address) // Use wallet address as userId
        .then(success => {
          if (success) {
            console.log("Metal holder creation process completed for", user.wallet?.address);
          } else {
            console.warn("Metal holder creation process failed or holder already exists for", user.wallet?.address);
          }
        })
        .catch(error => {
          console.error("Unexpected error during Metal holder creation:", error);
        });
    }
    
    // Reset flag if user logs out
    if (ready && !authenticated) {
      hasAttemptedHolderCreation.current = false;
    }

  }, [ready, authenticated, user]);

  return <>{children}</>;
} 