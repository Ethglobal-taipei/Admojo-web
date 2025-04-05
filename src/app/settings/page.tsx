"use client"

import { useState } from "react"
import { Save, User, Bell, Palette, Shield, CreditCard, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ToastDemo } from "@/components/toast-demo"

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <h1 className="text-3xl md:text-4xl font-black mb-8">SETTINGS</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="md:col-span-1">
          <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {[
              { id: "profile", name: "Profile", icon: User },
              { id: "notifications", name: "Notifications", icon: Bell },
              { id: "appearance", name: "Appearance", icon: Palette },
              { id: "security", name: "Security", icon: Shield },
              { id: "payment", name: "Payment", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`w-full text-left p-4 font-bold flex items-center gap-3 border-b-[3px] border-black transition-all ${
                  activeTab === tab.id ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3">
          <div className="border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6">Profile Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block font-bold mb-2">Display Name</label>
                    <Input
                      type="text"
                      defaultValue="CryptoAdvertiser"
                      className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Email Address</label>
                    <Input
                      type="email"
                      defaultValue="user@example.com"
                      className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Bio</label>
                    <textarea
                      defaultValue="Digital advertiser focused on urban displays and high-traffic locations."
                      className="w-full border-[4px] border-black rounded-none p-3 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform min-h-[100px]"
                    />
                  </div>

                  <div className="border-t-[3px] border-dashed border-black pt-6">
                    <h3 className="font-bold text-lg mb-4">Account Type</h3>

                    <div className="flex gap-4">
                      <div className="border-[4px] border-black p-4 bg-[#0055FF] text-white flex-1">
                        <div className="font-bold text-lg mb-1">Advertiser</div>
                        <p className="text-sm">Create campaigns and advertise on displays</p>
                      </div>

                      <div className="border-[4px] border-black p-4 bg-white flex-1">
                        <div className="font-bold text-lg mb-1">Provider</div>
                        <p className="text-sm">Register displays and earn revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6">Notification Settings</h2>

                <div className="space-y-6">
                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Email Notifications</h3>

                    <div className="space-y-4">
                      {[
                        { id: "email-campaigns", label: "Campaign Updates" },
                        { id: "email-performance", label: "Performance Reports" },
                        { id: "email-transactions", label: "Transaction Confirmations" },
                        { id: "email-system", label: "System Announcements" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <label htmlFor={item.id} className="font-bold">
                            {item.label}
                          </label>
                          <Switch
                            id={item.id}
                            defaultChecked={true}
                            className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                            thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">In-App Notifications</h3>

                    <div className="space-y-4">
                      {[
                        { id: "app-campaigns", label: "Campaign Updates" },
                        { id: "app-performance", label: "Performance Alerts" },
                        { id: "app-transactions", label: "Transaction Confirmations" },
                        { id: "app-system", label: "System Announcements" },
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <label htmlFor={item.id} className="font-bold">
                            {item.label}
                          </label>
                          <Switch
                            id={item.id}
                            defaultChecked={true}
                            className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                            thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6">Appearance Settings</h2>

                <div className="space-y-6">
                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Theme</h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="border-[4px] border-[#0055FF] p-3 bg-white">
                        <div className="font-bold mb-2">Light</div>
                        <div className="h-20 bg-white border-[2px] border-black"></div>
                      </div>

                      <div className="border-[4px] border-black p-3 bg-white">
                        <div className="font-bold mb-2">Dark</div>
                        <div className="h-20 bg-black border-[2px] border-black"></div>
                      </div>

                      <div className="border-[4px] border-black p-3 bg-white">
                        <div className="font-bold mb-2">System</div>
                        <div className="h-20 bg-gradient-to-r from-white to-black border-[2px] border-black"></div>
                      </div>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Dashboard Layout</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-[4px] border-[#0055FF] p-3 bg-white">
                        <div className="font-bold mb-2">Standard</div>
                        <div className="h-32 bg-[#f5f5f5] border-[2px] border-black p-2">
                          <div className="h-4 w-full bg-gray-300 mb-2"></div>
                          <div className="grid grid-cols-3 gap-1">
                            <div className="h-16 bg-gray-300"></div>
                            <div className="h-16 bg-gray-300"></div>
                            <div className="h-16 bg-gray-300"></div>
                          </div>
                        </div>
                      </div>

                      <div className="border-[4px] border-black p-3 bg-white">
                        <div className="font-bold mb-2">Compact</div>
                        <div className="h-32 bg-[#f5f5f5] border-[2px] border-black p-2">
                          <div className="h-3 w-full bg-gray-300 mb-1"></div>
                          <div className="grid grid-cols-4 gap-1">
                            <div className="h-12 bg-gray-300"></div>
                            <div className="h-12 bg-gray-300"></div>
                            <div className="h-12 bg-gray-300"></div>
                            <div className="h-12 bg-gray-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Accessibility</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="larger-text" className="font-bold">
                          Larger Text
                        </label>
                        <Switch
                          id="larger-text"
                          defaultChecked={false}
                          className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                          thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="reduced-motion" className="font-bold">
                          Reduced Motion
                        </label>
                        <Switch
                          id="reduced-motion"
                          defaultChecked={false}
                          className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                          thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="high-contrast" className="font-bold">
                          High Contrast
                        </label>
                        <Switch
                          id="high-contrast"
                          defaultChecked={false}
                          className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                          thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Password</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold mb-2">Current Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">New Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Confirm New Password</label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                        />
                      </div>

                      <Button className="bg-[#0055FF] text-white border-[4px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-6 py-3 h-auto rounded-none hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Two-Factor Authentication</h3>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-bold">2FA Status</div>
                        <div className="text-sm">Protect your account with 2FA</div>
                      </div>
                      <Switch
                        id="2fa-toggle"
                        defaultChecked={true}
                        className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                        thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                      />
                    </div>

                    <div className="p-4 border-[3px] border-[#0055FF] bg-[#0055FF]/10">
                      <div className="font-bold mb-2">2FA is Enabled</div>
                      <p className="text-sm mb-3">Your account is protected with authenticator app</p>
                      <Button
                        variant="outline"
                        className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm px-4 py-2 h-auto"
                      >
                        Reconfigure 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Session Management</h3>

                    <div className="space-y-3">
                      <div className="border-[3px] border-black p-3 bg-[#f5f5f5] flex justify-between items-center">
                        <div>
                          <div className="font-bold">Current Session</div>
                          <div className="text-sm">Chrome on Windows • IP: 192.168.1.1</div>
                        </div>
                        <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold border-[2px] border-black">
                          ACTIVE
                        </div>
                      </div>

                      <div className="border-[3px] border-black p-3 bg-white flex justify-between items-center">
                        <div>
                          <div className="font-bold">Mobile App</div>
                          <div className="text-sm">iPhone • Last active: 2 hours ago</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[2px] border-black rounded-none bg-white hover:bg-[#FF3366] hover:text-white transition-all font-bold text-xs h-auto"
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>

                    <Button className="mt-4 w-full bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-4 py-2 h-auto rounded-none">
                      Log Out All Devices
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === "payment" && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-black mb-6">Payment Settings</h2>

                <div className="space-y-6">
                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Connected Wallets</h3>

                    <div className="space-y-3">
                      <div className="border-[3px] border-black p-3 bg-[#f5f5f5] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 border-[2px] border-black bg-[#0055FF] flex items-center justify-center text-white font-bold">
                            M
                          </div>
                          <div>
                            <div className="font-bold">MetaMask</div>
                            <div className="text-sm font-mono">0x7E5F...8A3D</div>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold border-[2px] border-black">
                          PRIMARY
                        </div>
                      </div>

                      <Button className="w-full bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto rounded-none flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Connect Another Wallet
                      </Button>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Payment Preferences</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold mb-2">Default Currency</label>
                        <select className="w-full border-[4px] border-black rounded-none p-3 font-bold bg-white">
                          <option>USDC</option>
                          <option>ADC</option>
                          <option>ETH</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="auto-convert" className="font-bold">
                          Auto-Convert to USDC
                        </label>
                        <Switch
                          id="auto-convert"
                          defaultChecked={true}
                          className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                          thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="auto-withdraw" className="font-bold">
                          Auto-Withdraw (>1000 ADC)
                        </label>
                        <Switch
                          id="auto-withdraw"
                          defaultChecked={false}
                          className="data-[state=checked]:bg-[#0055FF] data-[state=unchecked]:bg-gray-400 h-6 w-12 border-[3px] border-black"
                          thumbClassName="h-5 w-5 border-[2px] border-black data-[state=checked]:translate-x-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-[4px] border-black p-4">
                    <h3 className="font-bold text-lg mb-4">Billing Information</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold mb-2">Company Name (Optional)</label>
                        <Input
                          type="text"
                          placeholder="Your company name"
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Tax ID (Optional)</label>
                        <Input
                          type="text"
                          placeholder="Tax identification number"
                          className="border-[4px] border-black rounded-none h-12 text-lg font-medium focus:border-[#0055FF] focus:ring-0 focus:translate-y-[-2px] transition-transform"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Country</label>
                        <select className="w-full border-[4px] border-black rounded-none p-3 font-bold bg-white">
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                          <option>Australia</option>
                          <option>Germany</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                className="bg-[#0055FF] text-white border-[6px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 relative overflow-hidden group"
                onClick={handleSaveSettings}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Save className="w-6 h-6" />
                  Save Settings
                </span>
                <span className="absolute inset-0 bg-[#FFCC00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <ToastDemo />
      </div>
    </div>
  )
}

