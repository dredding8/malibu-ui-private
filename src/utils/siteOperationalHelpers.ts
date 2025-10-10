/**
 * Site Operational Helpers
 *
 * Utility functions for working with site operational constraints:
 * operational days, operational hours, and time distribution aggregation.
 */

import {
  Site,
  DayOfWeekCode,
  OperationalHours,
} from '../types/collectionOpportunities';

/**
 * Day of week ordering for sorting
 */
const DAY_ORDER: Record<DayOfWeekCode, number> = {
  'M': 1,
  'T': 2,
  'W': 3,
  'TH': 4,
  'F': 5,
  'SA': 6,
  'SU': 7,
};

/**
 * Aggregate operational days from multiple sites
 * Returns union of all operational days, sorted by day of week
 *
 * @param sites - Array of sites to aggregate
 * @returns Sorted array of unique operational days
 *
 * @example
 * const sites = [
 *   { operationalDays: ['M', 'T', 'W', 'TH', 'F'] }, // DGS: M-F
 *   { operationalDays: ['M', 'W', 'F'] },            // FYL: M, W, F
 * ];
 * aggregateOperationalDays(sites); // ['M', 'T', 'W', 'TH', 'F']
 */
export function aggregateOperationalDays(sites: Site[]): DayOfWeekCode[] {
  const uniqueDays = new Set<DayOfWeekCode>();
  
  sites.forEach(site => {
    if (site.operationalDays) {
      site.operationalDays.forEach(day => uniqueDays.add(day));
    }
  });

  return Array.from(uniqueDays).sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]);
}

/**
 * Format operational days as human-readable string
 *
 * @param days - Array of day codes
 * @returns Formatted string
 *
 * @example
 * formatOperationalDays(['M', 'T', 'W', 'TH', 'F']); // "M-F"
 * formatOperationalDays(['M', 'W', 'F']);            // "M, W, F"
 * formatOperationalDays(['M', 'T', 'W', 'TH', 'F', 'SA', 'SU']); // "24/7"
 */
export function formatOperationalDays(days: DayOfWeekCode[]): string {
  if (!days || days.length === 0) return '-';
  
  // Check if 24/7 (all 7 days)
  if (days.length === 7) return '24/7';
  
  // Check if M-F (weekdays)
  const weekdays: DayOfWeekCode[] = ['M', 'T', 'W', 'TH', 'F'];
  const isWeekdays = weekdays.every(day => days.includes(day)) && days.length === 5;
  if (isWeekdays) return 'M-F';
  
  // Check if weekend only
  const weekend: DayOfWeekCode[] = ['SA', 'SU'];
  const isWeekend = weekend.every(day => days.includes(day)) && days.length === 2;
  if (isWeekend) return 'SA-SU';
  
  // Default: comma-separated list
  return days.join(', ');
}

/**
 * Format operational hours as human-readable string
 *
 * @param hours - Operational hours object
 * @returns Formatted string
 *
 * @example
 * formatOperationalHours({ start: "08:00", end: "17:00", timezone: "EST" }); // "0800-1700 EST"
 * formatOperationalHours(undefined); // "24/7"
 */
export function formatOperationalHours(hours?: OperationalHours): string {
  if (!hours) return '24/7';
  
  const start = hours.start.replace(':', '');
  const end = hours.end.replace(':', '');
  return `${start}-${end} ${hours.timezone}`;
}

/**
 * Get combined operational description for a site
 *
 * @param site - Site object
 * @returns Combined days and hours description
 *
 * @example
 * getSiteOperationalDescription(dgs); // "M-F, 0800-1700 EST"
 * getSiteOperationalDescription(clr); // "24/7"
 */
export function getSiteOperationalDescription(site: Site): string {
  const days = formatOperationalDays(site.operationalDays);
  const hours = formatOperationalHours(site.operationalHours);
  
  // If both are 24/7, just return "24/7"
  if (days === '24/7' && hours === '24/7') return '24/7';
  
  // If hours are 24/7, just show days
  if (hours === '24/7') return days;
  
  // Show both days and hours
  return `${days}, ${hours}`;
}

/**
 * Check if a site is operational on a given day
 *
 * @param site - Site object
 * @param day - Day of week code
 * @returns True if site operates on that day
 */
export function isSiteOperationalOnDay(site: Site, day: DayOfWeekCode): boolean {
  return site.operationalDays.includes(day);
}

/**
 * Check if site operates 24/7
 *
 * @param site - Site object
 * @returns True if site operates all days with no hour restrictions
 */
export function isSite24x7(site: Site): boolean {
  return site.operationalDays.length === 7 && !site.operationalHours;
}
