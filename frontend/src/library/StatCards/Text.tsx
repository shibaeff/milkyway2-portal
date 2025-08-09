import React from 'react';

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

interface TextProps {
  label: string;
  value: string;
  helpKey: string;
}

export const Text: React.FC<TextProps> = ({ label, value, helpKey }) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${POLKADOT_COLORS.white} 0%, ${POLKADOT_COLORS.storm200} 100%)`,
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: `0 8px 32px rgba(230, 0, 122, 0.08)`,
        border: `1px solid ${POLKADOT_COLORS.storm200}`,
        flex: 1,
        minWidth: '200px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(230, 0, 122, 0.15)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(230, 0, 122, 0.08)`;
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
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          color: POLKADOT_COLORS.storm700, 
          fontSize: '0.875rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {label}
        </h3>
      </div>
      
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: '700', 
        color: POLKADOT_COLORS.black,
        background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.violet} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {value}
      </div>
    </div>
  );
}; 