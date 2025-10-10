/**
 * Collection Opportunities Types and Interfaces
 * Manages satellite collection opportunities with real-time capacity tracking
 * 
 * @version 2.0.0 - Enhanced with branded types, template literals, and strict validation
 * @date 2025-09-30
 */

// Branded types for enhanced type safety
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

// ID Types - Branded for type safety
export type OpportunityId = Branded<string, 'OpportunityId'>;
export type SatelliteId = Branded<string, 'SatelliteId'>;
export type SiteId = Branded<string, 'SiteId'>;
export type PassId = Branded<string, 'PassId'>;
export type CollectionDeckId = Branded<string, 'CollectionDeckId'>;
export type SccNumber = Branded<number, 'SccNumber'>; // Numeric: 1-99999 (up to 5 digits)

// ISO Date String - Template literal type for validation
export type ISODateString = Branded<string, 'ISODateString'>;

// Numeric constraints
export type Percentage = Branded<number, 'Percentage'>; // 0-100
export type Latitude = Branded<number, 'Latitude'>; // -90 to 90
export type Longitude = Branded<number, 'Longitude'>; // -180 to 180
export type Degrees = Branded<number, 'Degrees'>; // 0-360
export type QualityScore = Branded<number, 'QualityScore'>; // 0-100
export type RiskScore = Branded<number, 'RiskScore'>; // 0-100

// Status types for collection opportunities
export type OpportunityStatus = 'optimal' | 'warning' | 'critical';

// Priority levels with numeric constraints
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type PriorityValue = 1 | 2 | 3 | 4; // Numeric representation

// Classification levels
export type ClassificationLevel = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

// Site allocation codes - Template literal type
export type SiteAllocationCode = `${Uppercase<string>}${Uppercase<string>}${Uppercase<string>}` | `${Uppercase<string>}${Uppercase<string>}`;

// Satellite information with strict types
export interface Satellite {
  readonly id: SatelliteId;
  readonly name: string;
  readonly capacity: number; // Must be > 0
  readonly currentLoad: number; // Must be >= 0 and <= capacity
  readonly orbit: OrbitType;
  readonly function: SatelliteFunction;
}

// Orbit types
export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'SSO' | 'Polar';

// Satellite functions
export type SatelliteFunction = 
  | 'Imaging'
  | 'Communications' 
  | 'Weather'
  | 'Navigation'
  | 'Scientific'
  | 'Reconnaissance';

// Operational hours for a site
export interface OperationalHours {
  readonly start: string; // 24-hour format "HH:MM"
  readonly end: string;   // 24-hour format "HH:MM"
  readonly timezone: string; // e.g., "EST", "PST", "UTC"
}

// Site allocation with validated location and operational constraints
export interface Site {
  readonly id: SiteId;
  readonly name: string;
  readonly location: GeographicLocation;
  readonly capacity: number; // Must be > 0
  readonly allocated: number; // Must be >= 0 and <= capacity
  readonly operationalDays: ReadonlyArray<DayOfWeekCode>; // Days site is operational
  readonly operationalHours?: OperationalHours; // Operating hours (undefined = 24/7)
}

// Geographic location with constraints
export interface GeographicLocation {
  readonly lat: Latitude;
  readonly lon: Longitude;
}

// Match status types
export type MatchStatus = 'baseline' | 'suboptimal' | 'unmatched';

// Collection type
export type CollectionType = 'optical' | 'wideband' | 'narrowband';

// Alternative match option with strict typing
export interface AlternativeMatch {
  readonly siteId: SiteId;
  readonly siteName: string;
  readonly reason: AlternativeReason;
  readonly qualityScore: QualityScore;
  readonly tradeoffs: ReadonlyArray<string>;
}

// Alternative match reasons
export type AlternativeReason = 
  | 'Primary site at capacity'
  | 'Better coverage angle'
  | 'Lower conflict rate'
  | 'Cost optimization'
  | string; // Custom reason

