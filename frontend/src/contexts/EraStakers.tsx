import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useApi } from './Api';

interface EraStakersContextInterface {
  activeValidators: number;
  isLoading: boolean;
  error: string | null;
}

const EraStakersContext = createContext<EraStakersContextInterface>({
  activeValidators: 0,
  isLoading: false,
  error: null,
});

export const useEraStakers = () => useContext(EraStakersContext);

interface EraStakersProviderProps {
  children: ReactNode;
}

export const EraStakersProvider: React.FC<EraStakersProviderProps> = ({ children }) => {
  const { api, isReady } = useApi();
  const [activeValidators, setActiveValidators] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveValidators = async () => {
      if (!api || !isReady) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get current era and active validators
        let currentEra;
        let activeValidatorsCount = 0;
        
        try {
          currentEra = await api.query.staking.currentEra();
          const era = (currentEra as any).unwrap().toNumber();
          console.log(`Current era: ${era}`);
        } catch (err) {
          console.log('Could not fetch current era:', err);
          setActiveValidators(0);
          return;
        }

        // Get active validators using the correct API call
        try {
          // Method 1: Try to get active validators from the current era
          if (api.query.staking.erasStakers) {
            const currentEra = await api.query.staking.currentEra();
            const era = (currentEra as any).unwrap().toNumber();
            
            // Get the active validators for the current era
            const eraStakers = await api.query.staking.erasStakers(era);
            if (eraStakers && (eraStakers as any).isSome) {
              const stakersData = (eraStakers as any).unwrap();
              // The validators are stored in the 'others' field
              if (stakersData.others) {
                activeValidatorsCount = stakersData.others.length;
              }
            }
          }
          
          // If the above method didn't work, try alternative approaches
          if (activeValidatorsCount === 0) {
            // Method 2: Get validators and filter active ones
            const validators = await api.query.staking.validators.entries();
            activeValidatorsCount = validators.length;
          }
          
          // Method 3: Try to get the validator set size
          if (activeValidatorsCount === 0) {
            try {
              const validatorSet = await api.query.staking.validatorCount();
              if (validatorSet) {
                activeValidatorsCount = (validatorSet as any).toNumber();
              }
            } catch (err) {
              console.log('Could not get validator count:', err);
            }
          }

        } catch (err) {
          console.log('Could not fetch active validators, trying fallback methods:', err);
          
          // Fallback: Get total validators count
          try {
            const validators = await api.query.staking.validators.entries();
            activeValidatorsCount = validators.length;
          } catch (fallbackErr) {
            console.log('Could not get validators count:', fallbackErr);
            activeValidatorsCount = 0;
          }
        }

        setActiveValidators(activeValidatorsCount);
        console.log(`Active validators: ${activeValidatorsCount}`);

      } catch (err) {
        console.error('Failed to fetch active validators:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch active validators');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveValidators();
  }, [api, isReady]);

  const value: EraStakersContextInterface = {
    activeValidators,
    isLoading,
    error,
  };

  return <EraStakersContext.Provider value={value}>{children}</EraStakersContext.Provider>;
}; 