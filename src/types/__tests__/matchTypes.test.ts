import {
  getMatchStatusIntent,
  getMatchStatusLabel,
  getMatchNoteCategoryMessage,
  formatMatchNotes,
  matchNeedsAttention,
  MatchNote,
  MatchStatus
} from '../matchTypes';
import { Intent } from '@blueprintjs/core';

describe('matchTypes', () => {
  describe('getMatchStatusIntent', () => {
    it('should return SUCCESS for optimal match', () => {
      expect(getMatchStatusIntent('optimal')).toBe(Intent.SUCCESS);
    });

    it('should return WARNING for suboptimal match', () => {
      expect(getMatchStatusIntent('suboptimal')).toBe(Intent.WARNING);
    });

    it('should return WARNING for baseline match', () => {
      expect(getMatchStatusIntent('baseline')).toBe(Intent.WARNING);
    });

    it('should return DANGER for no-match', () => {
      expect(getMatchStatusIntent('no-match')).toBe(Intent.DANGER);
    });
  });

  describe('getMatchStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect(getMatchStatusLabel('optimal')).toBe('Optimal');
      expect(getMatchStatusLabel('suboptimal')).toBe('Suboptimal');
      expect(getMatchStatusLabel('baseline')).toBe('Baseline');
      expect(getMatchStatusLabel('no-match')).toBe('No Match');
    });
  });

  describe('getMatchNoteCategoryMessage', () => {
    it('should return correct messages for each category', () => {
      expect(getMatchNoteCategoryMessage('capacity-limited')).toBe('Sensor capacity limited');
      expect(getMatchNoteCategoryMessage('not-observable')).toBe('Not observable');
      expect(getMatchNoteCategoryMessage('partial-coverage')).toBe('Partial coverage only');
      expect(getMatchNoteCategoryMessage('resource-conflict')).toBe('Resource conflict');
    });
  });

  describe('formatMatchNotes', () => {
    it('should return empty string for no notes', () => {
      expect(formatMatchNotes([])).toBe('');
    });

    it('should return the highest priority note', () => {
      const notes: MatchNote[] = [
        {
          category: 'partial-coverage',
          message: 'Partial coverage message'
        },
        {
          category: 'not-observable',
          message: 'Not observable message'
        },
        {
          category: 'capacity-limited',
          message: 'Capacity limited message'
        }
      ];
      
      // not-observable has highest priority
      expect(formatMatchNotes(notes)).toBe('Not observable message');
    });

    it('should handle single note', () => {
      const notes: MatchNote[] = [
        {
          category: 'capacity-limited',
          message: 'Sensor capacity constraints'
        }
      ];
      
      expect(formatMatchNotes(notes)).toBe('Sensor capacity constraints');
    });
  });

  describe('matchNeedsAttention', () => {
    it('should return false for optimal matches', () => {
      expect(matchNeedsAttention('optimal')).toBe(false);
    });

    it('should return true for suboptimal matches', () => {
      expect(matchNeedsAttention('suboptimal')).toBe(true);
    });

    it('should return true for baseline matches', () => {
      expect(matchNeedsAttention('baseline')).toBe(true);
    });

    it('should return true for no matches', () => {
      expect(matchNeedsAttention('no-match')).toBe(true);
    });
  });
});