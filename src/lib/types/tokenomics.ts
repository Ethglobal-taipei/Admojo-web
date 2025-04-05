// Metal API response types
export interface MetalHolder {
  id: string;
  address: string;
  totalValue?: number;
  tokens?: Array<{
    token: MetalToken;
    balance: number;
    value: number;
  }>;
}

export interface MetalToken {
  id: string;
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  price?: number;
  holders?: MetalHolder[];
}

export interface MetalDistributeResponse {
  success: boolean;
  transaction: {
    id: string;
    hash: string;
    status: string;
  };
}

export interface MetalWithdrawResponse {
  success: boolean;
  transaction: {
    id: string;
    hash: string;
    status: string;
  };
}

// Ad Network specific types
export interface Display {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  status: "active" | "inactive" | "pending";
  category: string;
  footTraffic: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  depositAmount: number;
  displays: DisplayAllocation[];
  duration: {
    days: number;
    hoursPerDay: number;
  };
  hourlyRate: number;
  startDate: string;
  status: "active" | "completed" | "paused";
  createdAt: string;
  updatedAt?: string;
}

export interface DisplayAllocation {
  displayId: string;
  allocation: number; // Percentage of budget allocated to this display
  status: "active" | "inactive";
  updatedAt?: string;
}

export interface PerformanceMetrics {
  displayId: string;
  views: number;
  engagements: number;
  engagementRate: string;
  adcSpent: number;
}

export interface TimeSlotPerformance {
  timestamp: string;
  displays: Array<{
    displayId: string;
    metrics: PerformanceMetrics;
  }>;
  totals: {
    views: number;
    engagements: number;
    engagementRate: string;
    adcSpent: number;
  };
}

export interface PaymentResult {
  displayId: string;
  ownerId?: string;
  views?: number;
  viewShare?: number;
  minimumPayment?: number;
  performancePayment?: number;
  totalPayment?: number;
  status: "success" | "failed";
  transaction?: MetalWithdrawResponse;
  error?: string;
}

// Request and response types
export interface PurchaseAdcRequest {
  usdAmount: number;
  userId: string;
}

export interface DepositToEscrowRequest {
  userId: string;
  amount: number;
  campaignData: {
    displays: DisplayAllocation[];
    duration: {
      days: number;
      hoursPerDay: number;
    };
    hourlyRate?: number;
    startDate?: string;
  };
}

export interface ProcessPaymentsRequest {
  campaignId: string;
  timeSlot: string;
  performanceData: Array<{
    id: string;
    ownerId: string;
    views: number;
  }>;
}

export interface UpdateCampaignAllocationRequest {
  campaignId: string;
  userId: string;
  newAllocations: DisplayAllocation[];
}

export interface CreateHolderRequest {
  userId: string;
  userType: "advertiser" | "display_owner" | "escrow";
}

export interface InitializeTokenRequest {
  merchantAddress: string;
} 