// Collection opportunity with enhanced type safety
export interface CollectionOpportunity {
  readonly id: OpportunityId;
  readonly name: string;
  readonly satellite: Satellite;
  readonly sites: ReadonlyArray<Site>;
  readonly priority: Priority;
  readonly priorityValue?: PriorityValue;
  readonly status: OpportunityStatus;
  readonly capacityPercentage: Percentage;
  readonly conflicts: ReadonlyArray<OpportunityId>;
  readonly createdDate: ISODateString;
  readonly lastModified: ISODateString;
  readonly notes?: string;
  readonly modifiedBy?: string;
  readonly collectionDeckId: CollectionDeckId;
  readonly allocatedSites: ReadonlyArray<Site>;
  readonly systemRecommendedSites?: ReadonlyArray<Site>; // Optimal allocation from system
  readonly totalPasses: number; // Must be >= 0
  readonly capacity: number; // Must be > 0
  readonly changeJustification?: string;
  readonly classificationLevel?: ClassificationLevel;
  
  // Match status system fields
  readonly matchStatus: MatchStatus;
  readonly matchNotes?: MatchNote;
  readonly matchQuality?: QualityScore;
  readonly alternativeOptions?: ReadonlyArray<AlternativeMatch>;
  readonly sccNumber?: SccNumber;
  readonly collectionType?: CollectionType;
  readonly periodicity?: PeriodicityValue;
  readonly periodicityUnit?: PeriodicityUnit;
  readonly lastMatchAttempt?: ISODateString;
  
  // Site allocation codes
  readonly siteAllocationCodes?: ReadonlyArray<SiteAllocationCode>;
  
  // Pass information (JTBD 1: Verify and Validate)
  readonly passes?: ReadonlyArray<Pass>;
  readonly dataIntegrityIssues?: ReadonlyArray<DataIntegrityIssue>;
}

// Match note types
export type MatchNote = 
  | 'Best Pass'
  | 'Capacity Issue'
  | 'Schedule Conflict'
  | 'Technical Limitation'
  | string; // Custom note

// Periodicity constraints
export type PeriodicityValue = number; // Must be > 0
export type PeriodicityUnit = 'hours' | 'days' | 'weeks';

// Time Distribution - Days of the week for collection schedule
export type DayOfWeekCode = 'M' | 'T' | 'W' | 'TH' | 'F' | 'SA' | 'SU';
export type TimeDistribution = ReadonlyArray<DayOfWeekCode>;

// Data integrity issue type (JTBD 3) with enhanced typing
export interface DataIntegrityIssue {
  readonly type: DataIntegrityIssueType;
  readonly severity: IssueSeverity;
  readonly message: string;
  readonly lastKnownGood?: Date;
  readonly satelliteId: SatelliteId;
}

export type DataIntegrityIssueType = 
  | 'NO_TLE' 
  | 'STALE_EPHEMERIS' 
  | 'SITE_OFFLINE' 
  | 'SENSOR_FAILURE'
  | 'COMMUNICATION_LOST'
  | 'CALIBRATION_ERROR';

export type IssueSeverity = 'critical' | 'warning' | 'info';

// Change tracking with strict typing
export interface OpportunityChange {
  readonly opportunityId: OpportunityId;
  readonly changes: {
    readonly sites?: ReadonlyArray<Site>;
    readonly priority?: Priority;
    readonly notes?: string;
  };
  readonly timestamp: ISODateString;
  readonly previousValues?: {
    readonly sites?: ReadonlyArray<Site>;
    readonly priority?: Priority;
    readonly notes?: string;
  };
}

// Validation results with typed constraints
export interface CapacityResult {
  readonly available: number; // Must be >= 0
  readonly allocated: number; // Must be >= 0
  readonly percentage: Percentage;
  readonly status: OpportunityStatus;
  readonly warnings?: ReadonlyArray<string>;
}

export interface ValidationError {
  readonly opportunityId: OpportunityId;
  readonly field: string;
  readonly message: string;
  readonly severity: ValidationSeverity;
}

export type ValidationSeverity = 'error' | 'warning';

