/**
 * Unit Tests: SCC Formatting Utilities
 *
 * Validates all formatting, parsing, and validation functions
 * for Satellite Catalog Numbers (SCC)
 */

import {
  formatSccNumber,
  parseSccNumber,
  isValidSccNumber,
  formatSccWithPrefix,
} from '../sccFormatting';

describe('formatSccNumber', () => {
  test('should format 5-digit numbers without padding', () => {
    expect(formatSccNumber(12345 as any)).toBe('12345');
    expect(formatSccNumber(99999 as any)).toBe('99999');
    expect(formatSccNumber(10000 as any)).toBe('10000');
  });

  test('should zero-pad numbers < 5 digits', () => {
    expect(formatSccNumber(1 as any)).toBe('00001');
    expect(formatSccNumber(123 as any)).toBe('00123');
    expect(formatSccNumber(678 as any)).toBe('00678');
    expect(formatSccNumber(9999 as any)).toBe('09999');
  });

  test('should handle undefined and null', () => {
    expect(formatSccNumber(undefined)).toBe('N/A');
    expect(formatSccNumber(null)).toBe('N/A');
  });

  test('should handle out-of-range values gracefully', () => {
    expect(formatSccNumber(0 as any)).toBe('0'); // Invalid but doesn't crash
    expect(formatSccNumber(100000 as any)).toBe('100000'); // Invalid but doesn't crash
    expect(formatSccNumber(-1 as any)).toBe('-1'); // Invalid but doesn't crash
  });

  test('should respect custom minDigits parameter', () => {
    expect(formatSccNumber(123 as any, 3)).toBe('123');
    expect(formatSccNumber(5 as any, 3)).toBe('005');
    expect(formatSccNumber(12345 as any, 3)).toBe('12345'); // Doesn't truncate
  });
});

describe('parseSccNumber', () => {
  test('should parse plain numeric strings', () => {
    expect(parseSccNumber('123')).toBe(123);
    expect(parseSccNumber('00123')).toBe(123);
    expect(parseSccNumber('12345')).toBe(12345);
  });

  test('should parse SCC-prefixed strings', () => {
    expect(parseSccNumber('SCC-123')).toBe(123);
    expect(parseSccNumber('SCC 123')).toBe(123);
    expect(parseSccNumber('SCC:123')).toBe(123);
    expect(parseSccNumber('scc-123')).toBe(123); // Case insensitive
  });

  test('should return null for invalid inputs', () => {
    expect(parseSccNumber('')).toBe(null);
    expect(parseSccNumber('invalid')).toBe(null);
    expect(parseSccNumber('abc123')).toBe(null);
    expect(parseSccNumber('123abc')).toBe(null);
  });

  test('should return null for out-of-range values', () => {
    expect(parseSccNumber('0')).toBe(null);
    expect(parseSccNumber('100000')).toBe(null);
    expect(parseSccNumber('-123')).toBe(null);
  });
});

describe('isValidSccNumber', () => {
  test('should validate numbers in range 1-99999', () => {
    expect(isValidSccNumber(1)).toBe(true);
    expect(isValidSccNumber(123)).toBe(true);
    expect(isValidSccNumber(12345)).toBe(true);
    expect(isValidSccNumber(99999)).toBe(true);
  });

  test('should reject numbers outside range', () => {
    expect(isValidSccNumber(0)).toBe(false);
    expect(isValidSccNumber(-1)).toBe(false);
    expect(isValidSccNumber(100000)).toBe(false);
    expect(isValidSccNumber(999999)).toBe(false);
  });

  test('should reject non-integers', () => {
    expect(isValidSccNumber(123.45)).toBe(false);
    expect(isValidSccNumber(NaN)).toBe(false);
    expect(isValidSccNumber(Infinity)).toBe(false);
  });
});

describe('formatSccWithPrefix', () => {
  test('should format with default SCC prefix', () => {
    expect(formatSccWithPrefix(123 as any)).toBe('SCC 00123');
    expect(formatSccWithPrefix(12345 as any)).toBe('SCC 12345');
  });

  test('should format with custom prefix', () => {
    expect(formatSccWithPrefix(123 as any, 'CAT')).toBe('CAT 00123');
    expect(formatSccWithPrefix(12345 as any, 'SAT')).toBe('SAT 12345');
  });

  test('should handle undefined and null', () => {
    expect(formatSccWithPrefix(undefined)).toBe('N/A');
    expect(formatSccWithPrefix(null)).toBe('N/A');
  });
});

describe('Integration: Format → Parse → Validate', () => {
  test('should round-trip successfully', () => {
    const original = 12345;
    const formatted = formatSccNumber(original as any);
    const parsed = parseSccNumber(formatted);
    const isValid = parsed ? isValidSccNumber(parsed) : false;

    expect(parsed).toBe(original);
    expect(isValid).toBe(true);
  });

  test('should handle zero-padded round-trip', () => {
    const original = 123;
    const formatted = formatSccNumber(original as any); // "00123"
    const parsed = parseSccNumber(formatted); // 123

    expect(parsed).toBe(original);
    expect(formatted).toBe('00123');
  });
});
