import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onSearch?: () => void;
  onAddSCC?: () => void;
  onUpdateMaster?: () => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = ({
  onSearch,
  onAddSCC,
  onUpdateMaster,
  onEscape
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // ⌘K: Focus search
      if (event.metaKey && event.key === 'k') {
        event.preventDefault();
        onSearch?.();
      }

      // ⌘N: Add new SCC
      if (event.metaKey && event.key === 'n') {
        event.preventDefault();
        onAddSCC?.();
      }

      // ⌘R: Refresh data sources
      if (event.metaKey && event.key === 'r') {
        event.preventDefault();
        onUpdateMaster?.();
      }

      // Escape: Clear search
      if (event.key === 'Escape') {
        onEscape?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onAddSCC, onUpdateMaster, onEscape]);
};



