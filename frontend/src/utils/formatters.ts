import type { IdentityOf, SuperIdentity } from '../types';

// Convert Perbill to percentage
export const perbillToPercent = (perbill: number): number => {
  return perbill / 10000000; // Perbill to percentage
};

// Format validator identities
export const formatIdentities = (identities: Record<string, IdentityOf>) => {
  const formatted: Record<string, string> = {};
  
  Object.entries(identities).forEach(([address, identity]) => {
    if (identity.info.display.isSome) {
      formatted[address] = identity.info.display.unwrap();
    } else {
      formatted[address] = address.slice(0, 8) + '...' + address.slice(-8);
    }
  });
  
  return formatted;
};

// Format super identities
export const formatSuperIdentities = (supers: Record<string, SuperIdentity>) => {
  const formatted: Record<string, string> = {};
  
  Object.entries(supers).forEach(([address, superIdentity]) => {
    if (superIdentity.identity.info.display.isSome) {
      formatted[address] = superIdentity.identity.info.display.unwrap();
    } else {
      formatted[address] = address.slice(0, 8) + '...' + address.slice(-8);
    }
  });
  
  return formatted;
};

// Format bigint to human readable string
export const formatBigInt = (value: bigint, decimals: number = 10): string => {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr}`;
}; 