import React, { ReactNode } from 'react';

interface ListStatusHeaderProps {
  children: ReactNode;
}

export const ListStatusHeader: React.FC<ListStatusHeaderProps> = ({ children }) => {
  return (
    <div
      style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '1.1rem',
      }}
    >
      {children}
    </div>
  );
}; 