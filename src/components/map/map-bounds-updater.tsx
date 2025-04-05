"use client"

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';

interface MapBoundsUpdaterProps {
  locations: { coordinates?: { lat: number; lng: number; } | undefined }[];
}

export function MapBoundsUpdater({ locations }: MapBoundsUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    // Filter out locations without valid coordinates
    const validLocations = locations.filter(loc => 
      loc.coordinates && 
      typeof loc.coordinates.lat === 'number' && 
      typeof loc.coordinates.lng === 'number' &&
      !isNaN(loc.coordinates.lat) && 
      !isNaN(loc.coordinates.lng)
    );
    
    if (validLocations.length === 0) {
      // If no valid locations, set a default view (e.g., New York)
      map.setView([40.7128, -74.0060], 4);
      return;
    }
    
    if (validLocations.length === 1 && validLocations[0].coordinates) {
      // If only one location, center on it
      const { lat, lng } = validLocations[0].coordinates;
      map.setView([lat, lng], 14);
      return;
    }
    
    try {
      // Create bounds from all valid locations
      const bounds = validLocations.reduce<LatLngBounds | null>((acc, loc) => {
        if (!loc.coordinates) return acc;
        
        const { lat, lng } = loc.coordinates;
        
        if (!acc) {
          // Initialize bounds with first location
          return map.getBounds().extend([lat, lng]);
        }
        // Extend bounds with this location
        return acc.extend([lat, lng]);
      }, null);
      
      // If we have bounds, fit the map to them with padding
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        // Fallback to default view if bounds calculation failed
        map.setView([40.7128, -74.0060], 4);
      }
    } catch (e) {
      console.error('Error updating map bounds:', e);
      // Fallback to default view on error
      map.setView([40.7128, -74.0060], 4);
    }
  }, [locations, map]);
  
  // This component doesn't render anything
  return null;
} 