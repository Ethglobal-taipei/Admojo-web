"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useLocationStore } from "@/lib/store"

// Define types for map state
export type MapLocation = {
  id: number | string
  name: string
  lat: string | number
  lng: string | number
  status: "active" | "inactive" | "pending"
  allocation?: number
  impressions?: number
  cpi?: number
  type?: string
  performance?: "high" | "medium" | "low"
}

type MapFilters = {
  performance: string
  locationType: string
  allocation: string
}

type MapContextType = {
  locations: MapLocation[]
  filteredLocations: MapLocation[]
  selectedLocation: MapLocation | null
  filters: MapFilters
  isLoading: boolean
  setSelectedLocation: (location: MapLocation | null) => void
  setFilters: (filters: Partial<MapFilters>) => void
  resetFilters: () => void
  zoomToLocation: (locationId: string | number) => void
  highlightLocation: (locationId: string | number) => void
  addLocationToSelection: (locationId: string | number) => void
  removeLocationFromSelection: (locationId: string | number) => void
  selectedLocationIds: (string | number)[]
}

const defaultFilters: MapFilters = {
  performance: "all",
  locationType: "all",
  allocation: "all",
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const { locations: storeLocations, isLoading } = useLocationStore()
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [filteredLocations, setFilteredLocations] = useState<MapLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [filters, setFilters] = useState<MapFilters>(defaultFilters)
  const [selectedLocationIds, setSelectedLocationIds] = useState<(string | number)[]>([])

  // Convert store locations to map locations
  useEffect(() => {
    if (storeLocations.length > 0) {
      const mapLocations = storeLocations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        lat: loc.coordinates?.lat || 40 + Math.random() * 10, // Fallback with random position
        lng: loc.coordinates?.lng || -74 + Math.random() * 10,
        status: loc.status || "active",
        allocation: Math.floor(Math.random() * 1500), // Mock data
        impressions: loc.dailyImpressions || 0,
        cpi: loc.costPerView || 0,
        type: loc.type || "urban",
        performance: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low", // Mock data
      }))
      setLocations(mapLocations)
      applyFilters(mapLocations, filters)
    }
  }, [storeLocations])

  // Apply filters to locations
  const applyFilters = useCallback((locs: MapLocation[], currentFilters: MapFilters) => {
    const filtered = locs.filter((location) => {
      if (currentFilters.performance !== "all" && location.performance !== currentFilters.performance) return false
      if (currentFilters.locationType !== "all" && location.type !== currentFilters.locationType) return false
      if (currentFilters.allocation === "none" && (location.allocation || 0) > 0) return false
      if (currentFilters.allocation === "low" && ((location.allocation || 0) <= 0 || (location.allocation || 0) > 600))
        return false
      if (
        currentFilters.allocation === "medium" &&
        ((location.allocation || 0) <= 600 || (location.allocation || 0) > 900)
      )
        return false
      if (currentFilters.allocation === "high" && (location.allocation || 0) <= 900) return false
      return true
    })
    setFilteredLocations(filtered)
  }, [])

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<MapFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      setFilters(updatedFilters)
      applyFilters(locations, updatedFilters)
    },
    [filters, locations, applyFilters],
  )

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    applyFilters(locations, defaultFilters)
  }, [locations, applyFilters])

  // Zoom to location (to be implemented with actual map library)
  const zoomToLocation = useCallback(
    (locationId: string | number) => {
      const location = locations.find((loc) => loc.id === locationId)
      if (location) {
        setSelectedLocation(location)
        // Additional zoom logic would go here with actual map implementation
        console.log(`Zooming to location: ${location.name}`)
      }
    },
    [locations],
  )

  // Highlight location
  const highlightLocation = useCallback(
    (locationId: string | number) => {
      const location = locations.find((loc) => loc.id === locationId)
      if (location) {
        setSelectedLocation(location)
      }
    },
    [locations],
  )

  // Add location to selection
  const addLocationToSelection = useCallback((locationId: string | number) => {
    setSelectedLocationIds((prev) => {
      if (!prev.includes(locationId)) {
        return [...prev, locationId]
      }
      return prev
    })
  }, [])

  // Remove location from selection
  const removeLocationFromSelection = useCallback((locationId: string | number) => {
    setSelectedLocationIds((prev) => prev.filter((id) => id !== locationId))
  }, [])

  return (
    <MapContext.Provider
      value={{
        locations,
        filteredLocations,
        selectedLocation,
        filters,
        isLoading,
        setSelectedLocation,
        setFilters: updateFilters,
        resetFilters,
        zoomToLocation,
        highlightLocation,
        addLocationToSelection,
        removeLocationFromSelection,
        selectedLocationIds,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}

