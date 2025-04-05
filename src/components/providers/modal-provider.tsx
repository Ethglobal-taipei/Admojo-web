"use client"

import { useEffect, useState } from "react"
import AddFundsModal from "@/components/modals/add-funds-modal"
import CreateCampaignModal from "@/components/modals/create-campaign-modal"
import ProviderInfoModal from "@/components/modals/provider-info-modal"
import RegisterLocationModal from "@/components/modals/register-location-modal"

export function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Advertiser Modals */}
      <AddFundsModal />
      <CreateCampaignModal />

      {/* Provider Modals */}
      <RegisterLocationModal />

      {/* Shared Modals */}
      <ProviderInfoModal />
    </>
  )
}

export default ModalProvider