export interface Conflict {
  readonly opportunityId: OpportunityId;
  readonly conflictsWith: OpportunityId;
  readonly reason: string;
  readonly severity: ConflictSeverity;
}

export type ConflictSeverity = 'high' | 'medium' | 'low';

// Optimization suggestion with improvement metrics
export interface Optimization {
  readonly opportunityId: OpportunityId;
  readonly suggestion: string;
  readonly expectedImprovement: Percentage;
  readonly sites: ReadonlyArray<Site>;
}

// Capacity thresholds
export interface CapacityThresholds {
  critical: number; // Below this is critical (default: 10)
  warning: number;  // Below this is warning (default: 30)
  optimal: number;  // Above this is optimal (default: 70)
}

// Management state with immutable collections
export interface OpportunityManagementState {
  readonly originalData: ReadonlyArray<CollectionOpportunity>;
  readonly workingData: ReadonlyArray<CollectionOpportunity>;
  readonly pendingChanges: ReadonlyMap<OpportunityId, OpportunityChange>;
  readonly validationErrors: ReadonlyArray<ValidationError>;
  readonly isCommitting: boolean;
  readonly editingOpportunityId?: OpportunityId;
  readonly sortColumn?: string;
  readonly sortDirection?: SortDirection;
  readonly filter?: OpportunityFilter;
}

export type SortDirection = 'asc' | 'desc';

export interface OpportunityFilter {
  readonly function?: ReadonlyArray<SatelliteFunction>;
  readonly orbit?: ReadonlyArray<OrbitType>;
  readonly status?: ReadonlyArray<OpportunityStatus>;
  readonly capacityRange?: readonly [number, number];
  readonly priority?: ReadonlyArray<Priority>;
}

// Batch update request/response with typed arrays
export interface BatchUpdateRequest {
  readonly changes: ReadonlyArray<OpportunityChange>;
  readonly validateOnly?: boolean;
}

export interface BatchUpdateResponse {
  readonly success: boolean;
  readonly updated: ReadonlyArray<OpportunityId>;
  readonly failures: ReadonlyArray<ValidationError>;
  readonly rollbackId?: string;
}

// Bulk operations types removed - individual actions only

// Undo/Redo operations with typed state
export interface UndoRedoOperation {
  readonly id: string;
  readonly type: OperationType;
  readonly action: string;
  readonly timestamp: ISODateString;
  readonly affectedOpportunities: ReadonlyArray<OpportunityId>;
  readonly previousState: unknown;
  readonly description: string;
  readonly canUndo: boolean;
}

export type OperationType = 'bulk' | 'single';

// Audit trail with resource typing
export interface AuditTrailEntry {
  readonly id: string;
  readonly timestamp: ISODateString;
  readonly userId: string;
  readonly userName: string;
  readonly action: string;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly oldValues?: Readonly<Record<string, unknown>>;
  readonly newValues?: Readonly<Record<string, unknown>>;
}

export type ResourceType = 'opportunity' | 'collection' | 'site';

// Sort configuration
export interface SortConfig {
  column: keyof CollectionOpportunity;
  direction: 'asc' | 'desc';
}

// Filter configuration
export interface FilterConfig {
  function?: string[];
  orbit?: string[];
  status?: OpportunityStatus[];
  capacityRange?: [number, number];
  priority?: Priority[];
}

// Collection Deck with strict typing
export interface CollectionDeck {
  readonly id: CollectionDeckId;
  readonly name: string;
  readonly satellite: string;
  readonly sensor: string;
  readonly capacity: number; // Must be > 0
  readonly currentLoad: number; // Must be >= 0 and <= capacity
  readonly passes: ReadonlyArray<Pass>;
}

// Pass - Unified interface with strict constraints
export interface Pass {
  readonly id: PassId;
  readonly name: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly quality: PassQuality; // 1-5 scale
  readonly duration?: PassDuration; // minutes (computed from start/end)
  readonly elevation?: Degrees; // 0-90 degrees
  readonly azimuth?: Degrees; // 0-360 degrees
  readonly siteCapabilities: ReadonlyArray<Site>;
  readonly priority: PassPriority;
  readonly classificationLevel: ClassificationLevel;
  readonly conflictsWith?: ReadonlyArray<PassId>;
  readonly requiredResources?: ReadonlyArray<ResourceRequirement>;
  readonly metadata?: PassMetadata;
}

