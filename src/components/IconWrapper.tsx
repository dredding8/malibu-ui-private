import React from 'react';

interface SimpleIconProps {
  icon?: string;
  size?: number;
  intent?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
  'data-testid'?: string;
  className?: string;
}

/**
 * Simple icon component using Blueprint icon classes directly.
 * This avoids the TypeScript JSX component issues with Blueprint's Icon component.
 */
const IconWrapper: React.FC<SimpleIconProps> = ({ 
  icon, 
  size = 16, 
  intent, 
  'data-testid': testId,
  className,
  ...props 
}) => {
  const sizeClass = size === 20 ? 'bp6-icon-large' : 'bp6-icon-standard';
  const intentClass = intent && intent !== 'none' ? `bp6-intent-${intent.toLowerCase()}` : '';
  const iconClass = icon || '';
  
  return (
    <span 
      className={`bp6-icon ${sizeClass} ${intentClass} ${iconClass} ${className || ''}`.trim()}
      data-testid={testId}
      {...props}
    />
  );
};

export default IconWrapper;