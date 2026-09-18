import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ children, className = '' }) => {
  return (
    <div className={`table-container ${className}`}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTable;
