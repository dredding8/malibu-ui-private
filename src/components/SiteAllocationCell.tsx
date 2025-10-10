/**
 * SiteAllocationCell Component
 *
 * Blueprint-aligned component for displaying site allocation information in table cells.
 * Follows Palantir Foundry Workshop patterns and enterprise data table standards.
 *
 * Features:
 * - Displays up to 3 sites with collect counts
 * - Progressive disclosure for overflow ("+X more")
 * - Override indicators for manual adjustments
 * - Full Blueprint JS integration (Tag, Tooltip, Icon)
 * - WCAG AA accessibility compliance
 * - Workshop-compliant CSS (no inline styles)
 */

import React, { useMemo } from 'react';
import { Cell } from '@blueprintjs/table';
import { Tag, Tooltip, Intent, Icon, Position } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import type { Site, CollectionOpportunity } from '../types/collectionOpportunities';
import './SiteAllocationCell.css';

export interface SiteAllocationCellProps {
  /** Array of allocated sites for this opportunity */
  allocatedSites: ReadonlyArray<Site>;
  /** Total number of items (SCC) across all sites */
  totalCollects?: number;
  /** Whether this row has manual overrides applied */
  hasOverride?: boolean;
  /** Override justification text (optional) */
  overrideJustification?: string;
  /** Maximum number of sites to display before showing "+X more" */
  maxVisible?: number;
  /** Show warning if allocation count exceeds threshold */
  warningThreshold?: number;
}

/**
 * Renders a single site entry with name and collect count
 */
const SiteEntry: React.FC<{
  site: Site;
  collectCount: number;
}> = ({ site, collectCount }) => {
  const tooltipContent = useMemo(() => (
    <div className="site-entry-tooltip">
      <div className="site-entry-tooltip__name">{site.name}</div>
      <div className="site-entry-tooltip__stats">
        <span>{collectCount} collected</span>
        <span className="site-entry-tooltip__divider">•</span>
        <span>{site.allocated}/{site.capacity} capacity</span>
      </div>
      {site.operationalDays && site.operationalDays.length > 0 && (
        <div className="site-entry-tooltip__days">
          Operational: {site.operationalDays.join(', ')}
        </div>
      )}
    </div>
  ), [site, collectCount]);

  return (
    <Tooltip
      content={tooltipContent}
      position={Position.TOP}
      hoverOpenDelay={300}
      compact
    >
      <Tag
        minimal
        intent={Intent.PRIMARY}
        className="site-allocation-tag"
        aria-label={`${site.name}: ${collectCount} items collected`}
      >
        <span className="site-allocation-tag__name">{site.name}</span>
        <span className="site-allocation-tag__count">({collectCount})</span>
      </Tag>
    </Tooltip>
  );
};

/**
 * Site Allocation Cell Content Component
 *
 * Workshop-compliant table cell content following Blueprint patterns.
 * NOTE: This returns JSX content WITHOUT Cell wrapper - the wrapper is added by the renderer.
 */
