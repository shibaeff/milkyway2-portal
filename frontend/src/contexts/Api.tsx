import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { getRandomRpcEndpoint, DefaultNetwork } from '../config/networks';
import type { NetworkId } from '../types';

interface StakingMetrics {
  counterForValidators: number;
  maxValidatorsCount: number;
  validatorCount: number;
}

interface ApiContextInterface {
  isReady: boolean;
  api: ApiPromise | null;
  stakingMetrics: StakingMetrics;
  error: string | null;
  network: NetworkId;
  setNetwork: (network: NetworkId) => void;
  rpcEndpoint: string;
}

const ApiContext = createContext<ApiContextInterface>({
  isReady: false,
  api: null,
  stakingMetrics: {
    counterForValidators: 0,
    maxValidatorsCount: 0,
    validatorCount: 0,
  },
  error: null,
  network: DefaultNetwork,
  setNetwork: () => {},
  rpcEndpoint: '',
});

export const useApi = () => useContext(ApiContext);

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [stakingMetrics, setStakingMetrics] = useState<StakingMetrics>({
    counterForValidators: 0,
    maxValidatorsCount: 0,
    validatorCount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [network, setNetworkState] = useState<NetworkId>(DefaultNetwork);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>('');

  const setNetwork = (newNetwork: NetworkId) => {
    setNetworkState(newNetwork);
  };

  useEffect(() => {
    const connectToNetwork = async () => {
      try {
        setError(null);
        
        // Get a random RPC endpoint for the network
        const endpoint = getRandomRpcEndpoint(network);
        setRpcEndpoint(endpoint);
        
        console.log(`🔗 Connecting to ${network} via ${endpoint}`);
        
        // Connect to the network
        const wsProvider = new WsProvider(endpoint);
        const apiInstance = await ApiPromise.create({ provider: wsProvider });
        
        setApi(apiInstance);
        
        // Wait for API to be ready
        await apiInstance.isReady;
        setIsReady(true);
        
        // Fetch staking metrics
        try {
          const [validators, currentEra] = await Promise.all([
            apiInstance.query.staking.validators.entries(),
            apiInstance.query.staking.currentEra(),
          ]);
          
          const validatorCount = validators.length;
          let maxValidatorsCount = 1000; // Default fallback
          
          // Try to get max validators count
          try {
            if (apiInstance.consts.staking && apiInstance.consts.staking.maxValidatorsCount) {
              const maxValidators = apiInstance.consts.staking.maxValidatorsCount;
              if (maxValidators) {
                maxValidatorsCount = (maxValidators as any).toNumber();
              }
            }
          } catch (err) {
            console.log('Could not get max validators count, using default:', err);
          }
          
          setStakingMetrics({
            counterForValidators: validatorCount,
            maxValidatorsCount,
            validatorCount,
          });
          
          console.log(`✅ Connected to ${network}`);
          console.log(`📊 Total validators: ${validatorCount}`);
          console.log(`📊 Max validators: ${maxValidatorsCount}`);
          console.log(`🏛️  Current era: ${currentEra.toString()}`);
          
        } catch (err) {
          console.error('Failed to fetch staking metrics:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch network data');
        }
        
      } catch (err) {
        console.error(`Failed to connect to ${network}:`, err);
        setError(err instanceof Error ? err.message : `Failed to connect to ${network}`);
        setIsReady(false);
      }
    };

    connectToNetwork();

    // Cleanup on unmount or network change
    return () => {
      if (api) {
        api.disconnect();
      }
    };
  }, [network]);

  const value: ApiContextInterface = {
    isReady,
    api,
    stakingMetrics,
    error,
    network,
    setNetwork,
    rpcEndpoint,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}; 