import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  Button,
  Alignment,
  Tooltip,
  Hotkey,
  Hotkeys,
  HotkeysTarget2
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface AppNavbarProps {
  onHelpClick?: () => void;
  onLogoutClick?: () => void;
  showHelpButton?: boolean;
}

interface NavigationItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  testId: string;
  shortcut?: string[];
}

const AppNavbar: React.FC<AppNavbarProps> = ({ 
  onHelpClick, 
  onLogoutClick, 
  showHelpButton = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Standardized navigation items with consistent labels
  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Data Sources',
      icon: IconNames.DATABASE,
      path: '/',
      testId: 'nav-dashboard',
      shortcut: ['cmd', '1']
    },
    {
      key: 'sccs',
      label: 'SCCs',
      icon: IconNames.CUBE,
      path: '/sccs',
      testId: 'nav-sccs',
      shortcut: ['cmd', '2']
    },
    {
      key: 'collections',
      label: 'Collections',
      icon: IconNames.NEW_OBJECT,
      path: '/decks',
      testId: 'nav-collections',
      shortcut: ['cmd', '3']
    },
    {
      key: 'history',
      label: 'History',
      icon: IconNames.HISTORY,
      path: '/history',
      testId: 'nav-history',
      shortcut: ['cmd', '4']
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: IconNames.CHART,
      path: '/analytics',
      testId: 'nav-analytics',
      shortcut: ['cmd', '5']
    }
  ];

  const isActivePage = (itemPath: string): boolean => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      // Default logout behavior
      console.log('Logout clicked');
    }
  };

  const handleHelp = () => {
    if (onHelpClick) {
      onHelpClick();
    } else {
      // Default help behavior
      console.log('Help clicked');
    }
  };

  // Keyboard shortcuts
  const hotkeys = React.useMemo(
    () => [
      ...navigationItems
        .filter(item => item.shortcut)
        .map(item => ({
          combo: item.shortcut!.join('+'),
          label: `Navigate to ${item.label}`,
          global: true,
          onKeyDown: () => handleNavigation(item.path),
        })),
      {
        combo: 'cmd+k',
        label: 'Focus search',
        global: true,
        onKeyDown: () => {
          const searchInput = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
          searchInput?.focus();
        },
      },
      {
        combo: '?',
        label: 'Show keyboard shortcuts',
        global: true,
        onKeyDown: () => handleHelp(),
      },
    ],
    [navigationItems]
  );

  return (
    <HotkeysTarget2 hotkeys={hotkeys}>
      <Navbar className="bp6-dark">
      <NavbarGroup align={Alignment.START}>
        <NavbarHeading>
          <span className="bp6-icon bp6-icon-cube bp6-margin-right" />
          VUE Dashboard
        </NavbarHeading>
        <NavbarDivider />
        {navigationItems.map((item) => (
          <Button
            key={item.key}
            className="bp6-minimal"
            icon={item.icon as any}
            text={item.label}
            onClick={() => handleNavigation(item.path)}
            intent={isActivePage(item.path) ? 'primary' : undefined}
            data-testid={item.testId}
            title={item.shortcut ? `${item.label} (${item.shortcut.join('+')})` : item.label}
          />
        ))}
      </NavbarGroup>
      <NavbarGroup align={Alignment.END}>
        {showHelpButton && (
          <Tooltip content="Keyboard shortcuts help">
            <Button
              className="bp6-minimal"
              icon={IconNames.HELP}
              onClick={handleHelp}
              data-testid="help-button"
            />
          </Tooltip>
        )}
        <Button
          className="bp6-minimal"
          icon={IconNames.LOG_OUT}
          text="Logout"
          intent="danger"
          onClick={handleLogout}
          data-testid="nav-logout"
        />
      </NavbarGroup>
    </Navbar>
    </HotkeysTarget2>
  );
};

export default AppNavbar;