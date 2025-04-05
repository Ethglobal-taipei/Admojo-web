"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Download, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBlockchainService } from "@/hooks"
import { TransactionState } from "@/lib/blockchain"
import { type Hash } from "viem"

// Transaction type mapping
const typeNameMap: Record<string, string> = {
  registerBooth: "Register Booth",
  activateBooth: "Activate Booth",
  deactivateBooth: "Deactivate Booth",
  updateBoothStatus: "Update Status",
  createCampaign: "Create Campaign",
  addLocationToCampaign: "Add Location",
  removeLocationFromCampaign: "Remove Location",
  updateMetrics: "Update Metrics",
  default: "Transaction"
}

export default function TransactionHistory() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
  })
  const { transactions } = useBlockchainService();
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const prevTransactionsRef = useRef<Map<Hash, any>>(new Map());
  
  // Memoize the transaction array conversion
  const transactionArray = useMemo(() => {
    // Only process if transactions has changed
    if (transactions === prevTransactionsRef.current) {
      return [];
    }
    
    prevTransactionsRef.current = transactions;
    
    // Convert Map to Array and sort by timestamp (most recent first)
    return Array.from(transactions.entries()).map(([hash, tx]) => ({
      id: hash,
      hash,
      type: tx.description.split(' ')[0] || 'Transaction',
      typeName: typeNameMap[tx.description.split(' ')[0]] || typeNameMap.default,
      description: tx.description,
      status: tx.state === TransactionState.Pending ? 'pending' : 
              tx.state === TransactionState.Success ? 'completed' : 'failed',
      timestamp: tx.receipt?.blockNumber 
        ? new Date().toLocaleString() // Use current time as a fallback
        : 'Pending',
    })).sort((a, b) => {
      // Sort pending transactions first, then by newest first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });
  }, [transactions]);
  
  // Memoize the filter function
  const applyFilters = useCallback((txArray: any[], filterSettings: typeof filters) => {
    return txArray.filter((tx) => {
      if (filterSettings.type !== "all" && tx.type !== filterSettings.type) return false;
      if (filterSettings.status !== "all" && tx.status !== filterSettings.status) return false;
      return true;
    });
  }, []);
  
  // Apply filters whenever transactions or filter settings change
  useEffect(() => {
    const filtered = applyFilters(transactionArray, filters);
    setFilteredTransactions(filtered);
  }, [transactionArray, filters, applyFilters]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  }

  // Get unique transaction types for filter options
  const transactionTypes = useMemo(() => {
    return [...new Set(Array.from(transactions.values()).map(tx => tx.description.split(' ')[0]))];
  }, [transactions]);

  return (
    <section className="mb-10 relative">
      {/* Add a subtle checkered background */}
      <div className="absolute inset-0 -z-10 bg-checkered-yellow opacity-20"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-black relative inline-block">
          TRANSACTION HISTORY
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#FF3366] [clip-path:polygon(0_0,100%_0,96%_100%,4%_100%)]"></div>
        </h2>

        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="border-[4px] border-black rounded-none bg-white hover:bg-[#FFCC00] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-5 h-5" />
              <span>FILTER</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
            </Button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20">
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="font-bold mb-2">Transaction Type</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        key="all"
                        className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.type === "all" ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                        onClick={() => handleFilterChange("type", "all")}
                      >
                        ALL
                      </button>
                      {transactionTypes.map((type) => (
                        <button
                          key={type}
                          className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.type === type ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                          onClick={() => handleFilterChange("type", type)}
                        >
                          {type?.toUpperCase() || "TRANSACTION"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Status</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["all", "completed", "pending", "failed"].map((option) => (
                        <button
                          key={option}
                          className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.status === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                          onClick={() => handleFilterChange("status", option)}
                        >
                          {option === "all" ? "ALL" : option.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Download className="w-5 h-5" />
            <span>EXPORT</span>
          </Button>
        </div>
      </div>

      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
        {/* Add decorative elements */}
        <div className="absolute -top-8 -right-8 w-16 h-16 bg-[#FF3366] border-[4px] border-black -rotate-12 hidden md:block"></div>

        <div className="overflow-x-auto">
          {filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b-[6px] border-black">
                  <th className="p-4 text-left font-black">Type</th>
                  <th className="p-4 text-left font-black">Description</th>
                  <th className="p-4 text-left font-black">Status</th>
                  <th className="p-4 text-left font-black">Transaction Hash</th>
                  <th className="p-4 text-left font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    className={`border-b-[3px] border-black hover:bg-[#f5f5f5] transition-colors ${index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            tx.status === "completed"
                              ? "bg-green-500"
                              : tx.status === "pending"
                                ? "bg-[#FFCC00]"
                                : "bg-[#FF3366]"
                          }`}
                        ></div>
                        <span className="font-bold capitalize">{tx.typeName}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">{tx.description}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-bold ${
                          tx.status === "completed"
                            ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                            : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                              : "bg-red-100 text-red-800 border-[2px] border-red-800"
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{tx.hash}</td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                        onClick={() => window.open(`https://holesky.etherscan.io/tx/${tx.hash}`, '_blank')}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-lg font-bold mb-2">No transactions found</p>
              <p className="text-gray-500">Your blockchain transaction history will appear here once you start interacting with the contracts.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t-[3px] border-black bg-[#f5f5f5] flex justify-between items-center">
          <div className="font-bold">
            Showing {filteredTransactions.length} of {transactions.size} transactions
          </div>
        </div>
      </div>
    </section>
  )
}