// Pass-specific types
export type PassQuality = 1 | 2 | 3 | 4 | 5;
export type PassDuration = Branded<number, 'PassDuration'>; // minutes > 0
export type PassPriority = 'normal' | 'high' | 'critical';
export type ResourceRequirement = string; // Could be enhanced with specific resource types

export interface PassMetadata {
  readonly satellite?: string;
  readonly sensor?: string;
  readonly downlinkSite?: string;
}

// Helper to calculate pass duration
export function getPassDuration(pass: Pass): number {
  return Math.round((pass.endTime.getTime() - pass.startTime.getTime()) / (1000 * 60));
}

// Helper to convert quality string to number
export function parseQualityString(quality: 'excellent' | 'good' | 'fair' | 'poor'): number {
  const qualityMap = { excellent: 5, good: 4, fair: 3, poor: 2 };
  return qualityMap[quality] || 3;
}

// Allocation Change with typed IDs
export interface AllocationChange {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: AllocationType;
  readonly opportunityId: OpportunityId;
  readonly siteId: SiteId;
  readonly passId: PassId;
  readonly previousValue: Pass | null;
  readonly newValue: Pass | null;
  readonly userId: string;
}

export type AllocationType = 'allocate' | 'deallocate' | 'modify';

// Health Analysis with strict scoring
export interface HealthAnalysis {
  readonly score: QualityScore;
  readonly overallHealth: HealthStatus;
  readonly coverage: string;
  readonly efficiency: string;
  readonly balance: string;
  readonly issues: ReadonlyArray<string>;
  readonly level?: HealthLevel;
}

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor';
export type HealthLevel = 'critical' | 'warning' | 'optimal';

// ============================================================================
// Type Guards and Validation Utilities
// ============================================================================

// Brand creation utilities
export function createOpportunityId(id: string): OpportunityId {
  if (!id || typeof id !== 'string') {
    throw new TypeError('OpportunityId must be a non-empty string');
  }
  return id as OpportunityId;
}

export function createSatelliteId(id: string): SatelliteId {
  if (!id || typeof id !== 'string') {
    throw new TypeError('SatelliteId must be a non-empty string');
  }
  return id as SatelliteId;
}

export function createSiteId(id: string): SiteId {
  if (!id || typeof id !== 'string') {
    throw new TypeError('SiteId must be a non-empty string');
  }
  return id as SiteId;
}

export function createPassId(id: string): PassId {
  if (!id || typeof id !== 'string') {
    throw new TypeError('PassId must be a non-empty string');
  }
  return id as PassId;
}

// Numeric validation utilities
export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new RangeError(`Percentage must be between 0 and 100, got ${value}`);
  }
  return value as Percentage;
}

export function createLatitude(value: number): Latitude {
  if (value < -90 || value > 90) {
    throw new RangeError(`Latitude must be between -90 and 90, got ${value}`);
  }
  return value as Latitude;
}

export function createLongitude(value: number): Longitude {
  if (value < -180 || value > 180) {
    throw new RangeError(`Longitude must be between -180 and 180, got ${value}`);
  }
  return value as Longitude;
}

export function createDegrees(value: number): Degrees {
  if (value < 0 || value > 360) {
    throw new RangeError(`Degrees must be between 0 and 360, got ${value}`);
  }
  return value as Degrees;
}

export function createQualityScore(value: number): QualityScore {
  if (value < 0 || value > 100) {
    throw new RangeError(`QualityScore must be between 0 and 100, got ${value}`);
  }
  return value as QualityScore;
}

export function createRiskScore(value: number): RiskScore {
  if (value < 0 || value > 100) {
    throw new RangeError(`RiskScore must be between 0 and 100, got ${value}`);
  }
  return value as RiskScore;
}

