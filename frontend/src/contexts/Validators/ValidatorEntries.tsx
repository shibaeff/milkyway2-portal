import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useApi } from '../Api';
import type { 
  Validator, 
  ValidatorStatus, 
  Sync, 
  ValidatorAddresses, 
  ValidatorListEntry,
  LocalValidatorEntriesData,
  AverageEraValidatorReward
} from '../../types';
import { getLocalEraValidators, setLocalEraValidators } from '../../utils/storage';
import { perbillToPercent } from '../../utils/formatters';

interface ValidatorsContextInterface {
  getValidators: () => Validator[];
  fetchValidatorPrefs: (addresses: ValidatorAddresses) => Promise<Validator[] | null>;
  injectValidatorListData: (entries: Validator[]) => ValidatorListEntry[];
  validatorIdentities: Record<string, any>;
  validatorSupers: Record<string, any>;
  avgCommission: number;
  sessionValidators: string[];
  validatorsFetched: Sync;
  avgRewardRate: number;
  averageEraValidatorReward: AverageEraValidatorReward;
  formatWithPrefs: (addresses: string[]) => Validator[];
  getValidatorTotalStake: (address: string) => bigint;
  getValidatorRank: (address: string) => number | undefined;
  getValidatorRankSegment: (address: string) => number;
  isLoading: boolean;
  error: string | null;
}

const ValidatorsContext = createContext<ValidatorsContextInterface>({
  getValidators: () => [],
  fetchValidatorPrefs: async () => null,
  injectValidatorListData: () => [],
  validatorIdentities: {},
  validatorSupers: {},
  avgCommission: 0,
  sessionValidators: [],
  validatorsFetched: 'unsynced',
  avgRewardRate: 0,
  averageEraValidatorReward: { days: 0, reward: BigInt(0) },
  formatWithPrefs: () => [],
  getValidatorTotalStake: () => BigInt(0),
  getValidatorRank: () => undefined,
  getValidatorRankSegment: () => 0,
  isLoading: false,
  error: null,
});

export const useValidators = () => useContext(ValidatorsContext);

interface ValidatorsProviderProps {
  children: ReactNode;
}

