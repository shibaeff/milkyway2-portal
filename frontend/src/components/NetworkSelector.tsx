import React from 'react';
import { useApi } from '../contexts/Api';
import { getRpcEndpoints } from '../config/networks';
import type { NetworkId } from '../types';

// Polkadot Brand Colors
const POLKADOT_COLORS = {
  primary: '#E6007A', // Polkadot Pink
  secondary: '#07FFFF', // Cyan
  violet: '#7916F3',
  white: '#FFFFFF',
  black: '#000000',
  storm200: '#DCE2E9', // Light gray
  storm400: '#AEB7CB', // Medium gray
  storm700: '#6E7391', // Dark gray
  pinkLight: '#FF2670', // Lighter pink variation
};

export const NetworkSelector: React.FC = () => {
  const { network, setNetwork, rpcEndpoint, isReady } = useApi();
  const rpcEndpoints = getRpcEndpoints(network);

  const handleNetworkChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = event.target.value as NetworkId;
    setNetwork(newNetwork);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem 1rem',
      background: POLKADOT_COLORS.white,
      borderRadius: '8px',
      border: `1px solid ${POLKADOT_COLORS.storm400}`,
      boxShadow: `0 2px 8px rgba(0, 0, 0, 0.05)`,
    }}>
      <label htmlFor="network-select" style={{ 
        fontSize: '0.875rem', 
        fontWeight: '600',
        color: POLKADOT_COLORS.storm700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Network:
      </label>
      <select
        id="network-select"
        value={network}
        onChange={handleNetworkChange}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          border: `1px solid ${POLKADOT_COLORS.storm400}`,
          fontSize: '0.875rem',
          fontWeight: '500',
          color: POLKADOT_COLORS.black,
          background: POLKADOT_COLORS.white,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = POLKADOT_COLORS.primary;
          e.target.style.boxShadow = `0 0 0 3px rgba(230, 0, 122, 0.1)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = POLKADOT_COLORS.storm400;
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="local">Local Node</option>
        <option value="polkadot">Polkadot</option>
        <option value="kusama">Kusama</option>
        <option value="westend">Testnet</option>
        <option value="paseo">Paseo</option>
      </select>
    </div>
  );
}; 