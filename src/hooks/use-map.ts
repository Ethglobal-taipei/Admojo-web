import { useMap } from "@/components/providers/map-provider"

// This hook provides a convenient way to access map functionality
export function useMapFunctions() {
  const {
    locations,
    filteredLocations,
    selectedLocation,
    filters,
    isLoading,
    setSelectedLocation,
    setFilters,
    resetFilters,
    zoomToLocation,
    highlightLocation,
    addLocationToSelection,
    removeLocationFromSelection,
    selectedLocationIds,
  } = useMap()

  // Additional map-specific functions can be added here
  const getLocationById = (id: string | number) => {
    return locations.find((loc) => loc.id === id) || null
  }

  const getSelectedLocations = () => {
    return locations.filter((loc) => selectedLocationIds.includes(loc.id))
  }

  const isLocationSelected = (id: string | number) => {
    return selectedLocationIds.includes(id)
  }

  return {
    // Re-export all context values
    locations,
    filteredLocations,
    selectedLocation,
    filters,
    isLoading,
    setSelectedLocation,
    setFilters,
    resetFilters,
    zoomToLocation,
    highlightLocation,
    addLocationToSelection,
    removeLocationFromSelection,
    selectedLocationIds,

    // Additional functions
    getLocationById,
    getSelectedLocations,
    isLocationSelected,
  }
}