export const ValidatorsProvider: React.FC<ValidatorsProviderProps> = ({ children }) => {
  const { api, isReady } = useApi();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [avgCommission, setAvgCommission] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatorsFetched, setValidatorsFetched] = useState<Sync>('unsynced');
  const [validatorIdentities, setValidatorIdentities] = useState<Record<string, any>>({});
  const [validatorSupers, setValidatorSupers] = useState<Record<string, any>>({});
  const [sessionValidators, setSessionValidators] = useState<string[]>([]);
  const [avgRewardRate, setAvgRewardRate] = useState(0);
  const [averageEraValidatorReward, setAverageEraValidatorReward] = useState<AverageEraValidatorReward>({
    days: 0,
    reward: BigInt(0),
  });

  // Network ID (hardcoded to polkadot for now)
  const network = 'polkadot';

  useEffect(() => {
    const fetchValidators = async () => {
      if (!api || !isReady) return;

      try {
        setIsLoading(true);
        setError(null);
        setValidatorsFetched('syncing');

        // Check for cached data first
        const currentEra = await api.query.staking.currentEra();
        const era = (currentEra as any).unwrap().toString();
        
        const cachedData = getLocalEraValidators(network, era);
        if (cachedData) {
          setValidators(cachedData.entries);
          setAvgCommission(cachedData.avgCommission);
          setValidatorsFetched('synced');
          setIsLoading(false);
          console.log('Using cached validator data');
          return;
        }

        // Fetch fresh data
        const validatorsEntries = await api.query.staking.validators.entries();
        
        // Try to fetch identities and supers, but don't fail if they don't exist
        let identities: any[] = [];
        let supers: any[] = [];
        
        try {
          if (api.query.identity && api.query.identity.identityOf) {
            identities = await api.query.identity.identityOf.entries();
          }
        } catch (err) {
          console.log('Identity queries not available on this network');
        }
        
        try {
          if (api.query.identity && api.query.identity.superOf) {
            supers = await api.query.identity.superOf.entries();
          }
        } catch (err) {
          console.log('Super identity queries not available on this network');
        }

        const validatorList: Validator[] = [];
        let totalCommission = 0;

        // Process identities
        const identityMap: Record<string, any> = {};
        identities.forEach(([address, identity]) => {
          const accountId = address.args[0].toString();
          identityMap[accountId] = identity;
        });

        // Process super identities
        const superMap: Record<string, any> = {};
        supers.forEach(([address, superIdentity]) => {
          const accountId = address.args[0].toString();
          superMap[accountId] = superIdentity;
        });

        setValidatorIdentities(identityMap);
        setValidatorSupers(superMap);

        // Process validators
        for (let i = 0; i < validatorsEntries.length; i++) {
          const [address, validatorInfo] = validatorsEntries[i];
          const accountId = address.args[0].toString();
          
          // Get identity
          let identity = accountId.slice(0, 8) + '...' + accountId.slice(-8);
          const identityData = identityMap[accountId];
          if (identityData && (identityData as any).isSome) {
            const identityInfo = (identityData as any).unwrap();
            if (identityInfo.info.display.isSome) {
              identity = identityInfo.info.display.unwrap().toString();
            }
          }

          // Get commission
          const commission = perbillToPercent((validatorInfo as any).commission.toNumber());
          totalCommission += commission;

          validatorList.push({
            address: accountId,
            identity,
            commission,
            active: true,
            rank: i + 1,
          });
        }

        const avgCommissionValue = validatorList.length > 0 ? totalCommission / validatorList.length : 0;

        setValidators(validatorList);
        setAvgCommission(avgCommissionValue);
        setValidatorsFetched('synced');

        // Cache the data
        setLocalEraValidators(network, era, validatorList, avgCommissionValue);

        console.log(`Fetched ${validatorList.length} validators from network`);
        console.log(`Average commission: ${avgCommissionValue.toFixed(2)}%`);

      } catch (err) {
        console.error('Failed to fetch validators:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch validators');
        setValidatorsFetched('unsynced');
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidators();
  }, [api, isReady]);

  const fetchValidatorPrefs = async (addresses: ValidatorAddresses): Promise<Validator[] | null> => {
    if (!api || !isReady) return null;

    try {
      const validatorsWithPrefs: Validator[] = [];
      
      for (const { address } of addresses) {
        const validatorInfo = await api.query.staking.validators(address);
        if ((validatorInfo as any).isSome) {
          const info = (validatorInfo as any).unwrap();
          const commission = perbillToPercent(info.commission.toNumber());
          
          validatorsWithPrefs.push({
            address,
            identity: address.slice(0, 8) + '...' + address.slice(-8),
            commission,
            active: true,
            rank: 0,
          });
        }
      }
      
      return validatorsWithPrefs;
    } catch (err) {
      console.error('Failed to fetch validator preferences:', err);
      return null;
    }
  };

  const formatWithPrefs = (addresses: string[]): Validator[] => {
    return addresses.map((address) => ({
      address,
      identity: address.slice(0, 8) + '...' + address.slice(-8),
      commission: 0,
      active: true,
      rank: 0,
    }));
  };

  const injectValidatorListData = (entries: Validator[]): ValidatorListEntry[] => {
    return entries.map((validator) => ({
      ...validator,
      validatorStatus: {
        isActive: validator.active,
        isBlocked: validator.blocked || false,
        isOversubscribed: false,
        isWaiting: false,
      },
    }));
  };

  const getValidatorTotalStake = (address: string): bigint => {
    const validator = validators.find(v => v.address === address);
    return validator?.totalStake || BigInt(0);
  };

  const getValidatorRank = (address: string): number | undefined => {
    const validator = validators.find(v => v.address === address);
    return validator?.rank;
  };

  const getValidatorRankSegment = (address: string): number => {
    const rank = getValidatorRank(address);
    if (!rank) return 0;
    return Math.ceil(rank / 100);
  };

  const value: ValidatorsContextInterface = {
    getValidators: () => validators,
    fetchValidatorPrefs,
    injectValidatorListData,
    validatorIdentities,
    validatorSupers,
    avgCommission: Math.round(avgCommission * 10) / 10,
    sessionValidators,
    validatorsFetched,
    avgRewardRate,
    averageEraValidatorReward,
    formatWithPrefs,
    getValidatorTotalStake,
    getValidatorRank,
    getValidatorRankSegment,
    isLoading,
    error,
  };

  return <ValidatorsContext.Provider value={value}>{children}</ValidatorsContext.Provider>;
}; 