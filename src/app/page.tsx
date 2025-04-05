import { Github, Twitter, Linkedin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ChevronRight } from "lucide-react"
import LandingPageMap from "@/components/map/landing-page-map"

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Animated Gradient Mesh */}
      <div className="fixed inset-0 -z-20 opacity-100">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZzEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMDU1RkYiIHN0b3Atb3BhY2l0eT0iMC4yIi8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNGRkNDMDAiIHN0b3Atb3BhY2l0eT0iMC4xIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkYzMzY2IiBzdG9wLW9wYWNpdHk9IjAuMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZzEpIi8+PC9zdmc+')]"></div>
      </div>

      {/* Animated Background Elements with Enhanced Styling */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-32 h-32 bg-gradient-to-br from-[#FFCC00] to-[#FFB700] border-[6px] border-black rounded-full opacity-20 animate-pulse shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"></div>
        <div
          className="absolute top-[30%] left-[8%] w-48 h-48 bg-gradient-to-br from-[#0055FF] to-[#0044CC] border-[6px] border-black opacity-10 animate-bounce shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-[15%] right-[15%] w-64 h-64 bg-gradient-to-br from-[#FF3366] to-[#FF1A4F] border-[6px] border-black opacity-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"
          style={{ animation: "spin 15s linear infinite" }}
        ></div>
        <div
          className="absolute top-[60%] left-[20%] w-24 h-24 bg-black opacity-5 rotate-45 animate-pulse shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]"
          style={{ animationDuration: "4s" }}
        ></div>
      </div>

      {/* Hero Section with Improved Typography */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-[10%] w-16 h-16 bg-gradient-to-br from-[#FFCC00] to-[#FFB700] border-[4px] border-black rotate-12 hidden md:block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>
        <div className="absolute bottom-1/4 left-[5%] w-12 h-12 bg-gradient-to-br from-[#FF3366] to-[#FF1A4F] border-[4px] border-black -rotate-12 hidden md:block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-wider leading-tight transform -rotate-1 mb-6 relative">
            <span className="block relative z-10 animate-in slide-in-from-left duration-700 text-black">ADNET:</span>
            <span className="text-[#0055FF] block relative z-10 animate-in slide-in-from-right duration-700 delay-300 bg-gradient-to-r from-[#0055FF] to-[#0066FF] bg-clip-text text-transparent">
              DECENTRALIZED
            </span>
            <span className="block relative z-10 animate-in slide-in-from-left duration-700 delay-500 text-black">
              ADVERTISING PROTOCOL
            </span>

            {/* Enhanced decorative underline */}
            <svg className="absolute -bottom-4 left-0 w-full h-8 z-0" viewBox="0 0 300 20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="underlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFCC00" />
                  <stop offset="100%" stopColor="#FFB700" />
                </linearGradient>
              </defs>
              <path d="M0,16 C150,0 150,40 300,16 L300,20 L0,20 Z" fill="url(#underlineGradient)" />
            </svg>
          </h1>
          <p className="text-xl md:text-2xl font-bold mb-10 max-w-3xl animate-in fade-in duration-1000 delay-700 bg-gradient-to-r from-[#333333] to-[#555555] bg-clip-text text-transparent">
            Connect real-world displays with digital advertisers through blockchain technology
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-in fade-in duration-1000 delay-1000">
            <Button className="bg-gradient-to-r from-[#0055FF] to-[#0066FF] text-white border-[6px] border-black hover:from-[#FFCC00] hover:to-[#FFB700] hover:text-black hover:-translate-y-1 transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#FFCC00] to-[#FFB700] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Button>
            <Button
              variant="outline"
              className="bg-white text-black border-[6px] border-black hover:bg-gradient-to-r hover:from-[#FF3366] hover:to-[#FF1A4F] hover:text-white hover:-translate-y-1 transition-all font-bold text-xl px-8 py-6 h-auto rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-2 sm:mt-6 relative overflow-hidden group"
            >
              <span className="relative z-10">Learn More</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF3366] to-[#FF1A4F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </Button>
          </div>
        </div>
      </section>

      {/* Location Map with Enhanced Styling */}
      <section className="container mx-auto px-4 py-12 md:py-16 relative">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-center relative inline-block">
            <span className="bg-gradient-to-r from-[#FFCC00] to-[#FFB700] bg-clip-text text-transparent animate-pulse">
              1,234
            </span>{" "}
            ACTIVE DISPLAYS WORLDWIDE
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-black [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
          </h2>
          <div
            className="relative border-[6px] border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:rotate-0 transition-transform duration-500"
            style={{ transform: "rotate(-0.5deg)" }}
          >
            <LandingPageMap />
          </div>
        </div>
      </section>

      {/* How It Works with Enhanced Styling */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        {/* Enhanced background with subtle gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f8f9ff] to-[#f0f2ff] opacity-70"></div>
        {/* Decorative elements */}
        <div className="absolute top-1/3 left-[5%] w-20 h-20 bg-gradient-to-br from-[#0055FF] to-[#0066FF] border-[4px] border-black rotate-45 opacity-20 hidden md:block"></div>
        <div className="absolute bottom-1/4 right-[10%] w-16 h-16 bg-gradient-to-br from-[#FFCC00] to-[#FFB700] border-[4px] border-black -rotate-12 opacity-30 hidden md:block"></div>

        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center relative inline-block mx-auto">
          HOW IT WORKS
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#FF3366] to-[#FF1A4F] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              number: 1,
              title: "Registration Phase",
              description: "Display owners register their physical screens and IoT devices on the AdNet protocol",
              gradient: "from-[#0055FF] to-[#0066FF]",
            },
            {
              number: 2,
              title: "Liquidity & Tokenomics",
              description: "ADC-USDC pools provide liquidity for advertisers and display owners",
              gradient: "from-[#FFCC00] to-[#FFB700]",
            },
            {
              number: 3,
              title: "Advertiser Flow",
              description: "Advertisers allocate tokens to campaigns targeting specific display types and locations",
              gradient: "from-[#FF3366] to-[#FF1A4F]",
            },
            {
              number: 4,
              title: "Display & Verification",
              description: "IoT devices verify ad display and engagement through secure blockchain transactions",
              gradient: "from-[#0055FF] to-[#0066FF]",
            },
            {
              number: 5,
              title: "Budget Reallocation",
              description: "Smart contracts automatically reallocate budgets based on performance metrics",
              gradient: "from-[#FFCC00] to-[#FFB700]",
            },
            {
              number: 6,
              title: "Payment Settlement",
              description: "Display owners earn tokens based on verified impressions and engagement",
              gradient: "from-[#FF3366] to-[#FF1A4F]",
            },
          ].map((step, index) => (
            <div
              key={index}
              className={`border-[6px] border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all relative ${index % 2 === 0 ? "rotate-1" : "-rotate-1"} group`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div
                className={`absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br ${step.gradient} border-[4px] border-black flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#FF3366] group-hover:to-[#FF1A4F] transition-colors`}
              >
                <span className="font-black text-2xl text-white">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 mt-4">{step.title}</h3>
              <p className="font-medium">{step.description}</p>
              <div className="mt-4 h-32 bg-gradient-to-br from-gray-50 to-gray-100 border-[3px] border-black flex items-center justify-center relative overflow-hidden group-hover:border-[#0055FF] transition-colors">
                <span className="text-gray-400 font-bold">Step Illustration</span>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block relative max-w-6xl mx-auto">
          {/* Connecting lines between cards with gradient */}
          <svg
            className="absolute top-0 left-0 w-full h-full -z-10"
            viewBox="0 0 1200 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0055FF" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#FFCC00" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FF3366" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path
              d="M200 100 L400 100 L600 100 M600 100 L800 100 L1000 100 M200 300 L400 300 L600 300 M600 300 L800 300 L1000 300 M200 100 L200 300 M600 100 L600 300 M1000 100 L1000 300"
              stroke="url(#lineGradient)"
              strokeWidth="6"
              strokeDasharray="20 10"
            />
          </svg>
        </div>
      </section>

      {/* Key Features with Enhanced Styling */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0f2ff] to-[#f8f9ff] -z-20 skew-y-1"></div>

        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center relative inline-block mx-auto">
          KEY FEATURES
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#0055FF] to-[#0066FF] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Real-World Advertising",
              description: "Connect digital campaigns with physical displays in high-traffic locations",
              gradientFrom: "#0055FF",
              gradientTo: "#0066FF",
            },
            {
              title: "Performance-Based Allocation",
              description: "Smart contracts automatically optimize budget allocation based on real-time performance",
              gradientFrom: "#FFCC00",
              gradientTo: "#FFB700",
            },
            {
              title: "Verified Engagement",
              description: "NFC and IoT verification ensures accurate impression and engagement reporting",
              gradientFrom: "#FF3366",
              gradientTo: "#FF1A4F",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="border-[6px] border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 transition-all group"
              style={{
                background: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
                transform: `rotate(${(index - 1) * 2}deg)`,
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <h3 className="text-2xl font-black mb-4 text-white">{feature.title}</h3>
              <div className="h-40 bg-white border-[3px] border-black mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-gray-400 font-bold relative z-10">Feature Illustration</span>
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>

                {/* Animated pattern with gradient */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                  <div
                    className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==')]"
                    style={{
                      background: `linear-gradient(to bottom right, ${feature.gradientFrom}, ${feature.gradientTo})`,
                      maskImage:
                        'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==")',
                      WebkitMaskImage:
                        'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==")',
                    }}
                  ></div>
                </div>
              </div>
              <p className="font-bold text-white">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section with Enhanced Styling */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#f8f9ff] to-white -z-20"></div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-[10%] w-24 h-24 bg-gradient-to-br from-[#FFCC00] to-[#FFB700] border-[4px] border-black rotate-12 opacity-20 hidden md:block"></div>
        <div className="absolute bottom-1/4 right-[5%] w-32 h-32 bg-gradient-to-br from-[#FF3366] to-[#FF1A4F] border-[4px] border-black -rotate-12 opacity-10 hidden md:block"></div>

        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 bg-gradient-to-r from-black to-[#333333] bg-clip-text text-transparent">
            READY TO REVOLUTIONIZE ADVERTISING?
          </h2>
          <p className="text-xl font-bold mb-10 text-[#333333]">
            Join the AdNet protocol and connect with the future of decentralized advertising
          </p>
          <Button className="bg-gradient-to-r from-[#FF3366] to-[#FF1A4F] text-white border-[6px] border-black hover:from-[#FFCC00] hover:to-[#FFB700] hover:text-black transition-all font-bold text-xl px-10 py-6 h-auto rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 relative overflow-hidden group">
            <span className="relative z-10">Join The Waitlist</span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#FFCC00] to-[#FFB700] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            <ArrowRight className="ml-2 w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer with Enhanced Styling */}
      <footer className="bg-black text-white py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[10%] right-[15%] w-32 h-32 bg-gradient-to-br from-[#FFCC00] to-[#FFB700] opacity-10 rotate-45"></div>
          <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-gradient-to-br from-[#0055FF] to-[#0066FF] opacity-5 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                JOIN THE WAITLIST
              </h2>
              <p className="text-xl font-bold mb-6 text-gray-300">
                Be the first to access the AdNet protocol when we launch
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Enter your email"
                  className="bg-white text-black border-[4px] border-[#FFCC00] rounded-none h-14 text-lg font-bold"
                />
                <Button className="bg-gradient-to-r from-[#FFCC00] to-[#FFB700] text-black border-[4px] border-[#FFCC00] hover:from-[#FF3366] hover:to-[#FF1A4F] hover:border-[#FF3366] hover:text-white transition-colors font-bold text-lg px-8 h-14 rounded-none group">
                  Subscribe
                  <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                CONNECT WITH US
              </h3>
              <div className="flex gap-4 mb-8">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-none border-[3px] border-white hover:bg-gradient-to-r hover:from-[#FFCC00] hover:to-[#FFB700] hover:text-black transition-colors group"
                >
                  <Twitter className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="sr-only">Twitter</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-none border-[3px] border-white hover:bg-gradient-to-r hover:from-[#FFCC00] hover:to-[#FFB700] hover:text-black transition-colors group"
                >
                  <Github className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="sr-only">GitHub</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-none border-[3px] border-white hover:bg-gradient-to-r hover:from-[#FFCC00] hover:to-[#FFB700] hover:text-black transition-colors group"
                >
                  <Linkedin className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group hover:bg-gradient-to-r hover:from-[#FFCC00] hover:to-[#FFB700] transition-colors cursor-pointer">
                  <svg
                    width="16"
                    height="24"
                    viewBox="0 0 256 417"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid"
                    className="group-hover:scale-110 transition-transform"
                  >
                    <path fill="#343434" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
                    <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
                    <path fill="#3C3C3B" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
                    <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
                  </svg>
                </div>
                <span className="font-bold">Built on Ethereum</span>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-800">
            <p className="font-bold text-gray-400">© 2025 AdNet Protocol. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

