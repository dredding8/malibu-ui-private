import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Spinner, Intent, Classes } from '@blueprintjs/core';
import './NavigationTransition.css';

interface NavigationTransitionProps {
  children: React.ReactNode;
  loading?: boolean;
}

/**
 * Component that provides smooth transitions between pages
 * with loading states and fade animations
 */
export const NavigationTransition: React.FC<NavigationTransitionProps> = ({ 
  children, 
  loading = false 
}) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    
    // Small delay to ensure smooth transition
    const transitionTimer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(transitionTimer);
  }, [location.pathname, children]);

  return (
    <div className="navigation-transition-wrapper">
      {(loading || isTransitioning) && (
        <div className="navigation-loading-overlay">
          <div className="navigation-loading-content">
            <Spinner 
              intent={Intent.PRIMARY} 
              size={40}
              className={Classes.SPINNER}
            />
            <p className="navigation-loading-text">Loading...</p>
          </div>
        </div>
      )}
      <div 
        className={`navigation-content ${isTransitioning ? 'transitioning' : ''}`}
        style={{
          opacity: isTransitioning ? 0.7 : 1,
          transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
};

/**
 * Hook for managing loading states during navigation
 */
export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);

    // End loading after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  return {
    isLoading,
    setIsLoading,
  };
}

/**
 * Component for inline loading states
 */
export const InlineLoadingState: React.FC<{ 
  loading: boolean;
  text?: string;
}> = ({ loading, text = 'Loading...' }) => {
  if (!loading) return null;

  return (
    <div className="inline-loading-state">
      <Spinner size={16} />
      <span className="loading-text">{text}</span>
    </div>
  );
};