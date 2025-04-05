"use client"

import { useState } from "react"
import { CheckCircle, AlertTriangle, Clock, RefreshCw, Wifi, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVerificationData } from "@/hooks/use-verification-data"
import { toast } from "@/lib/toast"

export default function VerificationManagement() {
  const [activeTab, setActiveTab] = useState("status")
  const { devices, events, isLoading, testConnection, refresh } = useVerificationData();

  const handleRefreshStatus = async () => {
    await refresh();
    toast("Status Refreshed", { description: "Device verification status has been updated." }, "success");
  };

  const handleTestConnection = async (deviceId: string) => {
    const result = await testConnection(deviceId);
    if (result && result.success) {
      toast("Connection Test Complete", { description: "Device is responding but may have issues." }, "info");
    } else {
      toast("Connection Test Failed", { description: "Device is not responding to verification requests." }, "error");
    }
  };

  // Show loading state
  if (isLoading && devices.length === 0) {
    return (
      <section className="mb-10 relative">
        <div className="absolute inset-0 -z-10 bg-checkered-colored opacity-20"></div>
        <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
          VERIFICATION MANAGEMENT
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-[#0055FF]" />
          <p className="font-bold">Loading verification data...</p>
        </div>
      </section>
    );
  }

  // Show empty state if no devices
  if (!isLoading && devices.length === 0) {
    return (
      <section className="mb-10 relative">
        <div className="absolute inset-0 -z-10 bg-checkered-colored opacity-20"></div>
        <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
          VERIFICATION MANAGEMENT
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-[#FFCC00]" />
          <p className="font-bold mb-2">No devices found</p>
          <p className="mb-4">Register at least one display to see verification data.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10 relative">
      {/* Add a subtle checkered background */}
      <div className="absolute inset-0 -z-10 bg-checkered-colored opacity-20"></div>

      <h2 className="text-2xl md:text-3xl font-black relative inline-block mb-6">
        VERIFICATION MANAGEMENT
        <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
      </h2>

      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative mb-8">
        <div className="flex border-b-[4px] border-black">
          <button
            className={`px-6 py-3 font-bold text-lg ${
              activeTab === "status" ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors flex-1 border-r-[4px] border-black`}
            onClick={() => setActiveTab("status")}
          >
            Device Status
          </button>
          <button
            className={`px-6 py-3 font-bold text-lg ${
              activeTab === "troubleshooting" ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
            } transition-colors flex-1`}
            onClick={() => setActiveTab("troubleshooting")}
          >
            Troubleshooting
          </button>
        </div>

        {activeTab === "status" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Device Health Dashboard</h3>
              <Button
                variant="outline"
                className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                onClick={handleRefreshStatus}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                <span>REFRESH STATUS</span>
              </Button>
            </div>

            <div className="space-y-6">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="border-[4px] border-black p-4 bg-[#f5f5f5] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div>
                      <h4 className="text-lg font-bold">{device.name}</h4>
                      <div className="font-mono text-sm">{device.id}</div>
                    </div>
                    <div
                      className={`px-4 py-2 font-bold text-white border-[3px] border-black flex items-center gap-2 ${
                        device.status === "verified"
                          ? "bg-green-500"
                          : device.status === "warning"
                            ? "bg-[#FFCC00] text-black"
                            : "bg-[#FF3366]"
                      }`}
                    >
                      {device.status === "verified" && <CheckCircle className="w-5 h-5" />}
                      {device.status === "warning" && <AlertTriangle className="w-5 h-5" />}
                      {device.status === "error" && <AlertTriangle className="w-5 h-5" />}
                      <span className="uppercase">{device.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium mb-1">Last Verified</div>
                      <div className="font-bold font-mono">{device.lastVerified}</div>
                    </div>
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium mb-1">Uptime</div>
                      <div className="font-bold">{device.uptime}</div>
                    </div>
                    <div className="border-[3px] border-black p-3 bg-white">
                      <div className="text-sm font-medium mb-1">Next Verification</div>
                      <div className="font-bold font-mono">{device.nextVerification}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      onClick={() => handleTestConnection(device.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                      View History
                    </Button>
                    {device.status !== "verified" && (
                      <Button className="bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        Troubleshoot
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-[4px] border-black p-4 bg-[#FFCC00]">
              <h3 className="font-bold text-lg mb-3">Verification Timeline</h3>
              <div className="relative pl-8 pb-2">
                {/* Timeline line */}
                <div className="absolute top-0 bottom-0 left-3 w-[4px] bg-black"></div>

                {/* Timeline events */}
                {events.slice(0, 3).map((event, index) => (
                  <div key={`${event.deviceId}-${index}`} className="mb-6 relative">
                    <div 
                      className={`absolute top-0 left-[-8px] w-6 h-6 ${
                        event.status === "verified" 
                          ? "bg-green-500" 
                          : event.status === "warning" 
                            ? "bg-[#FFCC00]" 
                            : "bg-[#FF3366]"
                      } border-[3px] border-black rounded-full`}
                    ></div>
                    <div 
                      className={`border-[3px] ${
                        event.status === "verified" 
                          ? "border-black" 
                          : event.status === "warning" 
                            ? "border-[#FFCC00]" 
                            : "border-[#FF3366]"
                      } p-3 ml-4 bg-white`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-bold">{event.deviceName} {
                          event.status === "verified" 
                            ? "Verified" 
                            : event.status === "warning" 
                              ? "Warning" 
                              : "Offline"
                        }</span>
                        <span className="text-sm font-mono">{event.timestamp}</span>
                      </div>
                      <p className="text-sm">{event.message}</p>
                    </div>
                  </div>
                ))}

                {events.length === 0 && (
                  <div className="mb-6 relative">
                    <div className="absolute top-0 left-[-8px] w-6 h-6 bg-gray-300 border-[3px] border-black rounded-full"></div>
                    <div className="border-[3px] border-black p-3 ml-4 bg-white">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold">No verification events yet</span>
                        <span className="text-sm font-mono">Now</span>
                      </div>
                      <p className="text-sm">Verification events will appear here as they occur.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "troubleshooting" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Common Issues</h3>
                <div className="space-y-4">
                  <div className="border-[4px] border-black p-4 bg-[#f5f5f5] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Wifi className="w-5 h-5" /> Connection Problems
                    </h4>
                    <ol className="space-y-2 list-decimal pl-5">
                      <li className="font-medium">Check power supply to the verification device</li>
                      <li className="font-medium">Verify WiFi/cellular signal strength at display location</li>
                      <li className="font-medium">Restart the device by unplugging for 30 seconds</li>
                      <li className="font-medium">Check for physical damage to the device</li>
                    </ol>
                    <Button 
                      className="mt-3 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      onClick={() => {
                        if (devices.length > 0) {
                          handleTestConnection(devices[0].id);
                        }
                      }}
                      disabled={devices.length === 0 || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Running Test...
                        </>
                      ) : (
                        "Run Connection Test"
                      )}
                    </Button>
                  </div>

                  <div className="border-[4px] border-black p-4 bg-[#f5f5f5] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5" /> Verification Timing Issues
                    </h4>
                    <ol className="space-y-2 list-decimal pl-5">
                      <li className="font-medium">Check device time settings</li>
                      <li className="font-medium">Verify operating hours in dashboard match actual display hours</li>
                      <li className="font-medium">Ensure device is active during scheduled verification times</li>
                      <li className="font-medium">Check for time zone discrepancies</li>
                    </ol>
                    <Button className="mt-3 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      Adjust Verification Schedule
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Manual Verification</h3>
                <div className="border-[4px] border-black p-4 bg-[#FFCC00] mb-6">
                  <h4 className="font-bold text-lg mb-3">Request Manual Verification</h4>
                  <p className="mb-4">
                    If automatic verification is failing, you can request a manual verification from our team. This
                    process typically takes 1-2 business days.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[3px] border-black flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-black"></div>
                      </div>
                      <span className="font-medium">I've checked all troubleshooting steps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[3px] border-black flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-black"></div>
                      </div>
                      <span className="font-medium">My display is physically accessible and operational</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-[3px] border-black flex items-center justify-center bg-white">
                        <div className="w-3 h-3 bg-black"></div>
                      </div>
                      <span className="font-medium">I've attempted connection tests at least 3 times</span>
                    </div>
                  </div>
                  <Button className="mt-4 border-[3px] border-black bg-white hover:bg-gray-100 transition-all font-bold px-6 py-3 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    Request Manual Verification
                  </Button>
                </div>

                <div className="border-[4px] border-black p-4 bg-white">
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#0055FF]" /> Support Resources
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#0055FF]"></div>
                      <a href="#" className="font-medium text-[#0055FF] hover:underline">
                        Verification Device Setup Guide
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#0055FF]"></div>
                      <a href="#" className="font-medium text-[#0055FF] hover:underline">
                        Troubleshooting Common Issues
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#0055FF]"></div>
                      <a href="#" className="font-medium text-[#0055FF] hover:underline">
                        Contact Technical Support
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#0055FF]"></div>
                      <a href="#" className="font-medium text-[#0055FF] hover:underline">
                        FAQ: Device Verification
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

