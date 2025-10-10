/**
 * SCC (Satellite Catalog Number) Formatting Utilities
 *
 * SCC numbers are numeric values (1-99999) used to uniquely identify satellites.
 * Typically displayed with zero-padding up to 5 digits.
 *
 * @module sccFormatting
 */

import { SccNumber } from '../types/collectionOpportunities';

/**
 * Format SCC number with zero-padding
 *
 * @param scc - SCC value (number or string that can be parsed)
 * @param minDigits - Minimum digits to display (default: 5)
 * @returns Formatted SCC string (e.g., "00123", "12345")
 *
 * @example
 * formatSccNumber(123) // "00123"
 * formatSccNumber(12345) // "12345"
 * formatSccNumber("00123") // "00123"
 * formatSccNumber("unit-1") // "N/A" (invalid)
 */
export const formatSccNumber = (
  scc: SccNumber | number | string | undefined | null,
  minDigits: number = 5
): string => {
  console.log('[formatSccNumber] Called with:', { scc, type: typeof scc });

  if (scc === undefined || scc === null) {
    console.log('[formatSccNumber] Returning N/A (null/undefined)');
    return 'N/A';
  }

  // If string, try to parse it
  if (typeof scc === 'string') {
    console.log('[formatSccNumber] String detected, attempting parse:', scc);
    const parsed = parseSccNumber(scc);
    if (parsed === null) {
      // Could not parse as valid SCC number
      console.log('[formatSccNumber] Parse failed, returning N/A');
      return 'N/A';
    }
    console.log('[formatSccNumber] Parsed to:', parsed);
    scc = parsed;
  }

  // At this point, scc should be a number
  const numericScc = Number(scc);

  // Validate SCC range
  if (numericScc < 1 || numericScc > 99999) {
    console.warn(`[formatSccNumber] SCC out of range: ${numericScc}. Expected 1-99999.`);
    return 'N/A';
  }

  // Zero-pad to minimum digits
  const result = String(numericScc).padStart(minDigits, '0');
  console.log('[formatSccNumber] Returning formatted:', result);
  return result;
};

/**
 * Parse SCC number from string input
 *
 * @param input - String input (e.g., "00123", "123", "SCC-123")
 * @returns Numeric SCC value or null if invalid
 *
 * @example
 * parseSccNumber("00123") // 123
 * parseSccNumber("SCC-123") // 123
 * parseSccNumber("invalid") // null
 */
export const parseSccNumber = (input: string): number | null => {
  if (!input) return null;

  // Remove common prefixes
  const cleaned = input.replace(/^(SCC[-\s:]?)/i, '').trim();

  // Parse as integer
  const parsed = parseInt(cleaned, 10);

  // Validate
  if (isNaN(parsed) || parsed < 1 || parsed > 99999) {
    return null;
  }

  return parsed;
};

/**
 * Validate SCC number
 *
 * @param scc - SCC value to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidSccNumber(123) // true
 * isValidSccNumber(0) // false
 * isValidSccNumber(100000) // false
 */
export const isValidSccNumber = (scc: number): boolean => {
  return Number.isInteger(scc) && scc >= 1 && scc <= 99999;
};

/**
 * Format SCC number with prefix
 *
 * @param scc - SCC value (number or string that can be parsed)
 * @param prefix - Prefix to add (default: "SCC")
 * @returns Formatted string with prefix (e.g., "SCC 00123")
 *
 * @example
 * formatSccWithPrefix(123) // "SCC 00123"
 * formatSccWithPrefix("00123") // "SCC 00123"
 * formatSccWithPrefix(123, "CAT") // "CAT 00123"
 */
export const formatSccWithPrefix = (
  scc: SccNumber | number | string | undefined | null,
  prefix: string = 'SCC'
): string => {
  const formatted = formatSccNumber(scc);
  if (formatted === 'N/A') return formatted;
  return `${prefix} ${formatted}`;
};
