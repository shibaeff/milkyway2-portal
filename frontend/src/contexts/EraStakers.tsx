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
        let eraStakers: any[] = [];
        
        try {
          currentEra = await api.query.staking.currentEra();
        } catch (err) {
          console.log('Could not fetch current era:', err);
          setActiveValidators(0);
          return;
        }

        try {
          if (api.query.staking.erasStakers) {
            eraStakers = await api.query.staking.erasStakers.entries();
          }
        } catch (err) {
          console.log('Era stakers query not available, using validators count instead');
          // Fallback to total validators count
          try {
            const validators = await api.query.staking.validators.entries();
            setActiveValidators(validators.length);
            return;
          } catch (fallbackErr) {
            console.log('Could not get validators count:', fallbackErr);
            setActiveValidators(0);
            return;
          }
        }

        const era = (currentEra as any).unwrap().toNumber();
        const activeValidatorsCount = eraStakers.length;

        setActiveValidators(activeValidatorsCount);

        console.log(`Current era: ${era}`);
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