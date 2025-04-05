import { create } from "zustand"
import * as transactionService from '../api/transactionService'
import { useUserStore } from './useUserStore'

export type TransactionType = "deposit" | "withdrawal" | "swap" | "allocation" | "reallocation"
export type TransactionStatus = "completed" | "pending" | "failed"
export type TokenType = "USDC" | "ADC"

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  token: TokenType
  status: TransactionStatus
  timestamp: string
  txHash: string
}

export interface TransactionFilters {
  type: string
  token: string
  status: string
}

export interface TransactionState {
  // Data
  transactions: Transaction[]
  filters: TransactionFilters
  isLoading: boolean
  error: string | null

  // UI state
  isFilterOpen: boolean
  currentPage: number
  totalPages: number
  itemsPerPage: number

  // Actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  setFilter: (key: keyof TransactionFilters, value: string) => void
  resetFilters: () => void
  toggleFilterOpen: () => void
  fetchTransactions: (address?: string) => Promise<void>
  exportTransactions: (address?: string) => Promise<boolean>
  nextPage: () => void
  previousPage: () => void
  clearError: () => void

  // Computed
  getFilteredTransactions: () => Transaction[]
  getCurrentPageTransactions: () => Transaction[]
}

// Mock transaction data for fallback
const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: "deposit",
    amount: 1000,
    token: "USDC",
    status: "completed",
    timestamp: "Today, 08:45 AM",
    txHash: "0x7a23...b4f2",
  },
  {
    id: 2,
    type: "swap",
    amount: 2350,
    token: "ADC",
    status: "completed",
    timestamp: "Today, 08:46 AM",
    txHash: "0x8b12...c3e1",
  },
  {
    id: 3,
    type: "allocation",
    amount: 500,
    token: "ADC",
    status: "completed",
    timestamp: "Today, 09:15 AM",
    txHash: "0x9c34...d2f0",
  },
  {
    id: 4,
    type: "reallocation",
    amount: 250,
    token: "ADC",
    status: "completed",
    timestamp: "Yesterday, 14:22 PM",
    txHash: "0xa45b...e1d9",
  },
  {
    id: 5,
    type: "deposit",
    amount: 2000,
    token: "USDC",
    status: "completed",
    timestamp: "Mar 28, 10:30 AM",
    txHash: "0xb56c...f0e8",
  },
  {
    id: 6,
    type: "swap",
    amount: 4700,
    token: "ADC",
    status: "completed",
    timestamp: "Mar 28, 10:32 AM",
    txHash: "0xc67d...g9f7",
  },
  {
    id: 7,
    type: "allocation",
    amount: 1200,
    token: "ADC",
    status: "completed",
    timestamp: "Mar 28, 10:45 AM",
    txHash: "0xd78e...h8g6",
  },
  {
    id: 8,
    type: "withdrawal",
    amount: 500,
    token: "USDC",
    status: "pending",
    timestamp: "Mar 27, 16:20 PM",
    txHash: "0xe89f...i7h5",
  },
]

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  // Initial state
  transactions: [],
  filters: {
    type: "all",
    token: "all",
    status: "all",
  },
  isLoading: false,
  error: null,
  isFilterOpen: false,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 10,

  // Actions
  setTransactions: (transactions) => set({ 
    transactions,
    totalPages: Math.ceil(transactions.length / get().itemsPerPage)
  }),

  addTransaction: (transaction) =>
    set((state) => {
      const newTransactions = [transaction, ...state.transactions]
      return {
        transactions: newTransactions,
        totalPages: Math.ceil(newTransactions.length / state.itemsPerPage)
      }
    }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1, // Reset to first page when filtering
    })),

  resetFilters: () =>
    set({
      filters: {
        type: "all",
        token: "all",
        status: "all",
      },
      currentPage: 1,
    }),

  toggleFilterOpen: () =>
    set((state) => ({
      isFilterOpen: !state.isFilterOpen,
    })),
    
  fetchTransactions: async (address) => {
    try {
      set({ isLoading: true, error: null })
      
      // Get wallet address from user store if not provided
      let walletAddress = address
      if (!walletAddress) {
        const user = useUserStore.getState().user
        if (!user?.walletAddress) {
          throw new Error("No wallet address available")
        }
        walletAddress = user.walletAddress
      }
      
      const response = await transactionService.fetchTransactions(walletAddress, get().filters)
      
      if (response.success && response.data) {
        set({
          transactions: response.data,
          totalPages: Math.ceil(response.data.length / get().itemsPerPage),
          isLoading: false,
        })
      } else {
        // Fallback to mock data
        set({
          transactions: mockTransactions,
          totalPages: Math.ceil(mockTransactions.length / get().itemsPerPage),
          isLoading: false,
          error: response.error || "Could not fetch transactions from server"
        })
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Error fetching transactions",
        // Fallback to mock data
        transactions: mockTransactions,
        totalPages: Math.ceil(mockTransactions.length / get().itemsPerPage),
      })
      console.error("Error fetching transactions:", error)
    }
  },
  
  exportTransactions: async (address) => {
    try {
      set({ isLoading: true, error: null })
      
      // Get wallet address from user store if not provided
      let walletAddress = address
      if (!walletAddress) {
        const user = useUserStore.getState().user
        if (!user?.walletAddress) {
          throw new Error("No wallet address available")
        }
        walletAddress = user.walletAddress
      }
      
      const response = await transactionService.exportTransactions(walletAddress, get().filters)
      
      set({ isLoading: false })
      
      if (response.success && response.data) {
        // Create a download link
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `adnet-transactions-${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        return true
      } else {
        set({ error: response.error || "Could not export transactions" })
        return false
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Error exporting transactions" 
      })
      console.error("Error exporting transactions:", error)
      return false
    }
  },
  
  nextPage: () => {
    const { currentPage, totalPages } = get()
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 })
    }
  },
  
  previousPage: () => {
    const { currentPage } = get()
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 })
    }
  },
  
  clearError: () => set({ error: null }),

  // Computed values
  getFilteredTransactions: () => {
    const { transactions, filters } = get()

    return transactions.filter((tx) => {
      if (filters.type !== "all" && tx.type !== filters.type) return false
      if (filters.token !== "all" && tx.token !== filters.token) return false
      if (filters.status !== "all" && tx.status !== filters.status) return false
      return true
    })
  },
  
  getCurrentPageTransactions: () => {
    const { currentPage, itemsPerPage } = get()
    const filteredTransactions = get().getFilteredTransactions()
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return filteredTransactions.slice(startIndex, endIndex)
  },
}))

