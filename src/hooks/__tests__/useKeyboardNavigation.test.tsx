import React, { useRef } from 'react';
import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { 
  useKeyboardNavigation, 
  useTableKeyboardNavigation,
  collectionOpportunitiesShortcuts
} from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let mockAlert: jest.SpyInstance;

  beforeEach(() => {
    mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    mockAlert.mockRestore();
  });

  describe('Basic functionality', () => {
    it('should handle keyboard shortcuts', () => {
      const handler = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          description: 'Test shortcut',
          handler
        }
      ];

      renderHook(() => useKeyboardNavigation(shortcuts));

      act(() => {
        fireEvent.keyDown(document, { key: 'a' });
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle shortcuts with modifiers', () => {
      const handler = jest.fn();
      const shortcuts = [
        {
          key: 's',
          ctrl: true,
          description: 'Save',
          handler
        }
      ];

      renderHook(() => useKeyboardNavigation(shortcuts));

      // Without Ctrl - should not trigger
      act(() => {
        fireEvent.keyDown(document, { key: 's' });
      });
      expect(handler).not.toHaveBeenCalled();

      // With Ctrl - should trigger
      act(() => {
        fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      });
      expect(handler).toHaveBeenCalled();
    });

    it('should handle multiple modifiers', () => {
      const handler = jest.fn();
      const shortcuts = [
        {
          key: 'k',
          ctrl: true,
          shift: true,
          alt: true,
          description: 'Complex shortcut',
          handler
        }
      ];

      renderHook(() => useKeyboardNavigation(shortcuts));

      act(() => {
        fireEvent.keyDown(document, { 
          key: 'k', 
          ctrlKey: true, 
          shiftKey: true, 
          altKey: true 
        });
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should not trigger shortcuts when typing in inputs', () => {
      const handler = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          description: 'Test shortcut',
          handler
        }
      ];

      const TestComponent = () => {
        useKeyboardNavigation(shortcuts);
        return (
          <>
            <input data-testid="input" />
            <textarea data-testid="textarea" />
            <div contentEditable data-testid="contenteditable">Editable</div>
          </>
        );
      };

      render(<TestComponent />);

      // Should not trigger in input
      const input = screen.getByTestId('input');
      input.focus();
      fireEvent.keyDown(input, { key: 'a' });
      expect(handler).not.toHaveBeenCalled();

      // Should not trigger in textarea
      const textarea = screen.getByTestId('textarea');
      textarea.focus();
      fireEvent.keyDown(textarea, { key: 'a' });
      expect(handler).not.toHaveBeenCalled();

      // Should not trigger in contentEditable
      const contentEditable = screen.getByTestId('contenteditable');
      contentEditable.focus();
      fireEvent.keyDown(contentEditable, { key: 'a' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Helper functions', () => {
    it('should navigate to first focusable item', () => {
      const TestComponent = () => {
        const { navigateToFirstItem } = useKeyboardNavigation([]);
        return (
          <>
            <button onClick={navigateToFirstItem}>Navigate First</button>
            <button data-testid="first">First</button>
            <button data-testid="second">Second</button>
          </>
        );
      };

      render(<TestComponent />);

      const firstButton = screen.getByTestId('first');
      const triggerButton = screen.getByText('Navigate First');

      act(() => {
        fireEvent.click(triggerButton);
      });

      expect(document.activeElement).toBe(triggerButton); // The trigger button itself is first focusable
    });

    it('should navigate to last focusable item', () => {
      const TestComponent = () => {
        const { navigateToLastItem } = useKeyboardNavigation([]);
        return (
          <>
            <button onClick={navigateToLastItem}>Navigate Last</button>
            <button data-testid="first">First</button>
            <button data-testid="last">Last</button>
          </>
        );
      };

      render(<TestComponent />);

      const lastButton = screen.getByTestId('last');
      const triggerButton = screen.getByText('Navigate Last');

      act(() => {
        fireEvent.click(triggerButton);
      });

      expect(document.activeElement).toBe(lastButton);
    });

    it('should show shortcuts help', () => {
      const shortcuts = [
        { key: 's', ctrl: true, description: 'Save' },
        { key: 'o', ctrl: true, description: 'Open' },
        { key: '?', description: 'Help' }
      ];

      const { result } = renderHook(() => useKeyboardNavigation(shortcuts));

      act(() => {
        result.current.showShortcutsHelp();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Keyboard Shortcuts:')
      );
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Ctrl+S: Save')
      );
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Ctrl+O: Open')
      );
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('?: Help')
      );
    });
  });

  describe('collectionOpportunitiesShortcuts', () => {
    it('should focus search input on / key', () => {
      const TestComponent = () => {
        useKeyboardNavigation(collectionOpportunitiesShortcuts);
        return (
          <>
            <input type="search" data-testid="search" />
            <div>Other content</div>
          </>
        );
      };

      render(<TestComponent />);
      const searchInput = screen.getByTestId('search');

      act(() => {
        fireEvent.keyDown(document, { key: '/' });
      });

      expect(document.activeElement).toBe(searchInput);
    });

    it('should navigate to tabs with shortcuts', () => {
      const clickHandler = jest.fn();
      
      const TestComponent = () => {
        useKeyboardNavigation(collectionOpportunitiesShortcuts);
        return (
          <>
            <button data-tab-id="opportunities" onClick={clickHandler}>
              Opportunities Tab
            </button>
            <button data-tab-id="analytics" onClick={clickHandler}>
              Analytics Tab
            </button>
            <button data-tab-id="settings" onClick={clickHandler}>
              Settings Tab
            </button>
          </>
        );
      };

      render(<TestComponent />);

      // Test 'g' for opportunities
      act(() => {
        fireEvent.keyDown(document, { key: 'g' });
      });
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Test 'a' for analytics
      act(() => {
        fireEvent.keyDown(document, { key: 'a' });
      });
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // Test 's' for settings
      act(() => {
        fireEvent.keyDown(document, { key: 's' });
      });
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should close modal on Escape', () => {
      const clickHandler = jest.fn();
      
      const TestComponent = () => {
        useKeyboardNavigation(collectionOpportunitiesShortcuts);
        return (
          <button className="bp5-dialog-close-button" onClick={clickHandler}>
            Close
          </button>
        );
      };

      render(<TestComponent />);

      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      expect(clickHandler).toHaveBeenCalled();
    });

    it('should save on Ctrl+Enter', () => {
      const submitHandler = jest.fn();
      
      const TestComponent = () => {
        useKeyboardNavigation(collectionOpportunitiesShortcuts);
        return (
          <button type="submit" onClick={submitHandler}>
            Save
          </button>
        );
      };

      render(<TestComponent />);

      act(() => {
        fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
      });

      expect(submitHandler).toHaveBeenCalled();
    });
  });
});

