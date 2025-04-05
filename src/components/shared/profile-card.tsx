import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileCardProps {
  userData: {
    name: string
    username: string
    email: string
    avatar: string
    role: string
    memberSince: string
    tier: string
    walletAddress: string
  }
}

export default function ProfileCard({ userData }: ProfileCardProps) {
  return (
    <Card className="border-[6px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-black">Profile</CardTitle>
          <div className="px-3 py-1 bg-[#0055FF] text-white font-bold border-[3px] border-black relative overflow-hidden">
            <span className="relative z-10">{userData.tier}</span>
            <span className="absolute inset-0 bg-[#0055FF] opacity-50 animate-pulse"></span>
          </div>
        </div>
        <CardDescription>Your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-24 h-24 border-[4px] border-black mb-4">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-[#FFCC00] text-black text-2xl font-black">
              {userData.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold mb-1">{userData.name}</h3>
          <p className="text-gray-600 mb-2">@{userData.username}</p>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-[#f5f5f5] border-[2px] border-black text-sm font-bold">{userData.role}</div>
            <div className="text-sm font-medium">Member since {userData.memberSince}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="font-bold mb-1">Email</div>
            <div className="border-[3px] border-black p-2 bg-[#f5f5f5]">{userData.email}</div>
          </div>

          <div>
            <div className="font-bold mb-1">Wallet Address</div>
            <div className="border-[3px] border-black p-2 bg-[#f5f5f5] font-mono text-sm truncate">
              {userData.walletAddress}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold text-sm py-2 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-sm py-2 h-auto hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

