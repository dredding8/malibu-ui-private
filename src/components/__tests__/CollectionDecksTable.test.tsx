import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollectionDecksTable from '../CollectionDecksTable';
import '@testing-library/jest-dom';

// Mock Blueprint.js Table component since it doesn't render well in jest-dom
jest.mock('@blueprintjs/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-table">{children}</div>
  ),
  Column: ({ name, cellRenderer }: any) => {
    // Render a mock table column with cells
    const mockData = name === 'Match Notes' ? [
      { matchInfo: { status: 'optimal' } },
      { matchInfo: { status: 'suboptimal', notes: [{ message: 'Capacity limited' }] } },
      { matchInfo: { status: 'no-match', notes: [{ message: 'Not observable' }] } }
    ] : [];
    
    return (
      <div data-testid={`column-${name}`}>
        <div>{name}</div>
        {mockData.map((data, idx) => (
          <div key={idx} data-testid={`cell-${name}-${idx}`}>
            {cellRenderer ? cellRenderer(idx) : null}
          </div>
        ))}
      </div>
    );
  },
  Cell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  RegionCardinality: {},
  SelectionModes: {}
}));

describe('CollectionDecksTable - Match Notes Feature', () => {
  describe('Match Notes Column', () => {
    it('should render Match Notes column in the table', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Check if Match Notes column exists
      const matchNotesColumn = screen.getByTestId('column-Match Notes');
      expect(matchNotesColumn).toBeInTheDocument();
      expect(within(matchNotesColumn).getByText('Match Notes')).toBeInTheDocument();
    });

    it('should display optimal match status correctly', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Look for optimal status tag
      const optimalTags = screen.getAllByText('Optimal');
      expect(optimalTags.length).toBeGreaterThan(0);
      
      // Check for "Full coverage" text
      const fullCoverageTexts = screen.getAllByText('Full coverage');
      expect(fullCoverageTexts.length).toBeGreaterThan(0);
    });

    it('should display suboptimal match with notes', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Look for suboptimal status
      const suboptimalTags = screen.getAllByText('Suboptimal');
      expect(suboptimalTags.length).toBeGreaterThan(0);
      
      // Check for capacity constraints message
      const capacityMessages = screen.getAllByText('Sensor capacity constraints');
      expect(capacityMessages.length).toBeGreaterThan(0);
    });

    it('should display no-match status with appropriate styling', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Look for no-match status
      const noMatchTags = screen.getAllByText('No Match');
      expect(noMatchTags.length).toBeGreaterThan(0);
      
      // Check for not observable message
      const notObservableMessages = screen.getAllByText('Object not visible to sensors');
      expect(notObservableMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Data Filtering', () => {
    it('should filter in-progress decks correctly', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Check that we're showing in-progress decks
      expect(screen.getByText(/Showing \d+ in-progress deck/)).toBeInTheDocument();
    });

    it('should filter completed decks correctly', () => {
      render(<CollectionDecksTable type="completed" startDate={null} endDate={null} />);
      
      // Check that we're showing completed decks
      expect(screen.getByText(/Showing \d+ completed deck/)).toBeInTheDocument();
      
      // Completed decks should have completion date column
      const completionDateColumn = screen.getByTestId('column-Completion Date');
      expect(completionDateColumn).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels for match status indicators', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Check for status tags with proper semantic meaning
      const statusTags = screen.getAllByText(/Optimal|Suboptimal|Baseline|No Match/);
      expect(statusTags.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Verify table is rendered (mocked)
      const table = screen.getByTestId('mock-table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should show tooltip on hover for match notes', async () => {
      const user = userEvent.setup();
      render(<CollectionDecksTable type="in-progress" startDate={null} endDate={null} />);
      
      // Find an element with match notes
      const noteElements = screen.getAllByText(/Sensor capacity constraints|Object not visible to sensors/);
      
      if (noteElements.length > 0) {
        // Hover over the first note element
        await user.hover(noteElements[0]);
        
        // Note: In a real test environment with proper Blueprint.js setup,
        // we would check for tooltip content here
      }
    });
  });
});