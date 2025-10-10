import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: () => void;
}

/**
 * Hook for managing keyboard navigation and shortcuts
 * Ensures accessibility and provides consistent keyboard interaction
 */
export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !shortcut.ctrl || event.ctrlKey || event.metaKey;
      const shiftMatch = !shortcut.shift || event.shiftKey;
      const altMatch = !shortcut.alt || event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.handler();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return helper functions
  return {
    navigateToFirstItem: () => {
      const firstFocusable = document.querySelector<HTMLElement>(
        '[tabindex="0"], button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
      );
      firstFocusable?.focus();
    },
    navigateToLastItem: () => {
      const allFocusable = document.querySelectorAll<HTMLElement>(
        '[tabindex="0"], button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
      );
      const lastFocusable = allFocusable[allFocusable.length - 1];
      lastFocusable?.focus();
    },
    showShortcutsHelp: () => {
      const helpText = shortcuts
        .map(s => {
          const keys = [
            s.ctrl && 'Ctrl',
            s.shift && 'Shift',
            s.alt && 'Alt',
            s.key.toUpperCase()
          ].filter(Boolean).join('+');
          return `${keys}: ${s.description}`;
        })
        .join('\n');
      
      alert(`Keyboard Shortcuts:\n\n${helpText}`);
    }
  };
}

// Common keyboard shortcuts for collection opportunities
export const collectionOpportunitiesShortcuts: KeyboardShortcut[] = [
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    handler: () => { /* Handled by component */ }
  },
  {
    key: '/',
    description: 'Focus search',
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"]');
      searchInput?.focus();
    }
  },
  {
    key: 'g',
    description: 'Go to opportunities tab',
    handler: () => {
      const tab = document.querySelector<HTMLElement>('[data-tab-id="opportunities"]');
      tab?.click();
    }
  },
  {
    key: 'a',
    description: 'Go to analytics tab',
    handler: () => {
      const tab = document.querySelector<HTMLElement>('[data-tab-id="analytics"]');
      tab?.click();
    }
  },
  {
    key: 's',
    description: 'Go to settings tab',
    handler: () => {
      const tab = document.querySelector<HTMLElement>('[data-tab-id="settings"]');
      tab?.click();
    }
  },
  {
    key: 'Escape',
    description: 'Close modal or cancel operation',
    handler: () => {
      const closeButton = document.querySelector<HTMLElement>('.bp5-dialog-close-button, [aria-label="Close"]');
      closeButton?.click();
    }
  },
  {
    key: 'Enter',
    ctrl: true,
    description: 'Save changes',
    handler: () => {
      const saveButton = document.querySelector<HTMLElement>('button[type="submit"], button:has-text("Save")');
      saveButton?.click();
    }
  }
];

// Table navigation helpers
export function useTableKeyboardNavigation(tableRef: React.RefObject<HTMLTableElement>) {
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const handleTableKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('td, th')) return;

      const cell = target.closest('td, th') as HTMLTableCellElement;
      const row = cell.parentElement as HTMLTableRowElement;
      const cellIndex = Array.from(row.cells).indexOf(cell);
      const rowIndex = Array.from(table.rows).indexOf(row);

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          const prevRow = table.rows[rowIndex - 1];
          if (prevRow && prevRow.cells[cellIndex]) {
            const focusable = prevRow.cells[cellIndex].querySelector<HTMLElement>('[tabindex="0"], button, a');
            (focusable || prevRow.cells[cellIndex]).focus();
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          const nextRow = table.rows[rowIndex + 1];
          if (nextRow && nextRow.cells[cellIndex]) {
            const focusable = nextRow.cells[cellIndex].querySelector<HTMLElement>('[tabindex="0"], button, a');
            (focusable || nextRow.cells[cellIndex]).focus();
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          const prevCell = row.cells[cellIndex - 1];
          if (prevCell) {
            const focusable = prevCell.querySelector<HTMLElement>('[tabindex="0"], button, a');
            (focusable || prevCell).focus();
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          const nextCell = row.cells[cellIndex + 1];
          if (nextCell) {
            const focusable = nextCell.querySelector<HTMLElement>('[tabindex="0"], button, a');
            (focusable || nextCell).focus();
          }
          break;

        case 'Home':
          if (event.ctrlKey) {
            event.preventDefault();
            const firstCell = table.rows[1]?.cells[0]; // Skip header
            if (firstCell) {
              const focusable = firstCell.querySelector<HTMLElement>('[tabindex="0"], button, a');
              (focusable || firstCell).focus();
            }
          }
          break;

        case 'End':
          if (event.ctrlKey) {
            event.preventDefault();
            const lastRow = table.rows[table.rows.length - 1];
            const lastCell = lastRow?.cells[lastRow.cells.length - 1];
            if (lastCell) {
              const focusable = lastCell.querySelector<HTMLElement>('[tabindex="0"], button, a');
              (focusable || lastCell).focus();
            }
          }
          break;
      }
    };

    table.addEventListener('keydown', handleTableKeyDown);
    return () => table.removeEventListener('keydown', handleTableKeyDown);
  }, [tableRef]);
}