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

interface PieProps {
  label: string;
  stat: {
    value: number;
    total: number;
    unit: string;
  };
  pieValue: number;
  tooltip: string;
  helpKey: string;
}

export const Pie: React.FC<PieProps> = ({ label, stat, pieValue, tooltip, helpKey }) => {
  const percentage = stat.total > 0 ? (stat.value / stat.total) * 100 : 0;
  
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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: `conic-gradient(${POLKADOT_COLORS.primary} ${pieValue}%, ${POLKADOT_COLORS.storm200} ${pieValue}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `0 4px 16px rgba(230, 0, 122, 0.2)`,
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: POLKADOT_COLORS.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: POLKADOT_COLORS.primary,
            }}
          >
            {pieValue.toFixed(0)}%
          </div>
        </div>
        
        <div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: POLKADOT_COLORS.black,
            marginBottom: '0.25rem',
          }}>
            {stat.value.toLocaleString()}
            {stat.unit && <span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: POLKADOT_COLORS.storm700 }}>{stat.unit}</span>}
          </div>
          <div style={{ fontSize: '0.875rem', color: POLKADOT_COLORS.storm700, marginBottom: '0.25rem' }}>
            of {stat.total.toLocaleString()}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: POLKADOT_COLORS.primary, 
            fontWeight: '600',
            background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.violet} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {percentage.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '1rem', 
        fontSize: '0.75rem', 
        color: POLKADOT_COLORS.storm700,
        fontStyle: 'italic',
        lineHeight: '1.4',
      }}>
        {tooltip}
      </div>
    </div>
  );
}; 