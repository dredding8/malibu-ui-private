import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHotkeys } from '@blueprintjs/core';
import { NAVIGATION_ROUTES } from '../constants/navigation';

/**
 * Keyboard Navigation Provider
 * Implements enterprise-standard keyboard shortcuts for navigation
 * Following Blueprint.js hotkey patterns and accessibility standards
 */

interface KeyboardShortcut {
  combo: string;
  label: string;
  action: () => void;
  global?: boolean;
  group?: string;
  allowInInput?: boolean;
}

export const KeyboardNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation shortcuts
  const navigateToRoute = useCallback((route: string) => {
    if (location.pathname !== route) {
      navigate(route);
    }
  }, [navigate, location.pathname]);

  // Focus management
  const focusElement = useCallback((selector: string) => {
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      element?.focus();
    }, 100);
  }, []);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = React.useMemo(() => [
    // Main navigation
    {
      combo: 'cmd+1',
      label: 'Go to Data Sources',
      action: () => navigateToRoute(NAVIGATION_ROUTES.DASHBOARD),
      global: true,
      group: 'Navigation'
    },
    {
      combo: 'cmd+2',
      label: 'Go to SCCs',
      action: () => navigateToRoute(NAVIGATION_ROUTES.SCCS),
      global: true,
      group: 'Navigation'
    },
    {
      combo: 'cmd+3',
      label: 'Go to Collections',
      action: () => navigateToRoute(NAVIGATION_ROUTES.COLLECTIONS),
      global: true,
      group: 'Navigation'
    },
    {
      combo: 'cmd+4',
      label: 'Go to History',
      action: () => navigateToRoute(NAVIGATION_ROUTES.HISTORY),
      global: true,
      group: 'Navigation'
    },
    {
      combo: 'cmd+5',
      label: 'Go to Analytics',
      action: () => navigateToRoute(NAVIGATION_ROUTES.ANALYTICS),
      global: true,
      group: 'Navigation'
    },
    
    // Quick actions
    {
      combo: 'cmd+n',
      label: 'Create new collection',
      action: () => navigate(NAVIGATION_ROUTES.CREATE_COLLECTION_DECK),
      global: true,
      group: 'Actions'
    },
    {
      combo: 'cmd+f',
      label: 'Focus search',
      action: () => focusElement('[data-testid="collection-search-input"], [aria-label*="Search"], input[type="search"]'),
      global: true,
      group: 'Actions',
      allowInInput: false
    },
    
    // Table navigation (when in table view)
    {
      combo: 'j',
      label: 'Next row',
      action: () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        document.activeElement?.dispatchEvent(event);
      },
      group: 'Table Navigation',
      allowInInput: false
    },
    {
      combo: 'k',
      label: 'Previous row',
      action: () => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        document.activeElement?.dispatchEvent(event);
      },
      group: 'Table Navigation',
      allowInInput: false
    },
    
    // Modal and dialog management
    {
      combo: 'escape',
      label: 'Close dialog/Clear selection',
      action: () => {
        // Check for open dialogs first
        const dialog = document.querySelector('.bp5-dialog, .bp5-drawer');
        if (dialog) {
          const closeButton = dialog.querySelector('[aria-label*="Close"], .bp5-dialog-close-button') as HTMLElement;
          closeButton?.click();
        } else {
          // Clear selections if no dialog
          const clearButton = document.querySelector('[aria-label*="Clear"], button:has-text("Clear")') as HTMLElement;
          clearButton?.click();
        }
      },
      global: true,
      group: 'General'
    },
    
    // Help
    {
      combo: '?',
      label: 'Show keyboard shortcuts',
      action: () => {
        // Trigger help dialog
        const helpButton = document.querySelector('[data-testid="help-button"]') as HTMLElement;
        helpButton?.click();
      },
      global: true,
      group: 'Help',
      allowInInput: false
    }
  ], [navigateToRoute, navigate, focusElement]);

  // Register hotkeys
  const hotkeys = useHotkeys(
    React.useMemo(() => shortcuts.map(shortcut => ({
      combo: shortcut.combo,
      label: shortcut.label,
      global: shortcut.global ?? false,
      onKeyDown: shortcut.action,
      allowInInput: shortcut.allowInInput ?? true,
      preventDefault: true,
      stopPropagation: false
    })), [shortcuts])
  );

  // Accessibility announcements
  const announceNavigation = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Announce page changes
  useEffect(() => {
    const pageName = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
    announceNavigation(`Navigated to ${pageName}`);
  }, [location.pathname]); // Remove announceNavigation from dependencies

  // Export shortcuts for help dialog
  useEffect(() => {
    (window as any).__keyboardShortcuts = shortcuts.reduce((acc, shortcut) => {
      const group = shortcut.group || 'General';
      if (!acc[group]) acc[group] = [];
      acc[group].push({
        combo: shortcut.combo,
        label: shortcut.label
      });
      return acc;
    }, {} as Record<string, Array<{ combo: string; label: string }>>);
  }, []); // Remove shortcuts from dependencies - it's recreated every render

  return <>{children}</>;
};

/**
 * Hook to get keyboard shortcuts for display in help dialog
 */
export const useKeyboardShortcuts = () => {
  return (window as any).__keyboardShortcuts || {};
};