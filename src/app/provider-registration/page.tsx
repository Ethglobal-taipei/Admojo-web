"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Building2, CreditCard, FileText, Loader2, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRoleStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { v4 as uuidv4 } from "uuid"
import dynamic from "next/dynamic"

// Dynamically import just the QR code component to prevent SSR issues
const SelfQRcodeWrapper = dynamic(
  () => import("@selfxyz/qrcode").then((mod) => mod.default),
  { ssr: false }
)

// Import types but don't actually import the module directly
type SelfAppOptionsType = import('@selfxyz/qrcode').SelfAppOptions;

// Type definitions for component props
interface FormData {
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessEmail: string;
  paymentMethod: string;
  walletAddress: string;
  bankName: string;
  accountNumber: string;
  taxId: string;
  termsAgreed: boolean;
  idVerified: boolean;
  businessVerified: boolean;
  selfVerified: boolean;
  selfVerificationData?: {
    name?: string;
    nationality?: string;
    date_of_birth?: string;
  };
}

interface StepProps {
  formData: FormData;
  updateForm: (updates: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep?: () => void;
}

// Step components
const BusinessInfoStep = ({ formData, updateForm, nextStep }: StepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Business Information</h2>
      <p className="text-gray-600">Tell us about your business to get started as a location provider.</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => updateForm({ businessName: e.target.value })}
            className="border-[3px] border-black rounded-none h-12"
            placeholder="Your Business Name"
            required
          />
        </div>

        <div>
          <Label htmlFor="businessType">Business Type</Label>
          <RadioGroup
            id="businessType"
            value={formData.businessType}
            onValueChange={(value) => updateForm({ businessType: value })}
            className="flex flex-col space-y-2 mt-2"
          >
            <div className="flex items-center space-x-2 border-[3px] border-black p-3 hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="cursor-pointer font-bold">
                Individual / Sole Proprietor
              </Label>
            </div>
            <div className="flex items-center space-x-2 border-[3px] border-black p-3 hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company" className="cursor-pointer font-bold">
                Registered Company
              </Label>
            </div>
            <div className="flex items-center space-x-2 border-[3px] border-black p-3 hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="partnership" id="partnership" />
              <Label htmlFor="partnership" className="cursor-pointer font-bold">
                Partnership
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="businessAddress">Business Address</Label>
          <Textarea
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => updateForm({ businessAddress: e.target.value })}
            className="border-[3px] border-black rounded-none min-h-[100px]"
            placeholder="Your Business Address"
            required
          />
        </div>

        <div>
          <Label htmlFor="businessEmail">Business Email</Label>
          <Input
            id="businessEmail"
            type="email"
            value={formData.businessEmail}
            onChange={(e) => updateForm({ businessEmail: e.target.value })}
            className="border-[3px] border-black rounded-none h-12"
            placeholder="your@business.com"
            required
          />
        </div>
      </div>

      <Button
        onClick={nextStep}
        className="w-full bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold py-6 h-auto rounded-none"
      >
        Continue <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )
}

const PaymentSetupStep = ({ formData, updateForm, nextStep, prevStep }: StepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment Setup</h2>
      <p className="text-gray-600">Set up how you'll receive payments for your ad locations.</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <RadioGroup
            id="paymentMethod"
            value={formData.paymentMethod}
            onValueChange={(value) => updateForm({ paymentMethod: value })}
            className="flex flex-col space-y-2 mt-2"
          >
            <div className="flex items-center space-x-2 border-[3px] border-black p-3 hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="crypto" id="crypto" />
              <Label htmlFor="crypto" className="cursor-pointer font-bold">
                Crypto Wallet (Direct)
              </Label>
            </div>
            <div className="flex items-center space-x-2 border-[3px] border-black p-3 hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="bank" id="bank" />
              <Label htmlFor="bank" className="cursor-pointer font-bold">
                Bank Account (Fiat Conversion)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.paymentMethod === "crypto" && (
          <div>
            <Label htmlFor="walletAddress">Wallet Address</Label>
            <Input
              id="walletAddress"
              value={formData.walletAddress}
              onChange={(e) => updateForm({ walletAddress: e.target.value })}
              className="border-[3px] border-black rounded-none h-12"
              placeholder="0x..."
              required
            />
          </div>
        )}

        {formData.paymentMethod === "bank" && (
          <>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => updateForm({ bankName: e.target.value })}
                className="border-[3px] border-black rounded-none h-12"
                placeholder="Bank Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => updateForm({ accountNumber: e.target.value })}
                className="border-[3px] border-black rounded-none h-12"
                placeholder="Account Number"
                required
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="taxId">Tax ID / VAT Number (Optional)</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => updateForm({ taxId: e.target.value })}
            className="border-[3px] border-black rounded-none h-12"
            placeholder="Tax ID or VAT Number"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={prevStep}
          className="flex-1 bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold py-6 h-auto rounded-none"
        >
          Back
        </Button>
        <Button
          onClick={nextStep}
          className="flex-1 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold py-6 h-auto rounded-none"
        >
          Continue <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

