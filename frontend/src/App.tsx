import React, { useState } from 'react';
import './i18n';
import { ApiProvider } from './contexts/Api';
import { ValidatorsProvider } from './contexts/Validators/ValidatorEntries';
import { EraStakersProvider } from './contexts/EraStakers';
import { Validators } from './Validators';
import { Reports } from './pages/Reports';
import { Messages } from './pages/Messages';
import { NetworkSelector } from './components/NetworkSelector';

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

const Navigation = ({ activePage, setActivePage }: { activePage: string; setActivePage: (page: string) => void }) => {
  return (
    <nav style={{
      background: `linear-gradient(135deg, ${POLKADOT_COLORS.white} 0%, ${POLKADOT_COLORS.storm200} 100%)`,
      padding: '1.5rem 2rem',
      marginBottom: '2rem',
      borderRadius: '12px',
      boxShadow: `0 4px 20px rgba(230, 0, 122, 0.1)`,
      border: `1px solid ${POLKADOT_COLORS.storm200}`,
    }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <NetworkSelector />
        <h1 style={{ 
          margin: 0, 
          color: POLKADOT_COLORS.black, 
          fontSize: '1.75rem',
          fontWeight: '700',
          background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.violet} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Validator Dashboard
        </h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActivePage('validators')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              ...(activePage === 'validators' ? {
                background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.pinkLight} 100%)`,
                color: POLKADOT_COLORS.white,
                boxShadow: `0 4px 12px rgba(230, 0, 122, 0.3)`,
              } : {
                background: POLKADOT_COLORS.white,
                color: POLKADOT_COLORS.storm700,
                border: `1px solid ${POLKADOT_COLORS.storm400}`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.05)`,
              })
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'validators') {
                e.currentTarget.style.background = POLKADOT_COLORS.storm200;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'validators') {
                e.currentTarget.style.background = POLKADOT_COLORS.white;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Validators
          </button>
          <button
            onClick={() => setActivePage('reports')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              ...(activePage === 'reports' ? {
                background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.pinkLight} 100%)`,
                color: POLKADOT_COLORS.white,
                boxShadow: `0 4px 12px rgba(230, 0, 122, 0.3)`,
              } : {
                background: POLKADOT_COLORS.white,
                color: POLKADOT_COLORS.storm700,
                border: `1px solid ${POLKADOT_COLORS.storm400}`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.05)`,
              })
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'reports') {
                e.currentTarget.style.background = POLKADOT_COLORS.storm200;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'reports') {
                e.currentTarget.style.background = POLKADOT_COLORS.white;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Submit Report
          </button>
          <button
            onClick={() => setActivePage('messages')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              ...(activePage === 'messages' ? {
                background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.pinkLight} 100%)`,
                color: POLKADOT_COLORS.white,
                boxShadow: `0 4px 12px rgba(230, 0, 122, 0.3)`,
              } : {
                background: POLKADOT_COLORS.white,
                color: POLKADOT_COLORS.storm700,
                border: `1px solid ${POLKADOT_COLORS.storm400}`,
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.05)`,
              })
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'messages') {
                e.currentTarget.style.background = POLKADOT_COLORS.storm200;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'messages') {
                e.currentTarget.style.background = POLKADOT_COLORS.white;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            View Messages
          </button>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [activePage, setActivePage] = useState('validators');

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      background: `linear-gradient(135deg, ${POLKADOT_COLORS.storm200} 0%, ${POLKADOT_COLORS.white} 100%)`,
      minHeight: '100vh',
    }}>
      <ApiProvider>
        <Navigation activePage={activePage} setActivePage={setActivePage} />
        
        {activePage === 'validators' ? (
          <ValidatorsProvider>
            <EraStakersProvider>
              <Validators />
            </EraStakersProvider>
          </ValidatorsProvider>
        ) : activePage === 'reports' ? (
          <Reports />
        ) : activePage === 'messages' ? (
          <Messages />
        ) : (
          <ValidatorsProvider>
            <EraStakersProvider>
              <Validators />
            </EraStakersProvider>
          </ValidatorsProvider>
        )}
      </ApiProvider>
    </div>
  );
}

export default App; 