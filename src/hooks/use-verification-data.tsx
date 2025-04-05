"use client";

import { useState, useEffect } from "react";
import { useAdContract } from "./use-ad-contract";
import { usePrivy } from "@privy-io/react-auth";
import { useLocationData, LocationData } from "./use-location-data";

export type VerificationDevice = {
  id: string;
  name: string;
  status: "verified" | "warning" | "error";
  lastVerified: string;
  uptime: string;
  nextVerification: string;
  locationId: string;
};

export type VerificationEvent = {
  deviceId: string;
  deviceName: string;
  status: "verified" | "warning" | "error";
  timestamp: string;
  message: string;
};

export function useVerificationData() {
  const { operations, adContract, isCorrectChain } = useAdContract();
  const { authenticated, user } = usePrivy();
  const { locations } = useLocationData();
  
  const [devices, setDevices] = useState<VerificationDevice[]>([]);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchVerificationData() {
      if (!adContract || !authenticated || !isCorrectChain || !user?.wallet?.address || locations.length === 0) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // For each location, build a verification device
        const verificationDevices = locations.map(location => {
          // In a production app, we would query the verification status from a dedicated contract
          // For demo purposes, we'll generate the status based on the device ID
          const deviceIdSum = Array.from(location.deviceId.slice(2))
            .map(c => c.charCodeAt(0))
            .reduce((a, b) => a + b, 0);
          
          // Determine status based on a deterministic but seemingly random pattern
          let status: "verified" | "warning" | "error";
          if (deviceIdSum % 10 < 7) {
            status = "verified";
          } else if (deviceIdSum % 10 < 9) {
            status = "warning";
          } else {
            status = "error";
          }

          // Calculate verification time as a deterministic time based on device ID
          const now = new Date();
          const verificationHour = (deviceIdSum % 24);
          const verificationMinute = (deviceIdSum % 60);
          
          // Format based on when verification occurred, for demonstration
          let lastVerifiedDate = new Date(now);
          let nextVerificationDate = new Date(now);
          
          if (status === "verified") {
            // Last verification happened today
            lastVerifiedDate.setHours(verificationHour, verificationMinute);
            // Next verification tomorrow
            nextVerificationDate.setDate(now.getDate() + 1);
            nextVerificationDate.setHours(verificationHour, verificationMinute);
          } else if (status === "warning") {
            // Last verification was yesterday
            lastVerifiedDate.setDate(now.getDate() - 1);
            lastVerifiedDate.setHours(verificationHour, verificationMinute);
            // Next verification today
            nextVerificationDate.setHours(verificationHour, verificationMinute);
          } else {
            // Last verification was days ago
            lastVerifiedDate.setDate(now.getDate() - 5);
            lastVerifiedDate.setHours(verificationHour, verificationMinute);
            // Immediate action required
            nextVerificationDate = new Date(0); // Use epoch time to indicate special case
          }

          // Format dates
          const lastVerifiedStr = formatVerificationDate(lastVerifiedDate);
          const nextVerificationStr = status === "error" 
            ? "Immediate action required" 
            : formatVerificationDate(nextVerificationDate);

          // Determine uptime based on status
          const uptime = status === "verified" 
            ? "99.8%" 
            : status === "warning" 
              ? `${92 + (deviceIdSum % 7)}.${deviceIdSum % 10}%` 
              : "0%";

          return {
            id: `ADN-${location.deviceId.slice(2, 6)}-${location.deviceId.slice(6, 10)}-${location.deviceId.slice(10, 14)}`,
            name: location.name,
            status,
            lastVerified: lastVerifiedStr,
            uptime,
            nextVerification: nextVerificationStr,
            locationId: location.id
          };
        });

        // Generate verification timeline events
        const timelineEvents = verificationDevices
          .map(device => {
            let message = "";
            if (device.status === "verified") {
              message = "Automatic verification completed successfully. Next check scheduled for tomorrow.";
            } else if (device.status === "warning") {
              message = "Intermittent connection detected. Device may require maintenance soon.";
            } else {
              message = "Device has been offline for 5 days. Immediate attention required to maintain earnings.";
            }

            return {
              deviceId: device.id,
              deviceName: device.name,
              status: device.status,
              timestamp: device.lastVerified,
              message
            };
          })
          // Sort by most recent first, but with errors at the top
          .sort((a, b) => {
            if (a.status === "error" && b.status !== "error") return -1;
            if (a.status !== "error" && b.status === "error") return 1;
            
            // Parse date for comparison
            const dateA = parseVerificationDate(a.timestamp);
            const dateB = parseVerificationDate(b.timestamp);
            return dateB.getTime() - dateA.getTime();
          });

        setDevices(verificationDevices);
        setEvents(timelineEvents);
      } catch (err) {
        console.error("Error fetching verification data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error fetching verification data"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchVerificationData();
  }, [adContract, authenticated, isCorrectChain, user?.wallet?.address, locations]);

  // Helper function to format verification dates
  function formatVerificationDate(date: Date): string {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    const isYesterday = date.getDate() === now.getDate() - 1 && 
                        date.getMonth() === now.getMonth() && 
                        date.getFullYear() === now.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    } else {
      // Format as Month Day, Year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${timeStr}`;
    }
  }

  // Helper function to parse verification date strings
  function parseVerificationDate(dateStr: string): Date {
    const now = new Date();
    
    if (dateStr.startsWith('Today')) {
      const [_, timeStr] = dateStr.split(', ');
      const [time, ampm] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      const date = new Date(now);
      date.setHours(
        ampm === 'PM' && hours !== 12 ? hours + 12 : (ampm === 'AM' && hours === 12 ? 0 : hours),
        minutes
      );
      return date;
    } else if (dateStr.startsWith('Yesterday')) {
      const [_, timeStr] = dateStr.split(', ');
      const [time, ampm] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      date.setHours(
        ampm === 'PM' && hours !== 12 ? hours + 12 : (ampm === 'AM' && hours === 12 ? 0 : hours),
        minutes
      );
      return date;
    } else {
      // Format: "Mon Day, Year, HH:MM AM/PM"
      return new Date(dateStr);
    }
  }

  // Test connection for a device - simulates blockchain interaction
  const testConnection = async (deviceId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate a delay for network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Find the device to update
      const deviceIndex = devices.findIndex(d => d.id === deviceId);
      if (deviceIndex === -1) return;
      
      // Clone the devices array and update the status
      const updatedDevices = [...devices];
      const currentDevice = {...updatedDevices[deviceIndex]};
      
      // 80% chance to succeed
      const testSucceeded = Math.random() < 0.8;
      
      if (testSucceeded) {
        if (currentDevice.status !== "verified") {
          currentDevice.status = "warning";
          currentDevice.uptime = `${Math.floor(Math.random() * 10) + 85}.${Math.floor(Math.random() * 10)}%`;
          
          // Update last verified time to now
          const now = new Date();
          currentDevice.lastVerified = formatVerificationDate(now);
          
          // Set next verification to tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(now.getHours(), now.getMinutes());
          currentDevice.nextVerification = formatVerificationDate(tomorrow);
          
          // Add new event to timeline
          const newEvent: VerificationEvent = {
            deviceId: currentDevice.id,
            deviceName: currentDevice.name,
            status: "warning",
            timestamp: currentDevice.lastVerified,
            message: "Connection test completed. Device responding but with issues."
          };
          
          setEvents([newEvent, ...events]);
        }
      } else {
        // Test failed
        if (currentDevice.status !== "error") {
          currentDevice.status = "error";
          currentDevice.uptime = "0%";
          currentDevice.nextVerification = "Immediate action required";
          
          // Update last verified time
          const now = new Date();
          currentDevice.lastVerified = formatVerificationDate(now);
          
          // Add new event to timeline
          const newEvent: VerificationEvent = {
            deviceId: currentDevice.id,
            deviceName: currentDevice.name,
            status: "error",
            timestamp: currentDevice.lastVerified,
            message: "Connection test failed. Device not responding to verification requests."
          };
          
          setEvents([newEvent, ...events]);
        }
      }
      
      updatedDevices[deviceIndex] = currentDevice;
      setDevices(updatedDevices);
      
      return {success: testSucceeded};
    } catch (err) {
      console.error("Error testing connection:", err);
      return {success: false, error: err};
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    devices,
    events,
    isLoading,
    error,
    testConnection,
    refresh: async () => {
      setIsLoading(true);
      // Re-trigger the useEffect by changing a dependency
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };
} 