declare module '@selfxyz/qrcode' {
  export interface SelfAppOptions {
    appName: string;
    scope: string;
    endpoint: string;
    logoBase64?: string;
    userId: string;
    disclosures?: {
      issuing_state?: boolean;
      name?: boolean;
      nationality?: boolean;
      date_of_birth?: boolean;
      passport_number?: boolean;
      gender?: boolean;
      expiry_date?: boolean;
      minimumAge?: number;
      excludedCountries?: string[];
      ofac?: boolean;
    };
  }

  export interface SelfQRProps {
    selfApp: any;
    onSuccess: (data: any) => void;
    darkMode?: boolean;
    size?: number;
  }

  export class SelfAppBuilder {
    constructor(options: SelfAppOptions);
    build(): any;
  }

  export default function SelfQRcodeWrapper(props: SelfQRProps): JSX.Element;
}

declare module '@selfxyz/core' {
  export interface VerificationResult {
    isValid: boolean;
    isValidDetails?: any;
    credentialSubject?: {
      name?: string;
      nationality?: string;
      date_of_birth?: string;
      [key: string]: any;
    };
  }

  export class SelfBackendVerifier {
    constructor(rpcUrl: string, scope: string);
    setMinimumAge(age: number): void;
    excludeCountries(...countries: string[]): void;
    enableNameAndDobOfacCheck(): void;
    verify(proof: any, publicSignals: any): Promise<VerificationResult>;
  }

  export function getUserIdentifier(publicSignals: any): Promise<string>;

  export const countryCodes: {
    [key: string]: string;
    IRN: string;
    PRK: string;
    RUS: string;
  };
} 