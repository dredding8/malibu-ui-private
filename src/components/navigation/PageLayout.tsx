import React from 'react';
import { Colors } from '@blueprintjs/core';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  maxWidth?: string;
  padding?: string;
}

/**
 * Consistent page layout wrapper for all pages
 * Provides standard padding, max-width, and background color
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className,
  backgroundColor = Colors.LIGHT_GRAY5,
  maxWidth = '1400px',
  padding = '24px'
}) => {
  return (
    <div 
      className={className}
      style={{
        backgroundColor,
        minHeight: 'calc(100vh - 50px)', // Account for navbar
        padding: 0
      }}
    >
      <div style={{
        maxWidth,
        margin: '0 auto',
        padding
      }}>
        {children}
      </div>
    </div>
  );
};