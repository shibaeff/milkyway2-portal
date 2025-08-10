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

        let activeValidatorsCount = 0;
        
        // Method 1: Try to get session validators (most reliable for active validators)
        try {
          if (api.query.session && api.query.session.validators) {
            const sessionValidators = await api.query.session.validators();
            if (sessionValidators) {
              activeValidatorsCount = (sessionValidators as any).length;
              console.log(`Session validators count: ${activeValidatorsCount}`);
            }
          }
        } catch (err) {
          console.log('Session validators query not available:', err);
        }

        // Method 2: If session validators didn't work, try staking validators
        if (activeValidatorsCount === 0) {
          try {
            const validators = await api.query.staking.validators.entries();
            activeValidatorsCount = validators.length;
            console.log(`Staking validators count: ${activeValidatorsCount}`);
          } catch (err) {
            console.log('Could not get staking validators:', err);
          }
        }

        // Method 3: Try to get validator count from constants
        if (activeValidatorsCount === 0) {
          try {
            if (api.consts.staking && api.consts.staking.maxValidatorsCount) {
              const maxValidators = api.consts.staking.maxValidatorsCount;
              if (maxValidators) {
                activeValidatorsCount = (maxValidators as any).toNumber();
                console.log(`Max validators count: ${activeValidatorsCount}`);
              }
            }
          } catch (err) {
            console.log('Could not get max validators count:', err);
          }
        }

        setActiveValidators(activeValidatorsCount);
        console.log(`Final active validators count: ${activeValidatorsCount}`);

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