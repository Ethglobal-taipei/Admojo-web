import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usePrivy } from "@privy-io/react-auth";
import { useAdContract } from "@/hooks/use-ad-contract";
import { 
  getOrCreateUserByAddress, 
  registerProvider as dbRegisterProvider,
  getProviderByAddress,
  updateAnalytics
} from "../db";

interface ProviderFormData {
  businessName: string;
  businessType: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  country: string;
  website?: string;
  paymentAddress: string;
  deviceId?: string;
}

interface ProviderState {
  // Provider data
  formData: ProviderFormData;
  provider: any | null; // Provider data from database
  isRegistered: boolean;
  isSubmitting: boolean;
  errors: Partial<Record<keyof ProviderFormData, string>>;
  currentStep: number;
  
  // Actions
  updateFormData: (data: Partial<ProviderFormData>) => void;
  resetFormData: () => void;
  validateForm: () => boolean;
  registerProvider: () => Promise<boolean>;
  checkProviderStatus: () => Promise<boolean>;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const initialFormData: ProviderFormData = {
  businessName: "",
  businessType: "",
  contactEmail: "",
  contactPhone: "",
  city: "",
  country: "",
  website: "",
  paymentAddress: "",
  deviceId: "",
};

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      formData: initialFormData,
      provider: null,
      isRegistered: false,
      isSubmitting: false,
      errors: {},
      currentStep: 1,
      
      updateFormData: (data) => 
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      
      resetFormData: () => 
        set({
          formData: initialFormData,
          errors: {},
          currentStep: 1,
        }),
      
      validateForm: () => {
        const { formData, currentStep } = get();
        const errors: Partial<Record<keyof ProviderFormData, string>> = {};
        
        // Step 1 validation
        if (currentStep === 1) {
          if (!formData.businessName.trim()) {
            errors.businessName = "Business name is required";
          }
          if (!formData.businessType.trim()) {
            errors.businessType = "Business type is required";
          }
          if (!formData.contactEmail.trim()) {
            errors.contactEmail = "Contact email is required";
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
            errors.contactEmail = "Please enter a valid email address";
          }
          if (!formData.contactPhone.trim()) {
            errors.contactPhone = "Contact phone is required";
          }
        }
        
        // Step 2 validation
        if (currentStep === 2) {
          if (!formData.city.trim()) {
            errors.city = "City is required";
          }
          if (!formData.country.trim()) {
            errors.country = "Country is required";
          }
        }
        
        // Step 3 validation
        if (currentStep === 3) {
          if (!formData.paymentAddress.trim()) {
            errors.paymentAddress = "Payment address is required";
          } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.paymentAddress)) {
            errors.paymentAddress = "Please enter a valid Ethereum address";
          }
        }
        
        set({ errors });
        return Object.keys(errors).length === 0;
      },
      
      registerProvider: async () => {
        const { formData, validateForm } = get();
        
        if (!validateForm()) {
          return false;
        }
        
        set({ isSubmitting: true });
        
        try {
          // Get wallet address from Privy
          const privyUser = usePrivy().user;
          if (!privyUser || !privyUser.wallet?.address) {
            throw new Error("No authenticated user or wallet");
          }
          
          // Get AdContract from hook
          const { operations } = useAdContract();
          if (!operations || !operations.registerProvider) {
            throw new Error("Contract not available");
          }
          
          // Generate a unique device ID
          const deviceId = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.padEnd(66, '0');
          
          // Create metadata
          const metadata = JSON.stringify({
            businessName: formData.businessName,
            businessType: formData.businessType,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            city: formData.city,
            country: formData.country,
            website: formData.website || "",
            paymentAddress: formData.paymentAddress,
            registrationDate: new Date().toISOString(),
          });
          
          // Get or create user in database
          const user = await getOrCreateUserByAddress(privyUser.wallet.address);
          
          // Register provider in database
          await dbRegisterProvider(
            user.id,
            deviceId,
            JSON.parse(metadata),
            0 // Initial staked amount
          );
          
          // Update analytics
          await updateAnalytics(new Date(), {
            totalProviders: { increment: 1 },
            activeProviders: { increment: 1 },
          });
          
          // Register on blockchain
          const hash = await operations.registerProvider.execute(metadata, deviceId);
          
          set({ 
            isRegistered: true,
            isSubmitting: false,
            provider: await getProviderByAddress(privyUser.wallet.address)
          });
          
          return true;
        } catch (error) {
          console.error("Failed to register provider:", error);
          set({ isSubmitting: false });
          return false;
        }
      },
      
      checkProviderStatus: async () => {
        try {
          // Get wallet address from Privy
          const privyUser = usePrivy().user;
          if (!privyUser || !privyUser.wallet?.address) {
            return false;
          }
          
          // Check if provider exists in database
          const provider = await getProviderByAddress(privyUser.wallet.address);
          set({ 
            provider, 
            isRegistered: !!provider 
          });
          
          return !!provider;
        } catch (error) {
          console.error("Failed to check provider status:", error);
          return false;
        }
      },
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const { currentStep, validateForm } = get();
        if (validateForm() && currentStep < 3) {
          set({ currentStep: currentStep + 1 });
          return true;
        }
        return false;
      },
      
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },
    }),
    {
      name: "adnet-provider-storage",
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
      }),
    }
  )
); 