export const SiteAllocationCell: React.FC<SiteAllocationCellProps> = ({
  allocatedSites = [], // Defensive: Default to empty array if undefined
  totalCollects = 0,
  hasOverride = false,
  overrideJustification,
  maxVisible = 3,
  warningThreshold = 5,
}) => {
  // Calculate collect count per site
  // Note: Currently distributing evenly as per-site collect data not in type system
  const collectPerSite = useMemo(() => {
    if (allocatedSites.length === 0) return 0;
    return Math.floor(totalCollects / allocatedSites.length);
  }, [allocatedSites, totalCollects]);

  // Split visible and overflow sites
  const visibleSites = useMemo(() =>
    allocatedSites.slice(0, maxVisible),
    [allocatedSites, maxVisible]
  );

  const overflowSites = useMemo(() =>
    allocatedSites.slice(maxVisible),
    [allocatedSites, maxVisible]
  );

  const hasOverflow = overflowSites.length > 0;
  const isHighAllocation = allocatedSites.length > warningThreshold;

  // Tooltip content for overflow sites
  const overflowTooltipContent = useMemo(() => (
    <div className="site-allocation-overflow-tooltip">
      <div className="site-allocation-overflow-tooltip__header">
        <strong>All Allocated Sites ({allocatedSites.length})</strong>
      </div>
      <ul className="site-allocation-overflow-tooltip__list">
        {allocatedSites.map((site, idx) => (
          <li key={site.id || idx}>
            <Icon icon={IconNames.DOT} size={8} />
            <span className="overflow-site-name">{site.name}</span>
            <span className="overflow-site-count">({collectPerSite})</span>
          </li>
        ))}
      </ul>
      {totalCollects > 0 && (
        <div className="site-allocation-overflow-tooltip__total">
          Total: {totalCollects} items across {allocatedSites.length} sites
        </div>
      )}
    </div>
  ), [allocatedSites, collectPerSite, totalCollects]);

  // Override tooltip content
  const overrideTooltipContent = useMemo(() => (
    <div className="site-allocation-override-tooltip">
      <div className="site-allocation-override-tooltip__title">
        <Icon icon={IconNames.WARNING_SIGN} size={12} />
        <strong>Manual Override Applied</strong>
      </div>
      {overrideJustification && (
        <div className="site-allocation-override-tooltip__reason">
          {overrideJustification}
        </div>
      )}
    </div>
  ), [overrideJustification]);

  // Empty state
  if (allocatedSites.length === 0) {
    return (
      <span className="site-allocation-empty" aria-label="No sites allocated">
        -
      </span>
    );
  }

  return (
    <div
      className="site-allocation-content"
      aria-label={`${allocatedSites.length} sites allocated, ${totalCollects} total items${hasOverride ? ', with manual overrides' : ''}`}
    >
      {/* Display visible sites */}
      <div className="site-allocation-tags" role="list">
        {visibleSites.map((site, idx) => (
          <div key={site.id || idx} role="listitem">
            <SiteEntry site={site} collectCount={collectPerSite} />
          </div>
        ))}
      </div>

      {/* Overflow indicator */}
      {hasOverflow && (
        <Tooltip
          content={overflowTooltipContent}
          position={Position.BOTTOM_LEFT}
          hoverOpenDelay={200}
        >
          <Tag
            minimal
            intent={Intent.NONE}
            className="site-allocation-overflow"
            role="button"
            tabIndex={0}
            aria-label={`View ${overflowSites.length} additional sites`}
          >
            +{overflowSites.length} more
          </Tag>
        </Tooltip>
      )}

      {/* Override indicator */}
      {hasOverride && (
        <Tooltip
          content={overrideTooltipContent}
          position={Position.BOTTOM}
          intent={Intent.WARNING}
          hoverOpenDelay={200}
        >
          <Icon
            icon={IconNames.WARNING_SIGN}
            intent={Intent.WARNING}
            size={14}
            className="site-allocation-override-icon"
            aria-label="Manual override applied"
          />
        </Tooltip>
      )}

      {/* High allocation warning */}
      {isHighAllocation && !hasOverride && (
        <Tooltip
          content={`High allocation count: ${allocatedSites.length} sites`}
          intent={Intent.WARNING}
          position={Position.BOTTOM}
        >
          <Icon
            icon={IconNames.INFO_SIGN}
            intent={Intent.WARNING}
            size={12}
            className="site-allocation-warning-icon"
            aria-label={`High allocation: ${allocatedSites.length} sites`}
          />
        </Tooltip>
      )}
    </div>
  );
};

/**
 * Functional cell renderer for Blueprint Table
 *
 * @param opportunities - Array of collection opportunities
 * @param maxVisible - Maximum sites to show before "+X more"
 * @returns Cell renderer function compatible with Blueprint Table Column
 *
 * NOTE: This renderer wraps the SiteAllocationCell content in a <Cell> component,
 * matching the pattern of all other cell renderers in the table.
 */
export const createSiteAllocationCellRenderer = (
  opportunities: ReadonlyArray<CollectionOpportunity>,
  maxVisible: number = 3
) => {
  return (rowIndex: number) => {
    const opportunity = opportunities[rowIndex];

    if (!opportunity) {
      return (
        <Cell className="site-allocation-cell">
          <span className="site-allocation-empty">-</span>
        </Cell>
      );
    }

    return (
      <Cell className="site-allocation-cell">
        <SiteAllocationCell
          allocatedSites={opportunity.allocatedSites}
          totalCollects={opportunity.sccNumber || opportunity.totalPasses}
          hasOverride={!!opportunity.changeJustification}
          overrideJustification={opportunity.changeJustification}
          maxVisible={maxVisible}
        />
      </Cell>
    );
  };
};

export default SiteAllocationCell;
