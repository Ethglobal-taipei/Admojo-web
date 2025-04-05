import { 
  encodeAbiParameters, 
  decodeAbiParameters, 
  parseAbiParameters 
} from 'viem';
import { BoothMetadata, CampaignMetadata } from './types';

/**
 * Utilities for encoding and decoding data to/from the blockchain
 * These functions can be used across different contract implementations
 */
export class EncodingUtils {
  /**
   * Encode booth metadata to bytes
   * @param metadata Booth metadata
   * @returns Hex string representation of the encoded data
   */
  static encodeBoothMetadata(metadata: BoothMetadata): `0x${string}` {
    return encodeAbiParameters(
      parseAbiParameters('string, string, string'),
      [
        metadata.location, 
        metadata.displaySize, 
        metadata.additionalInfo || ''
      ]
    );
  }
  
  /**
   * Decode booth metadata from bytes
   * @param metadataBytes Hex string representation of the encoded data
   * @returns Booth metadata object
   */
  static decodeBoothMetadata(metadataBytes: `0x${string}`): BoothMetadata {
    const [location, displaySize, additionalInfo] = decodeAbiParameters(
      parseAbiParameters('string, string, string'),
      metadataBytes
    );
    
    return { 
      location, 
      displaySize, 
      additionalInfo: additionalInfo || undefined 
    };
  }
  
  /**
   * Encode campaign metadata to bytes
   * @param metadata Campaign metadata
   * @returns Hex string representation of the encoded data
   */
  static encodeCampaignMetadata(metadata: CampaignMetadata): `0x${string}` {
    return encodeAbiParameters(
      parseAbiParameters('string, string, string, uint256, uint32, string'),
      [
        metadata.name,
        metadata.description,
        metadata.contentURI,
        metadata.startDate,
        metadata.duration,
        metadata.additionalInfo || ''
      ]
    );
  }
  
  /**
   * Decode campaign metadata from bytes
   * @param metadataBytes Hex string representation of the encoded data
   * @returns Campaign metadata object
   */
  static decodeCampaignMetadata(metadataBytes: `0x${string}`): CampaignMetadata {
    const [name, description, contentURI, startDate, duration, additionalInfo] = decodeAbiParameters(
      parseAbiParameters('string, string, string, uint256, uint32, string'),
      metadataBytes
    );
    
    return {
      name,
      description,
      contentURI,
      startDate,
      duration,
      additionalInfo: additionalInfo || undefined
    };
  }
  
  /**
   * Ensures a string is in the hex format required by viem
   * @param value String value to convert to hex
   * @returns Hex string
   */
  static toHexString(value: string): `0x${string}` {
    if (!value.startsWith('0x')) {
      return `0x${value}` as `0x${string}`;
    }
    return value as `0x${string}`;
  }
} 