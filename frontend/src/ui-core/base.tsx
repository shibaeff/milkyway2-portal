import React, { ReactNode } from 'react';

// Page components
interface PageProps {
  children: ReactNode;
}

export const Page: {
  Row: React.FC<PageProps>;
  Title: React.FC<{ title: string; children?: ReactNode }>;
} = {
  Row: ({ children }) => (
    <div style={{ marginBottom: '2rem' }}>
      {children}
    </div>
  ),
  Title: ({ title, children }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid #dee2e6'
    }}>
      <h1 style={{ margin: 0, color: '#333', fontSize: '2rem' }}>{title}</h1>
      {children}
    </div>
  ),
};

// Stat components
interface StatRowProps {
  children: ReactNode;
}

export const Stat: {
  Row: React.FC<StatRowProps>;
} = {
  Row: ({ children }) => (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      marginBottom: '2rem',
      flexWrap: 'wrap'
    }}>
      {children}
    </div>
  ),
}; 