// Date validation
export function createISODateString(date: string | Date): ISODateString {
  const isoString = typeof date === 'string' ? date : date.toISOString();
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  
  if (!isoRegex.test(isoString)) {
    throw new TypeError(`Invalid ISO date string: ${isoString}`);
  }
  
  return isoString as ISODateString;
}

// Site allocation code validation
export function createSiteAllocationCode(code: string): SiteAllocationCode {
  const upperCode = code.toUpperCase();
  if (!/^[A-Z]{2,3}$/.test(upperCode)) {
    throw new TypeError(`Site allocation code must be 2-3 uppercase letters, got ${code}`);
  }
  return upperCode as SiteAllocationCode;
}

// Type guards
export function isOpportunityStatus(value: string): value is OpportunityStatus {
  return value === 'optimal' || value === 'warning' || value === 'critical';
}

export function isPriority(value: string): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

export function isPriorityValue(value: number): value is PriorityValue {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function isClassificationLevel(value: string): value is ClassificationLevel {
  return ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].includes(value);
}

export function isMatchStatus(value: string): value is MatchStatus {
  return value === 'baseline' || value === 'suboptimal' || value === 'unmatched';
}

export function isCollectionType(value: string): value is CollectionType {
  return value === 'optical' || value === 'wideband' || value === 'narrowband';
}

export function isPassQuality(value: number): value is PassQuality {
  return [1, 2, 3, 4, 5].includes(value);
}

export function isPassPriority(value: string): value is PassPriority {
  return value === 'normal' || value === 'high' || value === 'critical';
}

export function isHealthStatus(value: string): value is HealthStatus {
  return ['excellent', 'good', 'fair', 'poor'].includes(value);
}

// Validation utilities
export function validateSatellite(satellite: Satellite): void {
  if (satellite.capacity <= 0) {
    throw new RangeError('Satellite capacity must be greater than 0');
  }
  if (satellite.currentLoad < 0) {
    throw new RangeError('Satellite current load cannot be negative');
  }
  if (satellite.currentLoad > satellite.capacity) {
    throw new RangeError('Satellite current load cannot exceed capacity');
  }
}

export function validateSite(site: Site): void {
  if (site.capacity <= 0) {
    throw new RangeError('Site capacity must be greater than 0');
  }
  if (site.allocated < 0) {
    throw new RangeError('Site allocated cannot be negative');
  }
  if (site.allocated > site.capacity) {
    throw new RangeError('Site allocated cannot exceed capacity');
  }
}

export function validatePass(pass: Pass): void {
  if (pass.startTime >= pass.endTime) {
    throw new RangeError('Pass start time must be before end time');
  }
  if (pass.elevation !== undefined && (pass.elevation < 0 || pass.elevation > 90)) {
    throw new RangeError('Pass elevation must be between 0 and 90 degrees');
  }
}

// Priority mapping utility
export function priorityToValue(priority: Priority): PriorityValue {
  const map: Record<Priority, PriorityValue> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  return map[priority];
}

export function valueToPriority(value: PriorityValue): Priority {
  const map: Record<PriorityValue, Priority> = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical'
  };
  return map[value];
}

// ============================================================================
// Phase 1: Override Workflow Enhancement (Story 1.2 & 1.3)
// Evidence-validated implementation based on live application testing
// ============================================================================

/**
 * Override Justification Categories
 * Validated through round table discussion and live Playwright testing
 *
 * Evidence: No justification mechanism exists in current application (0 inputs detected)
 * Priority: HIGH - Critical communication gap causing operator confusion
 * Implementation: Phase 1 (Weeks 1-2)
 */
export type OverrideJustificationCategory =
  | 'weather_environmental'    // Weather/environmental constraints at recommended site
  | 'equipment_limitations'    // Equipment or technical limitations
  | 'operational_priority'     // Operational or mission priority changes
  | 'schedule_optimization'    // Schedule coordination or optimization
  | 'customer_request'         // Direct customer or stakeholder request
  | 'other';                   // Escape hatch with required explanation

