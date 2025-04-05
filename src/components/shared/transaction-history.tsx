"use client"

import { useState } from "react"
import { Download, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// Transaction type definition
export type Transaction = {
  id: number
  type: string
  amount: number
  token: string
  status: string
  timestamp: string
  txHash: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  title?: string
  showExport?: boolean
  showPagination?: boolean
}

export default function TransactionHistory({
  transactions,
  title = "TRANSACTION HISTORY",
  showExport = true,
  showPagination = true,
}: TransactionHistoryProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    type: "all",
    token: "all",
    status: "all",
  })

  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value,
    })
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.type !== "all" && tx.type !== filters.type) return false
    if (filters.token !== "all" && tx.token !== filters.token) return false
    if (filters.status !== "all" && tx.status !== filters.status) return false
    return true
  })

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-black relative inline-block">
          {title}
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
                      {["all", "deposit", "swap", "allocation", "reallocation", "withdrawal"].map((option) => (
                        <button
                          key={option}
                          className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.type === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                          onClick={() => handleFilterChange("type", option)}
                        >
                          {option === "all" ? "ALL" : option.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-bold mb-2">Token</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["all", "USDC", "ADC"].map((option) => (
                        <button
                          key={option}
                          className={`border-[2px] border-black px-2 py-1 font-bold text-xs transition-all hover:-translate-y-1 ${filters.token === option ? "bg-[#0055FF] text-white" : "bg-white hover:bg-[#f5f5f5]"}`}
                          onClick={() => handleFilterChange("token", option)}
                        >
                          {option === "all" ? "ALL" : option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Status</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["all", "completed", "pending"].map((option) => (
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

          {showExport && (
            <Button
              variant="outline"
              className="border-[4px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-4 py-2 h-auto flex items-center gap-2 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Download className="w-5 h-5" />
              <span>EXPORT</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border-[6px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[6px] border-black">
                <th className="p-4 text-left font-black">Type</th>
                <th className="p-4 text-left font-black">Amount</th>
                <th className="p-4 text-left font-black">Status</th>
                <th className="p-4 text-left font-black">Timestamp</th>
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
                          tx.type === "deposit"
                            ? "bg-[#0055FF]"
                            : tx.type === "withdrawal"
                              ? "bg-[#FF3366]"
                              : tx.type === "swap"
                                ? "bg-[#FFCC00]"
                                : "bg-green-500"
                        }`}
                      ></div>
                      <span className="font-bold capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold">
                    {tx.type === "withdrawal" ? "-" : "+"}
                    {tx.amount.toLocaleString()} {tx.token}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold ${
                        tx.status === "completed"
                          ? "bg-green-100 text-green-800 border-[2px] border-green-800"
                          : "bg-yellow-100 text-yellow-800 border-[2px] border-yellow-800"
                      }`}
                    >
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{tx.timestamp}</td>
                  <td className="p-4 font-mono text-sm">{tx.txHash}</td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      className="border-[2px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold text-xs px-2 py-1 h-auto hover:-translate-y-1"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showPagination && (
          <div className="p-4 border-t-[3px] border-black bg-[#f5f5f5] flex justify-between items-center">
            <div className="font-bold">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[3px] border-black rounded-none bg-white hover:bg-[#f5f5f5] transition-all font-bold px-3 py-1 h-auto hover:-translate-y-1 disabled:opacity-50"
                disabled
              >
                Previous
              </Button>
              <Button className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#FFCC00] hover:text-black transition-all font-bold px-3 py-1 h-auto rounded-none hover:-translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

