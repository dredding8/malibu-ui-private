import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

interface FeatureFlaggedRouteProps {
  flag: string;
  component: React.ComponentType<any>;
  fallback: React.ComponentType<any>;
}

export const FeatureFlaggedRoute: React.FC<FeatureFlaggedRouteProps> = ({
  flag,
  component: Component,
  fallback: Fallback
}) => {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return <Component />;
  }
  
  return <Fallback />;
};