import React, { useEffect, useRef } from 'react';
import { HotkeysTarget2, HotkeyConfig } from '@blueprintjs/core';

interface KeyboardNavigationWrapperProps {
  children: React.ReactNode;
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  className?: string;
  tabIndex?: number;
}

/**
 * Wrapper component that provides keyboard navigation support
 * for tables, lists, and other navigable components
 */
export const KeyboardNavigationWrapper: React.FC<KeyboardNavigationWrapperProps> = ({
  children,
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  className,
  tabIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        containerRef.current.setAttribute('data-keyboard-active', 'true');
      }
    };

    const handleBlur = (e: FocusEvent) => {
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        containerRef.current?.setAttribute('data-keyboard-active', 'false');
      }
    };

    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  const hotkeys: HotkeyConfig[] = React.useMemo(() => {
    const keys: HotkeyConfig[] = [];

    if (onEnter) {
      keys.push({
        combo: 'enter',
        label: 'Select/Activate',
        onKeyDown: onEnter,
      });
    }

    if (onEscape) {
      keys.push({
        combo: 'escape',
        label: 'Cancel/Close',
        onKeyDown: onEscape,
      });
    }

    if (onArrowUp) {
      keys.push({
        combo: 'up',
        label: 'Navigate up',
        onKeyDown: onArrowUp,
        preventDefault: true,
      });
    }

    if (onArrowDown) {
      keys.push({
        combo: 'down',
        label: 'Navigate down',
        onKeyDown: onArrowDown,
        preventDefault: true,
      });
    }

    if (onArrowLeft) {
      keys.push({
        combo: 'left',
        label: 'Navigate left',
        onKeyDown: onArrowLeft,
        preventDefault: true,
      });
    }

    if (onArrowRight) {
      keys.push({
        combo: 'right',
        label: 'Navigate right',
        onKeyDown: onArrowRight,
        preventDefault: true,
      });
    }

    if (onTab) {
      keys.push({
        combo: 'tab',
        label: 'Next field',
        onKeyDown: onTab,
      });
    }

    return keys;
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]);

  return (
    <HotkeysTarget2 hotkeys={hotkeys}>
      <div
        ref={containerRef}
        className={className}
        tabIndex={tabIndex}
        role="region"
        aria-label="Keyboard navigable area"
        style={{
          outline: 'none',
        }}
      >
        {children}
      </div>
    </HotkeysTarget2>
  );
};

/**
 * Hook for managing keyboard navigation state in tables
 */
export function useTableKeyboardNavigation(totalRows: number, totalColumns: number) {
  const [selectedRow, setSelectedRow] = React.useState(-1);
  const [selectedCol, setSelectedCol] = React.useState(-1);

  const handleArrowUp = React.useCallback(() => {
    setSelectedRow(prev => Math.max(0, prev - 1));
  }, []);

  const handleArrowDown = React.useCallback(() => {
    setSelectedRow(prev => Math.min(totalRows - 1, prev + 1));
  }, []);

  const handleArrowLeft = React.useCallback(() => {
    setSelectedCol(prev => Math.max(0, prev - 1));
  }, []);

  const handleArrowRight = React.useCallback(() => {
    setSelectedCol(prev => Math.min(totalColumns - 1, prev + 1));
  }, []);

  const handleEscape = React.useCallback(() => {
    setSelectedRow(-1);
    setSelectedCol(-1);
  }, []);

  return {
    selectedRow,
    selectedCol,
    handleArrowUp,
    handleArrowDown,
    handleArrowLeft,
    handleArrowRight,
    handleEscape,
    setSelectedRow,
    setSelectedCol,
  };
}