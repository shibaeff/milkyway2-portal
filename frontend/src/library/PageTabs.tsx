import React from 'react';

interface Tab {
  title: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

interface PageTabsProps {
  tabs: Tab[];
}

export const PageTabs: React.FC<PageTabsProps> = ({ tabs }) => {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={tab.onClick}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            background: tab.active ? '#007bff' : '#f8f9fa',
            color: tab.active ? 'white' : '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {tab.title}
          {tab.badge && (
            <span
              style={{
                background: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
              }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}; 