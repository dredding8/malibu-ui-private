/**
 * Allocation Tab (Override Mode)
 *
 * Handles complex site allocation with multi-select and batch operations
 *
 * Workshop Compliance: Blueprint v6
 * MCP Validated: 2025-10-07
 */

import React, { useMemo, useState } from 'react';
import './AllocationTab.css';
import {
  FormGroup,
  Checkbox,
  Tag,
  Intent,
  Card,
  H6,
  Callout,
  HTMLSelect,
  NumericInput,
  Button,
  Collapse,
  HTMLTable,
  Tooltip,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity, Site, Pass } from '../../../types/collectionOpportunities';
import {
  formatDurationThreshold,
  getDurationIntent,
  getPassDuration
} from '../../../utils/durationFormatting';
import { getSiteOperationalDescription } from '../../../utils/siteOperationalHelpers';
import { OperationalDaysCompact, OperationalDaysDetailed } from '../../OperationalDaysDisplay';

interface AllocationTabProps {
  editor: any;
  opportunity: CollectionOpportunity;
  availableSites: Site[];
  availablePasses: Pass[];
  capacityThresholds: {
    critical: number;
    warning: number;
    optimal: number;
  };
  enableBatchOperations: boolean;
}

export const AllocationTab: React.FC<AllocationTabProps> = ({
  editor,
  opportunity,
  availableSites,
  availablePasses,
  capacityThresholds,
  enableBatchOperations,
}) => {
  const { state, setSites } = editor;

  // State for allocated sites configuration (Legacy Step 2.3 - Allocated Sites Panel)
  const [siteConfigs, setSiteConfigs] = useState<Map<string, {
    collects: number;
    expanded: boolean;
  }>>(new Map());

  // Calculate pass properties per site (Legacy Step 2.2 - Available Passes Panel)
  const sitePassProperties = useMemo(() => {
    const propertiesMap = new Map<string, {
      passCount: number;
      totalDuration: number;
      maxQuality: number;
      maxElevation: number;
      minDuration: number;
    }>();

    availablePasses.forEach((pass) => {
      pass.siteCapabilities?.forEach((site) => {
        const existing = propertiesMap.get(site.id) || {
          passCount: 0,
          totalDuration: 0,
          maxQuality: 0,
          maxElevation: 0,
          minDuration: Infinity,
        };

        const duration = getPassDuration(pass.startTime, pass.endTime);

        propertiesMap.set(site.id, {
          passCount: existing.passCount + 1,
          totalDuration: existing.totalDuration + duration,
          maxQuality: Math.max(existing.maxQuality, pass.quality),
          maxElevation: Math.max(existing.maxElevation, pass.elevation || 0),
          minDuration: Math.min(existing.minDuration, duration),
        });
      });
    });

    return propertiesMap;
  }, [availablePasses]);

  const handleSiteToggle = (siteId: string) => {
    const newSelection = state.selectedSiteIds.includes(siteId)
      ? state.selectedSiteIds.filter((id: string) => id !== siteId)
      : [...state.selectedSiteIds, siteId];
    setSites(newSelection);
  };

  //Get selected sites for allocated sites panel
  const selectedSites = availableSites.filter(site =>
    state.selectedSiteIds.includes(site.id)
  );

  // Initialize config for newly selected sites
  React.useEffect(() => {
    const newConfigs = new Map(siteConfigs);
    selectedSites.forEach(site => {
      if (!newConfigs.has(site.id)) {
        const passProps = sitePassProperties.get(site.id);
        newConfigs.set(site.id, {
          collects: passProps?.passCount || 0,
          expanded: false,
        });
      }
    });
    setSiteConfigs(newConfigs);
  }, [state.selectedSiteIds]);

  return (
    <div className="allocation-tab">
      {/* LEFT PANEL: Available Passes (Legacy Step 2.2) */}
      <div className="allocation-tab__left-panel">
        <H6>Available Passes</H6>
        <p className="allocation-tab__description">
          Select sites to add to allocation. Pass properties help inform your decision.
        </p>

        <HTMLTable
          interactive
          striped
          bordered
          className="allocation-tab__sites-table"
        >
          <thead>
            <tr>
              <th className="sites-table__col-select">Select</th>
              <th className="sites-table__col-site">Site Name</th>
              <th className="sites-table__col-location">Location</th>
              <th className="sites-table__col-quality">Quality</th>
              <th className="sites-table__col-passes">Passes</th>
              <th className="sites-table__col-duration">Duration</th>
              <th className="sites-table__col-elevation">Elevation</th>
              <th className="sites-table__col-capacity">Capacity</th>
            </tr>
          </thead>
          <tbody>
            {availableSites.map((site) => {
              const isSelected = state.selectedSiteIds.includes(site.id);
              const remaining = site.capacity - site.allocated;
              const utilizationPercent = (site.allocated / site.capacity) * 100;

              const statusIntent =
                remaining === 0 ? 'critical' :
                utilizationPercent >= capacityThresholds.critical ? 'danger' :
                utilizationPercent >= capacityThresholds.warning ? 'warning' :
                'success';

              const passProps = sitePassProperties.get(site.id);

              return (
                <tr
                  key={site.id}
                  className={isSelected ? 'sites-table__row--selected' : ''}
                  onClick={() => handleSiteToggle(site.id)}
                >
                  <td className="sites-table__cell-select">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSiteToggle(site.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="sites-table__cell-site">
                    <div className="sites-table__site-name">{site.name}</div>
                  </td>
                  <td className="sites-table__cell-location">
                    {site.location.lat.toFixed(2)}, {site.location.lon.toFixed(2)}
                  </td>
                  <td className="sites-table__cell-quality">
                    {passProps && (
                      <Tag minimal intent={passProps.maxQuality >= 4 ? Intent.SUCCESS : Intent.WARNING}>
                        {passProps.maxQuality}/5
                      </Tag>
                    )}
                  </td>
                  <td className="sites-table__cell-passes">
                    {passProps?.passCount || 0}
                  </td>
                  <td className="sites-table__cell-duration">
                    {passProps && (
                      <div className="sites-table__duration-group">
                        <div className="sites-table__total-duration">
                          {passProps.totalDuration}m
                        </div>
                        <Tag
                          minimal
                          intent={getDurationIntent(passProps.minDuration)}
                          className="sites-table__min-duration"
                        >
                          {formatDurationThreshold(passProps.minDuration)}
                        </Tag>
                      </div>
                    )}
                  </td>
                  <td className="sites-table__cell-elevation">
                    {passProps && `${passProps.maxElevation}°`}
                  </td>
                  <td className="sites-table__cell-capacity">
                    <div className="capacity-display">
                      <div className="capacity-display__available">
                        {remaining === 0 ? 'Full' : `${remaining} available`}
                      </div>
                      <div className="capacity-display__allocated">
                        {site.allocated}/{site.capacity}
                        <span className={`capacity-status capacity-status--${statusIntent}`} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </HTMLTable>

        {/* Validation Errors */}
        {state.validationErrors.has('sites') && (
          <Callout intent={Intent.DANGER} icon={IconNames.ERROR} style={{ marginTop: '12px' }}>
            {state.validationErrors.get('sites')}
          </Callout>
        )}
      </div>

      {/* RIGHT PANEL: Allocated Sites (Legacy Step 2.3) */}
      <div className="allocation-tab__right-panel">
        <H6>Allocated Sites</H6>
        <p className="allocation-tab__description">
          Configure pass allocation for selected sites.
        </p>

        {selectedSites.length === 0 ? (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
            Select sites from the left panel to configure allocation.
          </Callout>
        ) : (
          <div className="allocation-tab__config-list">
            {selectedSites.map(site => {
              const config = siteConfigs.get(site.id);
              const passProps = sitePassProperties.get(site.id);

              if (!config || !passProps) return null;

              return (
                <Card key={site.id} elevation={1}>
                  <div className="allocated-site-card__header">
                    <div>
                      <strong>{site.name}</strong>
                      <div className="allocated-site-card__pass-count">
                        {passProps.passCount} passes available
                      </div>
                    </div>
                    <Button
                      minimal
                      small
                      icon={config.expanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT}
                      onClick={() => {
                        const newConfigs = new Map(siteConfigs);
                        newConfigs.set(site.id, { ...config, expanded: !config.expanded });
                        setSiteConfigs(newConfigs);
                      }}
                    />
                  </div>

                  {/* Stepper Controls (Legacy Step 2.3) */}
                  {(() => {
                    // Calculate remaining capacity: site.capacity - site.allocated
                    const remainingCapacity = site.capacity - site.allocated;
                    // Stepper max allows up to total site capacity
                    const maxCollects = site.capacity;
                    // Determine if site is at/over capacity
                    const isOverCapacity = remainingCapacity <= 0;
                    const isNearCapacity = remainingCapacity > 0 && remainingCapacity < passProps.passCount;

                    return (
                      <>
                        {isOverCapacity && (
                          <Callout intent={Intent.DANGER} icon={IconNames.ERROR} style={{ marginBottom: '12px' }}>
                            Site at capacity ({site.allocated}/{site.capacity}). Cannot allocate more passes.
                          </Callout>
                        )}
                        {isNearCapacity && (
                          <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} style={{ marginBottom: '12px' }}>
                            Limited capacity: Only {remainingCapacity} passes available ({site.allocated}/{site.capacity} allocated)
                          </Callout>
                        )}
                        <div className="allocated-site-card__stepper-grid">
                          <FormGroup
                            label="Collects"
                            labelInfo={`(max: ${maxCollects})`}
                            helperText={`Capacity: ${site.allocated}/${site.capacity} allocated`}
                            className="allocated-site-card__form-group"
                          >
                            <NumericInput
                              value={config.collects}
                              min={0}
                              max={maxCollects}
                              disabled={isOverCapacity}
                              onValueChange={(value) => {
                                const newConfigs = new Map(siteConfigs);
                                newConfigs.set(site.id, { ...config, collects: value });
                                setSiteConfigs(newConfigs);
                              }}
                              buttonPosition="right"
                              fill
                            />
                          </FormGroup>

                          {/* Site Operational Constraints (Read-Only) */}
                          <FormGroup
                            label="Site Operations"
                            helperText="Ground station operational days/hours (immutable)"
                            className="allocated-site-card__form-group"
                          >
                            <div className="allocated-site-card__readonly-field">
                              <OperationalDaysDetailed operationalDays={site.operationalDays} />
                              {site.operationalHours && (
                                <div className="allocated-site-card__operational-details">
                                  <strong>Hours:</strong> {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
                                </div>
                              )}
                              <div className="allocated-site-card__immutable-note">
                                Site infrastructure constraint • Cannot be modified
                              </div>
                            </div>
                          </FormGroup>
                        </div>

                        <div className="allocated-site-card__summary">
                          <div>
                            <strong>Allocating:</strong> {config.collects} of {maxCollects} available passes
                          </div>
                          <div>
                            <strong>Total Assigned:</strong> {site.allocated + config.collects} / {site.capacity}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Expandable Pass Timestamps (Legacy Step 2.3) */}
                  <Collapse isOpen={config.expanded}>
                    <div className="allocated-site-card__expandable-section">
                      <div className="allocated-site-card__timestamps-header">
                        Pass Timestamps:
                      </div>
                      <div className="allocated-site-card__timestamps-list">
                        {availablePasses
                          .filter(pass => pass.siteCapabilities?.some(s => s.id === site.id))
                          .slice(0, config.collects)
                          .map((pass, idx) => (
                            <div key={pass.id} className="allocated-site-card__timestamp-item">
                              [{idx + 1}] {new Date(pass.startTime).toLocaleTimeString()} - {new Date(pass.endTime).toLocaleTimeString()}
                            </div>
                          ))}
                      </div>
                    </div>
                  </Collapse>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
