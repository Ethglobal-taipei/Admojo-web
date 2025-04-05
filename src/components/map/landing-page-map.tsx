"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import type { Icon, IconOptions } from "leaflet"
import { MapPin } from "lucide-react"

// Import Leaflet CSS in a client component
const LeafletStyles = () => {
  return (
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossOrigin=""
    />
  )
}

// Dynamically import the Map components with no SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

interface LocationPin {
  name: string;
  lat: number;
  lng: number;
  impressions: string;
  rate: string;
}

// Mock data for display locations
const displayPins: LocationPin[] = [
  { lat: 40.7128, lng: -74.0060, name: "New York", impressions: "45K", rate: "$0.12" },
  { lat: 25.7617, lng: -80.1918, name: "Miami", impressions: "32K", rate: "$0.09" },
  { lat: 19.4326, lng: -99.1332, name: "Mexico City", impressions: "28K", rate: "$0.07" },
  { lat: 51.5074, lng: -0.1278, name: "London", impressions: "52K", rate: "$0.14" },
  { lat: 48.8566, lng: 2.3522, name: "Paris", impressions: "38K", rate: "$0.11" },
  { lat: 52.5200, lng: 13.4050, name: "Berlin", impressions: "41K", rate: "$0.10" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo", impressions: "63K", rate: "$0.15" },
  { lat: 22.3193, lng: 114.1694, name: "Hong Kong", impressions: "57K", rate: "$0.13" },
  { lat: 1.3521, lng: 103.8198, name: "Singapore", impressions: "49K", rate: "$0.12" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney", impressions: "36K", rate: "$0.10" },
]

interface LandingPageMapProps {
  className?: string;
}

export default function LandingPageMap({ className = "" }: LandingPageMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    
    // Load Leaflet on client-side
    if (typeof window !== "undefined") {
      // Add Leaflet script if not already added
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      
      document.head.appendChild(script);
    }
  }, [])
  
  // Create custom marker icon
  const createMarkerIcon = (): Icon<IconOptions> | undefined => {
    if (typeof window === "undefined") {
      return undefined;
    }
    
    try {
      return window.L?.icon({
        iconUrl: "/marker-active.svg",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });
    } catch (error) {
      console.error("Error creating map icon:", error);
      return undefined;
    }
  };
  
  if (!isMounted || !leafletLoaded) {
    return (
      <div className={`aspect-[16/9] relative bg-[#f5f5f5] border-[4px] border-black flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-10 w-10 border-4 border-[#0055FF] border-t-transparent rounded-full"></div>
          <p className="font-bold">Loading Map...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`aspect-[16/9] relative bg-[#f5f5f5] border-[4px] border-black ${className}`}>
      <LeafletStyles />
      
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        className="border-none"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="OpenStreetMap contributors and CARTO"
        />
        
        {displayPins.map((pin, index) => (
          <Marker
            key={index}
            position={[pin.lat, pin.lng]}
            icon={createMarkerIcon()}
          >
            <Popup className="rounded-none border-[3px] border-black font-bold">
              <div className="min-w-[150px]">
                <p className="font-bold text-lg">{pin.name}</p>
                <p className="font-medium">Daily: {pin.impressions} impressions</p>
                <p className="font-medium">Rate: {pin.rate} per view</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white border-[3px] border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[1000]">
        <div className="text-lg font-bold mb-2">Legend</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFCC00] border-[2px] border-black"></div>
            <span className="font-bold">High Density</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#0055FF] border-[2px] border-black"></div>
            <span className="font-bold">Medium Density</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FF3366] border-[2px] border-black"></div>
            <span className="font-bold">Low Density</span>
          </div>
        </div>
      </div>
      
      {/* Decorative icon */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-[#0055FF] to-[#0066FF] border-[4px] border-black rotate-12 flex items-center justify-center z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <MapPin className="w-12 h-12 text-white" />
      </div>
    </div>
  )
} 