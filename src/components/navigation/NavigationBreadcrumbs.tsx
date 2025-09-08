import React from 'react';
import { Breadcrumbs, BreadcrumbProps } from '@blueprintjs/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationContext } from '../../types/navigation';

interface NavigationBreadcrumbsProps {
  items?: NavigationContext.BreadcrumbItem[];
  className?: string;
  large?: boolean;
}

/**
 * Context-aware breadcrumb navigation component
 * Uses Blueprint.js native Breadcrumbs with enhanced navigation support
 */
export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({ 
  items = [], 
  className,
  large = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Convert our breadcrumb items to Blueprint format
  const breadcrumbItems: BreadcrumbProps[] = items.map((item, index) => ({
    text: (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {item.icon && <span className="bp5-icon" data-icon={item.icon} style={{ fontSize: large ? 16 : 14 }} />}
        {item.text}
      </span>
    ),
    current: item.current || index === items.length - 1,
    onClick: item.onClick || (item.href ? () => {
      // Preserve state when navigating
      navigate(item.href!, { state: { ...location.state, fromBreadcrumb: true } });
    } : undefined),
    href: undefined // We handle navigation manually to work with React Router
  }));

  return (
    <Breadcrumbs 
      items={breadcrumbItems}
      className={className}
    />
  );
};