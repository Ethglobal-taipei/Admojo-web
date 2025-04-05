export interface CampaignMetadata {
  name: string
  description?: string
  contentURI: string
  startDate: bigint
  duration: number
  additionalInfo?: string
}

export interface Campaign {
  id: string
  owner: `0x${string}`
  metadata: CampaignMetadata
  active: boolean
  bookedLocations: number[]
}

export interface CampaignHistory {
  campaignIds: number[]
  advertisers: `0x${string}`[]
  metadatas: CampaignMetadata[]
  activeStatus: boolean[]
}

export interface CampaignHistoryItem {
  id: number | string
  advertiser: `0x${string}`
  metadata: CampaignMetadata
  active: boolean
} 