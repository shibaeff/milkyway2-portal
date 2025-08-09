import React, { ReactNode } from 'react';

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

interface CardWrapperProps {
  children: ReactNode;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ children }) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${POLKADOT_COLORS.white} 0%, ${POLKADOT_COLORS.storm200} 100%)`,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: `0 8px 32px rgba(230, 0, 122, 0.08)`,
        border: `1px solid ${POLKADOT_COLORS.storm200}`,
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.secondary} 50%, ${POLKADOT_COLORS.violet} 100%)`,
      }} />
      
      {children}
    </div>
  );
}; 