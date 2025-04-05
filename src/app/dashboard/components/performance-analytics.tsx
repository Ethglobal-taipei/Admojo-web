"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { useBlockchainService, useBoothRegistry, usePerformanceOracle } from "@/hooks"

// Common styling for chart labels
const labelStyle = {
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif'
}

// Performance data interface
interface PerformanceData {
  views: number[];
  taps: number[];
  dates: string[];
  locationDistribution: { name: string; value: number }[];
  deviceSizeDistribution: { name: string; value: number }[];
}

export default function PerformanceAnalytics() {
  const [timePeriod, setTimePeriod] = useState<string>("week")
  const { service } = useBlockchainService()
  const { getAllBooths, getAllCampaigns } = useBoothRegistry()
  const { getDailyMetrics, getWeeklyMetrics } = usePerformanceOracle()
  
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchedPeriodRef = useRef<string | null>(null)
  
  // Define fetchPerformanceData function with useCallback
  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!service) {
        throw new Error("Blockchain service not initialized");
      }
      
      // First get all booths
      const booths = await getAllBooths();
      
      if (!booths || booths.length === 0) {
        setPerformanceData({
          views: [],
          taps: [],
          dates: [],
          locationDistribution: [],
          deviceSizeDistribution: []
        });
        setIsLoading(false);
        return;
      }
      
      // Get metrics based on selected time period
      let views: number[] = [];
      let taps: number[] = [];
      let dates: string[] = [];
      
      // Create sample data for testing - replace with actual API calls
      const today = new Date();
      
      if (timePeriod === "day") {
        // 24 hours data (hourly)
        for (let i = 0; i < 24; i++) {
          const date = new Date(today);
          date.setHours(today.getHours() - 23 + i);
          dates.push(`${date.getHours()}:00`);
          
          // These would be replaced with actual metrics from the blockchain
          views.push(Math.floor(Math.random() * 100) + 50);
          taps.push(Math.floor(Math.random() * 20) + 5);
        }
      } else if (timePeriod === "week") {
        // 7 days data (daily)
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - 6 + i);
          dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
          
          // These would be replaced with actual metrics from the blockchain
          views.push(Math.floor(Math.random() * 500) + 200);
          taps.push(Math.floor(Math.random() * 100) + 20);
        }
      } else if (timePeriod === "month") {
        // 30 days data
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - 29 + i);
          dates.push(`${date.getDate()}/${date.getMonth() + 1}`);
          
          // These would be replaced with actual metrics from the blockchain
          views.push(Math.floor(Math.random() * 1000) + 500);
          taps.push(Math.floor(Math.random() * 200) + 50);
        }
      }
      
      // Distribution data - sample distributions
      // In a real implementation, these would be calculated from actual booth data
      const locationDistribution = [
        { name: "Urban", value: 65 },
        { name: "Suburban", value: 25 },
        { name: "Rural", value: 10 },
      ];
      
      const deviceSizeDistribution = [
        { name: "Mobile", value: 55 },
        { name: "Desktop", value: 35 },
        { name: "Tablet", value: 10 },
      ];
      
      setPerformanceData({
        views,
        taps,
        dates,
        locationDistribution,
        deviceSizeDistribution
      });
      
      // Update the last fetched period
      lastFetchedPeriodRef.current = timePeriod;
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching performance data:", err);
      setError(err.message || "Failed to fetch performance data");
      setIsLoading(false);
      
      // Set empty performance data
      setPerformanceData({
        views: [],
        taps: [],
        dates: [],
        locationDistribution: [],
        deviceSizeDistribution: []
      });
    }
  }, [service, timePeriod]); // Only include service and timePeriod
  
  // Setup effect to fetch data
  useEffect(() => {
    if (service && (lastFetchedPeriodRef.current !== timePeriod)) {
      fetchPerformanceData();
    }
  }, [service, timePeriod, fetchPerformanceData]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="border-[6px] border-black bg-white p-6 flex items-center justify-center" style={{ height: '480px' }}>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-black border-t-[#0055FF] rounded-full animate-spin mb-4"></div>
          <div className="font-bold">Loading performance data from blockchain...</div>
        </div>
      </div>
    )
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="border-[6px] border-black bg-[#FF3366] text-white p-6" style={{ height: '480px' }}>
        <h3 className="font-bold mb-4 text-xl">Error Loading Performance Data</h3>
        <p className="mb-4">{error.toString()}</p>
      </div>
    )
  }
  
  // Filter data based on selected time period
  const getFilteredData = () => {
    if (!performanceData) return [];
    
    // Extract arrays based on the correct property names
    const { views, taps, dates } = performanceData;
    
    // Make sure arrays exist before working with them
    if (!views || !Array.isArray(views)) {
      return [];
    }
    
    // Get the most recent data points based on the selected time period
    return views.map((view, i) => {
        return {
        name: dates[i] || `Day ${i + 1}`,
        impressions: view,
        clicks: taps && Array.isArray(taps) ? taps[i] || 0 : 0,
          conversions: 0, // No direct equivalent in the new data structure
          allocation: 0, // No direct equivalent in the new data structure
        };
      });
  };

  const filteredData = getFilteredData();
  
  // Performance metrics
  const getPerformanceMetrics = () => {
    if (!performanceData) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        ctr: 0,
        conversionRate: 0,
        cpi: 0,
        cpc: 0,
        cpa: 0,
      };
    }
    
    const { views, taps } = performanceData;
    
    // Calculate total metrics
    const totalImpressions = views && Array.isArray(views) ? views.reduce((sum, val) => sum + val, 0) : 0;
    const totalClicks = taps && Array.isArray(taps) ? taps.reduce((sum, val) => sum + val, 0) : 0;
    const totalConversions = 0; // No direct equivalent in the new data structure
    const totalAllocation = 0; // No direct equivalent in the new data structure
    
    // Calculate rates
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = 0; // No direct equivalent
    
    // Calculate costs
    const cpi = 0; // No direct equivalent
    const cpc = 0; // No direct equivalent
    const cpa = 0; // No direct equivalent
    
    return {
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr,
      conversionRate,
      cpi,
      cpc,
      cpa,
    };
  };
  
  const metrics = getPerformanceMetrics();

  // Distribution data for pie charts
  const locationData = performanceData?.locationDistribution || [
    { name: "Urban", value: 65 },
    { name: "Suburban", value: 25 },
    { name: "Rural", value: 10 },
  ];
  
  const deviceData = performanceData?.deviceSizeDistribution || [
    { name: "Mobile", value: 55 },
    { name: "Desktop", value: 35 },
    { name: "Tablet", value: 10 },
  ];
  
  const COLORS = ['#0055FF', '#FFCC00', '#FF3366', '#33CC99'];

  // Custom formatter for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text 
        x={x} 
        y={y} 
        fill="black" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-[3px] border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {`${entry.name}: ${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
      <div className="p-4 border-b-[4px] border-black flex justify-between items-center">
        <h2 className="text-xl font-black">Performance Analytics</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimePeriod("day")}
            className={`px-3 py-1 border-[3px] border-black font-bold rounded-none text-sm ${
              timePeriod === "day"
                ? "bg-[#0055FF] text-white"
                : "bg-white hover:bg-[#f5f5f5]"
            } transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
          >
            24H
          </button>
          <button
            onClick={() => setTimePeriod("week")}
            className={`px-3 py-1 border-[3px] border-black font-bold rounded-none text-sm ${
              timePeriod === "week"
                ? "bg-[#0055FF] text-white"
                : "bg-white hover:bg-[#f5f5f5]"
            } transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
          >
            7D
          </button>
          <button
            onClick={() => setTimePeriod("month")}
            className={`px-3 py-1 border-[3px] border-black font-bold rounded-none text-sm ${
              timePeriod === "month"
                ? "bg-[#0055FF] text-white"
                : "bg-white hover:bg-[#f5f5f5]"
            } transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}
          >
            30D
          </button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6 bg-transparent">
            <TabsTrigger
              value="overview"
              className="bg-white data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black mb-1 py-2 data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
            >
              OVERVIEW
            </TabsTrigger>
            <TabsTrigger
              value="impressions"
              className="bg-white data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black mb-1 py-2 data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
            >
              IMPRESSIONS
            </TabsTrigger>
            <TabsTrigger
              value="clicks"
              className="bg-white data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black mb-1 py-2 data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
            >
              CLICKS
            </TabsTrigger>
            <TabsTrigger
              value="distribution"
              className="bg-white data-[state=active]:bg-[#0055FF] data-[state=active]:text-white border-[3px] border-black mb-1 py-2 data-[state=active]:-translate-y-1 data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
            >
              DISTRIBUTION
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                <div className="font-bold mb-2">Key Metrics</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Impressions:</span>
                    <span className="font-bold">{metrics.totalImpressions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Clicks:</span>
                    <span className="font-bold">{metrics.totalClicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Click-Through Rate:</span>
                    <span className="font-bold">{metrics.ctr.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="border-[3px] border-black p-4 bg-[#f5f5f5]">
                <div className="font-bold mb-2">Performance Summary</div>
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0055FF] h-full" 
                      style={{ width: `${Math.min(100, metrics.ctr * 5)}%` }}
                    ></div>
          </div>
                  <div className="flex justify-between text-sm">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
        </div>
            </div>
              </div>
            </div>

            <div className="border-[3px] border-black p-4 mb-4">
              <div className="font-bold mb-4">Overview</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                <LineChart
                  data={filteredData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                    <YAxis 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="#0055FF"
                    strokeWidth={3}
                      dot={{ r: 4, fill: '#0055FF', stroke: '#0055FF' }}
                      activeDot={{ r: 8 }}
                    name="Impressions"
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                      stroke="#FF3366"
                    strokeWidth={3}
                      dot={{ r: 4, fill: '#FF3366', stroke: '#FF3366' }}
                      activeDot={{ r: 8 }}
                    name="Clicks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </TabsContent>

          {/* Impressions Tab */}
          <TabsContent value="impressions" className="mt-0">
            <div className="border-[3px] border-black p-4 mb-4">
              <div className="font-bold mb-4">Impressions</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                <BarChart
                  data={filteredData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                    <YAxis 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                  <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="impressions" 
                    fill="#0055FF"
                      name="Impressions"
                      radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
        </div>
            </div>
          </TabsContent>

          {/* Clicks Tab */}
          <TabsContent value="clicks" className="mt-0">
            <div className="border-[3px] border-black p-4 mb-4">
              <div className="font-bold mb-4">Clicks</div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                  data={filteredData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                    <YAxis 
                      tick={{ fill: '#000000', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                    />
                  <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="clicks" 
                      fill="#FF3366" 
                      name="Clicks"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
              </ResponsiveContainer>
          </div>
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="mt-0">
            <div className="grid grid-cols-2 gap-6">
              <div className="border-[3px] border-black p-4">
                <div className="font-bold mb-4">Location Distribution</div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {locationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000000" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="border-[3px] border-black p-4">
                <div className="font-bold mb-4">Device Size Distribution</div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000000" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
            </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

