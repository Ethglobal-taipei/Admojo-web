import { BoothStatusType } from "@/lib/store/useLocationStore"

export type LocationStatus = "active" | "inactive" | "pending"
export type VerificationStatus = "verified" | "pending" | "unverified" | "rejected"

export interface LocationDimensions {
  width: number
  height: number
  unit: "meters" | "feet"
}

export interface LocationAnalytics {
  totalImpressions: number
  totalRevenue: number
  averageCPM: number
  performanceRating: number
}

export interface Location {
  id: number
  name: string
  city?: string
  area?: string
  coordinates?: { lat: number; lng: number }
  type?: string
  providerId?: string
  dailyTraffic?: number
  displayType?: string
  displaySize?: string
  pricePerDay: number
  images?: string[]
  isActive: boolean
  deviceId?: number // Device ID for blockchain reference
  status?: BoothStatusType // Status from blockchain (UNBOOKED, BOOKED, UNDER_MAINTENANCE)
  owner?: string // Owner address from blockchain
  
  // Additional fields that may be used in the UI but might not be in the store
  address?: string
  country?: string
  verificationStatus?: VerificationStatus
  installationDate?: string
  operatingHours?: string
  description?: string
  visibility?: string
  footTraffic?: number
  dimensions?: LocationDimensions
  costPerView?: number
  availableSlots?: number
  bookedSlots?: number
  nearbyAttractions?: string
  dailyImpressions?: number
  analytics?: LocationAnalytics
} 