describe('useTableKeyboardNavigation', () => {
  const createTestTable = () => (
    <table>
      <thead>
        <tr>
          <th tabIndex={0}>Header 1</th>
          <th tabIndex={0}>Header 2</th>
          <th tabIndex={0}>Header 3</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td tabIndex={0}>Cell 1-1</td>
          <td tabIndex={0}>Cell 1-2</td>
          <td tabIndex={0}>Cell 1-3</td>
        </tr>
        <tr>
          <td tabIndex={0}>Cell 2-1</td>
          <td tabIndex={0}>Cell 2-2</td>
          <td tabIndex={0}>Cell 2-3</td>
        </tr>
        <tr>
          <td tabIndex={0}>Cell 3-1</td>
          <td tabIndex={0}>Cell 3-2</td>
          <td tabIndex={0}>Cell 3-3</td>
        </tr>
      </tbody>
    </table>
  );

  it('should navigate with arrow keys', () => {
    const TestComponent = () => {
      const tableRef = useRef<HTMLTableElement>(null);
      useTableKeyboardNavigation(tableRef);
      return <div ref={tableRef as any}>{createTestTable()}</div>;
    };

    render(<TestComponent />);

    const cell11 = screen.getByText('Cell 1-1');
    const cell12 = screen.getByText('Cell 1-2');
    const cell21 = screen.getByText('Cell 2-1');

    // Focus initial cell
    cell11.focus();
    expect(document.activeElement).toBe(cell11);

    // Arrow right
    fireEvent.keyDown(cell11, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cell12);

    // Arrow down
    fireEvent.keyDown(cell12, { key: 'ArrowDown' });
    expect(document.activeElement?.textContent).toBe('Cell 2-2');

    // Arrow left
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cell21);

    // Arrow up
    fireEvent.keyDown(cell21, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(cell11);
  });

  it('should handle Home and End keys with Ctrl', () => {
    const TestComponent = () => {
      const tableRef = useRef<HTMLTableElement>(null);
      useTableKeyboardNavigation(tableRef);
      return <div ref={tableRef as any}>{createTestTable()}</div>;
    };

    render(<TestComponent />);

    const cell22 = screen.getByText('Cell 2-2');
    cell22.focus();

    // Ctrl+Home - go to first data cell
    fireEvent.keyDown(cell22, { key: 'Home', ctrlKey: true });
    expect(document.activeElement?.textContent).toBe('Cell 1-1');

    // Ctrl+End - go to last cell
    fireEvent.keyDown(document.activeElement!, { key: 'End', ctrlKey: true });
    expect(document.activeElement?.textContent).toBe('Cell 3-3');
  });

  it('should handle edge cases', () => {
    const TestComponent = () => {
      const tableRef = useRef<HTMLTableElement>(null);
      useTableKeyboardNavigation(tableRef);
      return <div ref={tableRef as any}>{createTestTable()}</div>;
    };

    render(<TestComponent />);

    const header1 = screen.getByText('Header 1');
    const cell33 = screen.getByText('Cell 3-3');

    // Try to go up from header row (should not move)
    header1.focus();
    fireEvent.keyDown(header1, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(header1);

    // Try to go down from last row (should not move)
    cell33.focus();
    fireEvent.keyDown(cell33, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cell33);

    // Try to go right from last column (should not move)
    fireEvent.keyDown(cell33, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cell33);
  });
});