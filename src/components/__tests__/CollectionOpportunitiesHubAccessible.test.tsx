import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SkipToMain,
  LiveRegion,
  Announcement,
  TableCaption,
  KeyboardInstructions,
  VisuallyHidden,
  FocusTrap,
  useFocusManagement,
  useAnnouncement,
  a11y
} from '../CollectionOpportunitiesHubAccessible';

describe('Accessibility Components', () => {
  describe('SkipToMain', () => {
    it('should render skip link with proper attributes', () => {
      render(<SkipToMain />);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveClass('skip-to-main');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should be accessible via keyboard', async () => {
      const user = userEvent.setup();
      render(<SkipToMain />);
      
      const skipLink = screen.getByText('Skip to main content');
      
      // Tab to the link
      await user.tab();
      expect(document.activeElement).toBe(skipLink);
    });
  });

  describe('LiveRegion', () => {
    it('should render with default aria-live polite', () => {
      render(
        <LiveRegion>
          <div>Test announcement</div>
        </LiveRegion>
      );
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveTextContent('Test announcement');
    });

    it('should render with assertive aria-live when specified', () => {
      render(
        <LiveRegion assertive>
          <div>Urgent announcement</div>
        </LiveRegion>
      );
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have screen reader only styles', () => {
      render(
        <LiveRegion>
          <div>Hidden announcement</div>
        </LiveRegion>
      );
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveClass('sr-only');
    });
  });

  describe('Announcement', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should announce message and clear after timeout', async () => {
      const { rerender } = render(<Announcement message="Test announcement" />);
      
      expect(screen.getByText('Test announcement')).toBeInTheDocument();
      
      // Fast forward time
      jest.advanceTimersByTime(3000);
      
      // Update with empty message to simulate clearing
      rerender(<Announcement message="" />);
      
      expect(screen.queryByText('Test announcement')).not.toBeInTheDocument();
    });

    it('should use custom timeout', () => {
      const onClear = jest.fn();
      render(
        <Announcement 
          message="Quick announcement" 
          timeout={1000}
          onClear={onClear}
        />
      );
      
      expect(screen.getByText('Quick announcement')).toBeInTheDocument();
      
      jest.advanceTimersByTime(1000);
      
      expect(onClear).toHaveBeenCalled();
    });

    it('should be assertive when priority is high', () => {
      render(
        <Announcement 
          message="Urgent message" 
          priority="high"
        />
      );
      
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('TableCaption', () => {
    it('should render caption with screen reader text', () => {
      render(
        <table>
          <TableCaption
            visible="Opportunities"
            srOnly="List of collection opportunities with details"
          />
          <tbody>
            <tr><td>Data</td></tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('List of collection opportunities with details')).toHaveClass('sr-only');
    });

    it('should render only screen reader text when no visible text', () => {
      render(
        <table>
          <TableCaption
            srOnly="Detailed opportunity information"
          />
          <tbody>
            <tr><td>Data</td></tr>
          </tbody>
        </table>
      );
      
      const caption = screen.getByText('Detailed opportunity information');
      expect(caption.parentElement).toBeInstanceOf(HTMLTableCaptionElement);
      expect(caption).toHaveClass('sr-only');
    });
  });

  describe('KeyboardInstructions', () => {
    it('should render keyboard instructions button', () => {
      render(<KeyboardInstructions />);
      
      const button = screen.getByLabelText('Show keyboard shortcuts');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('keyboard-help-trigger');
    });

    it('should open dialog on click', async () => {
      const user = userEvent.setup();
      render(<KeyboardInstructions />);
      
      const button = screen.getByLabelText('Show keyboard shortcuts');
      await user.click(button);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should display shortcuts in dialog', async () => {
      const user = userEvent.setup();
      render(<KeyboardInstructions />);
      
      await user.click(screen.getByLabelText('Show keyboard shortcuts'));
      
      // Check for some expected shortcuts
      expect(screen.getByText('/: Focus search')).toBeInTheDocument();
      expect(screen.getByText('?: Show this help')).toBeInTheDocument();
      expect(screen.getByText('Escape: Close dialogs')).toBeInTheDocument();
    });

    it('should close dialog on close button click', async () => {
      const user = userEvent.setup();
      render(<KeyboardInstructions />);
      
      await user.click(screen.getByLabelText('Show keyboard shortcuts'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.click(screen.getByLabelText('Close'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should trap focus in dialog', async () => {
      const user = userEvent.setup();
      render(<KeyboardInstructions />);
      
      await user.click(screen.getByLabelText('Show keyboard shortcuts'));
      
      const dialog = screen.getByRole('dialog');
      const closeButton = screen.getByLabelText('Close');
      
      // Focus should be on close button initially
      expect(document.activeElement).toBe(closeButton);
      
      // Tab should stay within dialog
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  describe('VisuallyHidden', () => {
    it('should hide content visually but keep it for screen readers', () => {
      render(
        <VisuallyHidden>
          <span>Hidden text</span>
        </VisuallyHidden>
      );
      
      const hiddenElement = screen.getByText('Hidden text').parentElement;
      expect(hiddenElement).toHaveClass('sr-only');
    });
  });

  describe('FocusTrap', () => {
    it('should trap focus within container', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Outside button</button>
          <FocusTrap active>
            <div>
              <button>First trapped button</button>
              <button>Second trapped button</button>
              <button>Third trapped button</button>
            </div>
          </FocusTrap>
        </div>
      );
      
      const firstButton = screen.getByText('First trapped button');
      const secondButton = screen.getByText('Second trapped button');
      const thirdButton = screen.getByText('Third trapped button');
      
      // Focus first button
      firstButton.focus();
      
      // Tab through elements
      await user.tab();
      expect(document.activeElement).toBe(secondButton);
      
      await user.tab();
      expect(document.activeElement).toBe(thirdButton);
      
      // Should wrap to first
      await user.tab();
      expect(document.activeElement).toBe(firstButton);
      
      // Shift+Tab should go backwards and wrap
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(thirdButton);
    });

    it('should not trap focus when inactive', () => {
      render(
        <FocusTrap active={false}>
          <div>
            <button>Button inside</button>
          </div>
        </FocusTrap>
      );
      
      const button = screen.getByText('Button inside');
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      fireEvent.keyDown(button, event);
      
      // Event should not be prevented
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('useFocusManagement', () => {
    const TestComponent = () => {
      const { setFocus, returnFocus, trapFocus, releaseTrap } = useFocusManagement();
      
      return (
        <div>
          <button id="button1">Button 1</button>
          <button id="button2">Button 2</button>
          <button onClick={() => setFocus('#button2')}>Focus Button 2</button>
          <button onClick={returnFocus}>Return Focus</button>
          <button onClick={() => trapFocus('#trap-container')}>Trap Focus</button>
          <button onClick={releaseTrap}>Release Trap</button>
          <div id="trap-container">
            <button>Trapped Button</button>
          </div>
        </div>
      );
    };

    it('should set focus to element', () => {
      render(<TestComponent />);
      
      const button2 = screen.getByText('Button 2');
      const focusButton = screen.getByText('Focus Button 2');
      
      fireEvent.click(focusButton);
      
      expect(document.activeElement).toBe(button2);
    });

    it('should return focus to previous element', () => {
      render(<TestComponent />);
      
      const button1 = screen.getByText('Button 1');
      const button2 = screen.getByText('Button 2');
      const focusButton = screen.getByText('Focus Button 2');
      const returnButton = screen.getByText('Return Focus');
      
      // Focus button 1
      button1.focus();
      
      // Change focus to button 2
      fireEvent.click(focusButton);
      expect(document.activeElement).toBe(button2);
      
      // Return focus
      fireEvent.click(returnButton);
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('useAnnouncement', () => {
    const TestComponent = () => {
      const { announce, clear } = useAnnouncement();
      
      return (
        <div>
          <button onClick={() => announce('Test announcement')}>Announce</button>
          <button onClick={() => announce('Urgent!', 'assertive')}>Announce Urgent</button>
          <button onClick={clear}>Clear</button>
        </div>
      );
    };

    it('should announce messages', async () => {
      render(<TestComponent />);
      
      const announceButton = screen.getByText('Announce');
      
      fireEvent.click(announceButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Test announcement');
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should announce urgent messages assertively', async () => {
      render(<TestComponent />);
      
      const urgentButton = screen.getByText('Announce Urgent');
      
      fireEvent.click(urgentButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Urgent!');
        expect(announcement).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should clear announcements', async () => {
      render(<TestComponent />);
      
      const announceButton = screen.getByText('Announce');
      const clearButton = screen.getByText('Clear');
      
      fireEvent.click(announceButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test announcement')).toBeInTheDocument();
      });
      
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Test announcement')).not.toBeInTheDocument();
      });
    });
  });

  describe('a11y utility styles', () => {
    it('should provide screen reader only styles', () => {
      expect(a11y.srOnly).toEqual({
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      });
    });

    it('should provide focusable styles', () => {
      expect(a11y.focusable).toEqual({
        '&:focus': {
          outline: '2px solid #2D72D2',
          outlineOffset: '2px'
        }
      });
    });

    it('should provide focus visible styles', () => {
      expect(a11y.focusVisible).toEqual({
        '&:focus-visible': {
          outline: '2px solid #2D72D2',
          outlineOffset: '2px'
        }
      });
    });
  });
});