const VerificationStep = ({ formData, updateForm, nextStep, prevStep }: StepProps) => {
  const [showSelfQR, setShowSelfQR] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selfAppInstance, setSelfAppInstance] = useState<any>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate a user ID when the component mounts if it doesn't exist
    if (!userId) {
      setUserId(uuidv4());
    }
  }, [userId]);

  useEffect(() => {
    // Create the Self app instance when userId exists and QR should be shown
    async function createSelfAppInstance() {
      if (!userId || !showSelfQR) return;

      try {
        setLoadingQR(true);
        // Dynamically import the SelfAppBuilder
        const { SelfAppBuilder } = await import('@selfxyz/qrcode');

        // Create the app configuration
        const config: SelfAppOptionsType = {
          appName: "AdNet Protocol",
          scope: "adnet-protocol",
          endpoint: `https://3b28-111-235-226-124.ngrok-free.app/api/verify`,
          endpointType: "staging_https",
          logoBase64: "https://i.imgur.com/Rz8B3s7.png",
          userId,
          devMode: true,
          disclosures: {
            name: true,
            nationality: true,
            date_of_birth: true,
            minimumAge: 18,
          },
        };

        // Create the app instance
        const builder = new SelfAppBuilder(config);
        const app = builder.build();
        setSelfAppInstance(app);
        setLoadingQR(false);
      } catch (error) {
        console.error("Error creating Self app instance:", error);
        setLoadingQR(false);
      }
    }

    createSelfAppInstance();
  }, [userId, showSelfQR]);

  const handleSelfVerify = () => {
    setShowSelfQR(true);
  };

  const handleSelfVerificationSuccess = (data: Record<string, any>) => {
    console.log("Self verification successful:", data);
    
    // Update the form with verification data
    updateForm({
      selfVerified: true,
      selfVerificationData: {
        name: data?.credentialSubject?.name,
        nationality: data?.credentialSubject?.nationality,
        date_of_birth: data?.credentialSubject?.date_of_birth,
      },
    });
    
    setShowSelfQR(false);
    setSelfAppInstance(null);
    
    toast(
      "Verification Successful",
      { description: "Your identity has been verified via Self." },
      "success"
    );
  };

  // Only render the Self QR code if userId exists and showSelfQR is true
  const renderSelfQRCode = () => {
    if (!userId || !showSelfQR) return null;
    if (typeof window === 'undefined') return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Verify Your Identity</h3>
          <p className="text-sm text-gray-600 mb-6">
            Scan this QR code with the Self app to verify your identity
          </p>
          
          <div className="flex justify-center">
            {loadingQR ? (
              <div className="py-8 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className="text-sm text-gray-500">Loading QR code...</p>
              </div>
            ) : selfAppInstance ? (
              <SelfQRcodeWrapper
                selfApp={selfAppInstance}
                onSuccess={handleSelfVerificationSuccess}
                size={250}
              />
            ) : (
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-md">
                <p className="text-red-600">Error creating Self QR code. Please try again later.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={() => {
                setShowSelfQR(false);
                setSelfAppInstance(null);
              }}
              className="bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold py-2 h-auto rounded-none"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Pass the isSubmitting state up to the parent component
  const handleNext = () => {
    setIsSubmitting(true);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Verification</h2>
      <p className="text-gray-600">Verify your identity and business. Choose one option:</p>

      <div className="space-y-4">
        {/* Self Protocol Verification Option */}
        <div className="mb-8">
          <Label htmlFor="selfVerification">Identity Verification via Self</Label>
          <div className="border-[3px] border-black rounded-none p-6 mt-2 bg-blue-50">
            <div className="text-center">
              <Scan className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-2 text-sm text-gray-700 font-medium">
                Verify your identity instantly using the Self app
              </p>
              <p className="mt-1 text-xs text-gray-500 mb-4">
                A secure, privacy-preserving way to verify your age and identity
              </p>
              
              {formData.selfVerified ? (
                <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
                  <div className="flex items-center justify-center text-green-600 mb-2">
                    <Check className="h-5 w-5 mr-1" /> Verified
                  </div>
                  {formData.selfVerificationData?.name && (
                    <div className="text-sm">
                      <p className="font-medium">Name: {formData.selfVerificationData.name}</p>
                      {formData.selfVerificationData.nationality && (
                        <p>Country: {formData.selfVerificationData.nationality}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  className="bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold py-2 h-auto rounded-none"
                  onClick={handleSelfVerify}
                >
                  Verify using Self
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Render alternative verification options only if not verified via Self */}
        {!formData.selfVerified && (
          <>
            <div>
              <Label htmlFor="idVerification">ID Verification (Alternative)</Label>
              <div className="border-[3px] border-black rounded-none p-6 mt-2 bg-gray-50">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload a government-issued ID (Passport, Driver&apos;s License, etc.)
                  </p>
                  <Button
                    className="mt-4 bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold py-2 h-auto rounded-none"
                    onClick={() => updateForm({ idVerified: true })}
                  >
                    Upload ID
                  </Button>
                  {formData.idVerified && (
                    <div className="mt-2 flex items-center justify-center text-green-500">
                      <Check className="h-5 w-5 mr-1" /> Uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="businessVerification">Business Verification</Label>
              <div className="border-[3px] border-black rounded-none p-6 mt-2 bg-gray-50">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Upload business registration documents or proof of business
                  </p>
                  <Button
                    className="mt-4 bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold py-2 h-auto rounded-none"
                    onClick={() => updateForm({ businessVerified: true })}
                  >
                    Upload Documents
                  </Button>
                  {formData.businessVerified && (
                    <div className="mt-2 flex items-center justify-center text-green-500">
                      <Check className="h-5 w-5 mr-1" /> Uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Terms & Conditions */}
        <div>
          <Label htmlFor="termsAgreement">Terms & Conditions</Label>
          <div className="flex items-start mt-2">
            <input
              type="checkbox"
              id="termsAgreement"
              className="border-[3px] border-black rounded-none h-5 w-5 mt-1"
              checked={formData.termsAgreed}
              onChange={(e) => updateForm({ termsAgreed: e.target.checked })}
            />
            <Label htmlFor="termsAgreement" className="ml-2 text-sm">
              I agree to the AdNet Provider Terms of Service and understand that my information will be verified before I can list locations.
            </Label>
          </div>
        </div>
      </div>

      {/* Render the Self QR code modal */}
      {renderSelfQRCode()}

      <div className="flex gap-4">
        <Button
          onClick={prevStep}
          className="flex-1 bg-white text-black border-[3px] border-black hover:bg-[#f5f5f5] transition-all font-bold py-6 h-auto rounded-none"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            !(
              (formData.selfVerified && formData.termsAgreed) ||
              (!formData.selfVerified &&
                formData.idVerified &&
                formData.businessVerified &&
                formData.termsAgreed)
            ) || isSubmitting
          }
          className="flex-1 bg-[#0055FF] text-white border-[3px] border-black hover:bg-[#003cc7] transition-all font-bold py-6 h-auto rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>Complete Registration <ChevronRight className="ml-2 h-5 w-5" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

const SuccessStep = ({ router }: { router: ReturnType<typeof useRouter> }) => {
  return (
    <div className="space-y-6 text-center">
      <div className="bg-green-100 flex items-center justify-center w-20 h-20 mx-auto rounded-full">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Registration Complete!</h2>
      <p className="text-gray-600">
        Congratulations! Your provider account has been successfully created.
      </p>
      
      <Button
        onClick={() => router.push("/provider-dashboard")}
        className="w-full bg-[#FF3366] text-white border-[3px] border-black hover:bg-[#e0234e] transition-all font-bold py-6 h-auto rounded-none"
      >
        Go to Provider Dashboard
      </Button>
    </div>
  )
}

export default function ProviderRegistrationPage() {
  const router = useRouter()
  const { setProviderRegistered } = useRoleStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    businessType: "individual",
    businessAddress: "",
    businessEmail: "",
    paymentMethod: "crypto",
    walletAddress: "",
    bankName: "",
    accountNumber: "",
    taxId: "",
    termsAgreed: false,
    idVerified: false,
    businessVerified: false,
    selfVerified: false,
  })

  const updateForm = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    // Validation (simplified for demo)
    if (currentStep === 1 && !formData.businessName) {
      toast("Missing Information", { description: "Please enter your business name" }, "error")
      return
    }

    if (currentStep === 2 && formData.paymentMethod === "crypto" && !formData.walletAddress) {
      toast("Missing Information", { description: "Please enter your wallet address" }, "error")
      return
    }
    
    // If we're at the verification step and it's validated, submit the form
    if (currentStep === 3 && 
        ((formData.selfVerified && formData.termsAgreed) || 
        (!formData.selfVerified && formData.idVerified && formData.businessVerified && formData.termsAgreed))) {
      handleSubmitProvider();
      return;
    }

    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }
  
  const handleSubmitProvider = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/provider/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register provider');
      }
      
      // Set provider as registered in the store
      setProviderRegistered(true);
      
      // Move to success page
      setCurrentStep(4);
      
      toast(
        "Registration Successful",
        { description: "Your provider account has been created successfully." },
        "success"
      );
    } catch (error) {
      console.error('Error registering provider:', error);
      toast(
        "Registration Failed",
        { description: error instanceof Error ? error.message : "An unknown error occurred" },
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressSteps = () => {
    const steps = [
      { icon: Building2, label: "Business Info" },
      { icon: CreditCard, label: "Payment Setup" },
      { icon: FileText, label: "Verification" },
    ]

    return (
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const StepIcon = step.icon
          const isActive = currentStep === stepNumber
          const isCompleted = currentStep > stepNumber

          return (
            <div key={stepNumber} className="flex flex-col items-center relative w-1/4">
              <div
                className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center
                  ${isActive || isCompleted ? "border-[#0055FF] bg-[#0055FF] text-white" : "border-black bg-white text-black"}
                `}
              >
                {isCompleted ? <Check className="w-7 h-7" /> : <StepIcon className="w-7 h-7" />}
              </div>
              <p className="text-sm font-medium mt-2 text-center">{step.label}</p>
              {stepNumber < steps.length && (
                <div
                  className={`absolute left-[50%] w-[calc(100%-20px)] h-1 top-7 -z-10 ${
                    currentStep > stepNumber ? "bg-[#0055FF]" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black mb-8 text-center">Provider Registration</h1>

      {currentStep <= 3 && renderProgressSteps()}

      <div className="border-[4px] border-black p-8 bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        {currentStep === 1 && <BusinessInfoStep formData={formData} updateForm={updateForm} nextStep={nextStep} />}
        
        {currentStep === 2 && (
          <PaymentSetupStep formData={formData} updateForm={updateForm} nextStep={nextStep} prevStep={prevStep} />
        )}
        
        {currentStep === 3 && (
          <VerificationStep 
            formData={formData} 
            updateForm={updateForm} 
            nextStep={nextStep} 
            prevStep={prevStep} 
          />
        )}
        
        {currentStep === 4 && <SuccessStep router={router} />}
      </div>
    </div>
  )
}

