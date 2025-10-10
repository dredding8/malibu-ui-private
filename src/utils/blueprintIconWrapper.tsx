import React from 'react';
import { Icon as BpIcon, IconProps } from '@blueprintjs/core';

/**
 * Type-safe Icon wrapper to handle Blueprint.js v6 types
 * This wrapper ensures the Icon component returns a valid JSX.Element
 */
export const Icon: React.FC<IconProps> = (props) => {
  // Blueprint v6 Icon returns ReactNode, wrap it in a span to ensure JSX.Element
  // Use React.createElement to properly create the Icon element
  const iconElement = React.createElement(BpIcon, props);
  
  // Handle case where Icon might return null or undefined
  if (!iconElement) {
    return null;
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {iconElement}
    </span>
  );
};