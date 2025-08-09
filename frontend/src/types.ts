export interface Validator {
  address: string;
  identity: string;
  commission: number;
  active: boolean;
  rank: number;
  totalStake?: bigint;
  selfStake?: bigint;
  otherStake?: bigint;
  nominators?: number;
  rewardDestination?: string;
  blocked?: boolean;
  // New statistics fields
  eraPoints?: number;
  performance?: number;
  totalEraPoints?: number;
  averageEraPoints?: number;
  lastEraPoints?: number;
  isActive?: boolean;
  isBlocked?: boolean;
  isOversubscribed?: boolean;
  isWaiting?: boolean;
}

export interface ValidatorStatus {
  isActive: boolean;
  isBlocked: boolean;
  isOversubscribed: boolean;
  isWaiting: boolean;
}

export interface ValidatorEraPoints {
  era: number;
  points: number;
  start: string;
}

export interface ValidatorEraPointsResult {
  loading: boolean;
  error: any;
  data?: {
    validatorEraPoints: ValidatorEraPoints[];
  };
  refetch: () => void;
}

export interface ValidatorStatistics {
  address: string;
  eraPoints: ValidatorEraPoints[];
  totalEraPoints: number;
  averageEraPoints: number;
  lastEraPoints: number;
  performance: number;
  totalStake: bigint;
  selfStake: bigint;
  otherStake: bigint;
  nominators: number;
  commission: number;
  isActive: boolean;
  isBlocked: boolean;
  isOversubscribed: boolean;
  isWaiting: boolean;
}

export interface IdentityOf {
  info: {
    display: {
      isSome: boolean;
      unwrap: () => string;
    };
    legal: {
      isSome: boolean;
      unwrap: () => string;
    };
    web: {
      isSome: boolean;
      unwrap: () => string;
    };
    riot: {
      isSome: boolean;
      unwrap: () => string;
    };
    email: {
      isSome: boolean;
      unwrap: () => string;
    };
    pgpFingerprint: {
      isSome: boolean;
      unwrap: () => string;
    };
    image: {
      isSome: boolean;
      unwrap: () => string;
    };
    twitter: {
      isSome: boolean;
      unwrap: () => string;
    };
  };
  judgements: any[];
  deposit: bigint;
}

export interface SuperIdentity {
  super: string;
  sub: string;
  identity: IdentityOf;
}

export type Sync = 'unsynced' | 'syncing' | 'synced';

export type NetworkId = 'local' | 'polkadot' | 'kusama' | 'westend' | 'paseo';

export type AnyJson = any;

export interface AverageEraValidatorReward {
  days: number;
  reward: bigint;
}

export type ValidatorAddresses = {
  address: string;
}[];

export interface LocalValidatorEntriesData {
  avgCommission: number;
  era: string;
  entries: Validator[];
}

export type ValidatorListEntry = Validator & {
  validatorStatus: ValidatorStatus;
};

// Ethereum window interface
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      isTalisman?: boolean;
    };
    talisman?: {
      getAccounts: () => Promise<Array<{ address: string; name?: string }>>;
      subscribe: (event: string, callback: (...args: any[]) => void) => void;
      unsubscribe: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
} 