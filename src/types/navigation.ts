/**
 * Navigation Type Definitions
 * Consolidated data models with clear domain separation
 */

import { Intent } from '@blueprintjs/core';

// ============= Field Mapping Domain =============
export namespace FieldMapping {
  export interface Result {
    id: string;
    sourceField: string;
    targetField: string;
    confidence: ConfidenceLevel;
    matchType: MatchType;
    status: MappingStatus;
    sensorType?: string;
    calculatedCapacity?: number;
    lastModified: Date;
    notes?: string;
    category?: string;
    dataType?: string;
    validationErrors?: string[];
    usage?: UsageFrequency;
  }

  export type ConfidenceLevel = 'high' | 'medium' | 'low';
  export type MatchType = 'exact' | 'fuzzy' | 'semantic' | 'manual';
  export type MappingStatus = 'approved' | 'rejected' | 'pending' | 'modified';
  export type UsageFrequency = 'frequent' | 'occasional' | 'rare';

  export interface MappingMetadata {
    createdAt: Date;
    createdBy: string;
    modifiedAt?: Date;
    modifiedBy?: string;
    validationScore?: number;
  }
}

// ============= Collection Opportunity Domain =============
export namespace CollectionOpportunity {
  export interface Opportunity {
    id: string;
    sccNumber: string;
    satelliteInfo: SatelliteInfo;
    collectionDetails: CollectionDetails;
    allocation: AllocationInfo;
    status: OpportunityStatus;
    selected: boolean;
    needsReview: boolean;
    notes?: string;
  }

  export interface SatelliteInfo {
    priority: number;
    function: SatelliteFunction;
    orbit: OrbitType;
    periodicity: number;
  }

  export interface CollectionDetails {
    collectionType: CollectionType;
    classification: Classification;
    match: MatchQuality;
    matchNotes?: string;
  }

  export interface AllocationInfo {
    siteAllocation: string[];
    capacityUsage?: number;
    conflictingRequests?: string[];
  }

  export type SatelliteFunction = 'ISR' | 'Counterspace' | 'Communications' | 'Navigation';
  export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO';
  export type CollectionType = 'Wideband' | 'Narrowband' | 'Optical' | 'Imagery' | 'Signals';
  export type Classification = 'S//REL FVEY' | 'S//NF' | 'S//SI' | 'TS//SI//TK//NF';
  export type MatchQuality = 'Optimal' | 'Baseline' | 'No matches';
  export type OpportunityStatus = 'available' | 'selected' | 'excluded' | 'conflicted';
}

// ============= Navigation Context =============
export namespace NavigationContext {
  export interface BreadcrumbItem {
    text: string;
    href?: string;
    icon?: string;
    current?: boolean;
    onClick?: () => void;
  }

  export interface PageContext {
    domain: 'fieldMapping' | 'collectionOpportunity' | 'history' | 'creation';
    title: string;
    subtitle?: string;
    icon: string;
    intent?: Intent;
    breadcrumbs: BreadcrumbItem[];
  }

  export interface NavigationState {
    currentContext: PageContext;
    previousContext?: PageContext;
    canNavigateAway: boolean;
    hasUnsavedChanges: boolean;
  }
}

// ============= Shared Review Component Types =============
export namespace ReviewComponent {
  export interface Configuration<T> {
    mode: 'fieldMapping' | 'collectionOpportunity';
    viewType: 'editable' | 'readonly';
    columns: ColumnDefinition[];
    actions: ActionDefinition[];
    filters: FilterDefinition[];
    theme: ThemeConfiguration;
    contextHelp: ContextHelpConfiguration;
  }

  export interface ColumnDefinition {
    key: string;
    label: string;
    icon?: string;
    type?: 'text' | 'number' | 'badge' | 'tag' | 'multi-tag' | 'metric';
    sortable?: boolean;
    width?: number;
    cellRenderer?: (value: any, row: any) => React.ReactNode;
  }

  export interface ActionDefinition {
    id: string;
    label: string;
    icon?: string;
    intent?: Intent;
    requiresSelection?: boolean;
    confirmRequired?: boolean;
    handler: (selection: Set<string>) => void | Promise<void>;
  }

  export interface FilterDefinition {
    key: string;
    label: string;
    type: 'text' | 'select' | 'multi-select' | 'range' | 'date';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
    min?: number;
    max?: number;
  }

  export interface ThemeConfiguration {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    surfaceColor: string;
    accentColor: string;
    headerIcon: string;
    headerGradient?: string;
  }

  export interface ContextHelpConfiguration {
    title: string;
    content: string;
    learnMoreUrl?: string;
    videoUrl?: string;
    examples?: string[];
  }
}

// ============= Route Configuration =============
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  context: NavigationContext.PageContext['domain'];
  guard?: (location: Location) => boolean;
  loader?: () => Promise<any>;
  children?: RouteConfig[];
}

// ============= Analytics & Metrics =============
export interface NavigationMetrics {
  contextIdentificationRate: number;
  taskCompletionRate: number;
  avgCompletionTime: number; // seconds
  userSatisfaction: number; // 1-5 scale
  errorRate: number;
  supportTickets: number;
}

// ============= Sensor Capacity Configuration =============
export const SENSOR_CAPACITY_CONFIG = {
  wideband: { capacity: 8, unit: 'channels' },
  narrowband: { capacity: 16, unit: 'channels' },
  imagery: { capacity: 4, unit: 'collections' },
  signals: { capacity: 12, unit: 'collections' },
  optical: { capacity: 6, unit: 'collections' }
} as const;