export interface OverrideJustification {
  readonly category: OverrideJustificationCategory;
  readonly reason: string; // Required, minimum 50 characters for specificity
  readonly alternativeSiteId: SiteId;
  readonly originalSiteId: SiteId;
  readonly timestamp: ISODateString;
  readonly userId: string;
  readonly userName?: string;
  readonly additionalContext?: string; // Optional amplifying information
}

/**
 * Override Export Indicator (Story 1.3)
 * High-visibility indicator for operator awareness in exported tasking
 */
export interface OverrideExportIndicator {
  readonly isOverride: boolean;
  readonly justification?: OverrideJustification;
  readonly visualPriority: 'high' | 'medium' | 'low'; // Controls indicator prominence
  readonly operatorAlert: string; // Brief summary for immediate context
}

/**
 * Enhanced CollectionOpportunity with Override Support
 * Extends base type with override-specific fields
 */
export interface CollectionOpportunityWithOverride extends CollectionOpportunity {
  readonly overrideJustification?: OverrideJustification;
  readonly isOverridden: boolean;
  readonly overrideExportIndicator?: OverrideExportIndicator;
}

// Validation utilities for override workflow

/**
 * Validates override justification meets minimum requirements
 * Based on PM recommendation: Character minimum (50 chars) to force specificity
 */
export function validateOverrideJustification(justification: Partial<OverrideJustification>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Category is required
  if (!justification.category) {
    errors.push('Override category is required');
  }

  // Reason is required with minimum length
  if (!justification.reason || justification.reason.trim().length === 0) {
    errors.push('Override reason is required');
  } else if (justification.reason.trim().length < 50) {
    errors.push('Override reason must be at least 50 characters (current: ' + justification.reason.trim().length + ')');
  }

  // If category is "other", additional context is strongly recommended
  if (justification.category === 'other' && (!justification.additionalContext || justification.additionalContext.trim().length === 0)) {
    errors.push('Additional context is required when selecting "Other" category');
  }

  // Site IDs are required
  if (!justification.alternativeSiteId) {
    errors.push('Alternative site selection is required');
  }

  if (!justification.originalSiteId) {
    errors.push('Original site reference is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates human-readable override reason from category
 * Used for export operator alerts
 */
export function getOverrideCategoryLabel(category: OverrideJustificationCategory): string {
  const labels: Record<OverrideJustificationCategory, string> = {
    weather_environmental: 'Weather/Environmental Constraints',
    equipment_limitations: 'Equipment Limitations',
    operational_priority: 'Operational Priority',
    schedule_optimization: 'Schedule Optimization',
    customer_request: 'Customer Request',
    other: 'Other (See Details)'
  };
  return labels[category];
}

/**
 * Generates operator-facing alert text for exports (Story 1.3)
 * Concise summary for immediate operator understanding
 */
export function generateOperatorAlert(justification: OverrideJustification): string {
  const categoryLabel = getOverrideCategoryLabel(justification.category);
  const reasonPreview = justification.reason.substring(0, 100) + (justification.reason.length > 100 ? '...' : '');

  return `OVERRIDE: ${categoryLabel} - ${reasonPreview}`;
}

/**
 * Creates an export indicator for override visualization
 * Used by OverrideExportBadge component to display override information
 */
export function createExportIndicator(justification: OverrideJustification): OverrideExportIndicator {
  // Determine visual priority based on category
  const highPriorityCategories: OverrideJustificationCategory[] = [
    'weather_environmental',
    'equipment_limitations',
    'operational_priority'
  ];

  const visualPriority: 'high' | 'medium' | 'low' =
    highPriorityCategories.includes(justification.category) ? 'high' : 'medium';

  return {
    isOverride: true,
    justification,
    visualPriority,
    operatorAlert: generateOperatorAlert(justification)
  };
}

/**
 * Type guard for override justification category
 */
export function isOverrideJustificationCategory(value: string): value is OverrideJustificationCategory {
  return [
    'weather_environmental',
    'equipment_limitations',
    'operational_priority',
    'schedule_optimization',
    'customer_request',
    'other'
  ].includes(value);
}