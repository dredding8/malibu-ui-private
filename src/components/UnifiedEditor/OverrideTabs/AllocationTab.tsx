/**
 * Allocation Tab (Override Mode)
 *
 * Handles complex site allocation with table-based interface
 * REDESIGNED: Card-based allocatedSites panel → Blueprint Table2
 *
 * Workshop Compliance: Blueprint v6
 * Redesign Date: 2025-10-14
 */

import React, { useMemo, useState } from 'react';
import './AllocationTab.css';
import {
  Checkbox,
  Tag,
  Intent,
  H6,
  H5,
  Callout,
  Button,
  Tooltip,
  ButtonGroup,
  Popover,
  Menu,
  MenuItem,
  Position,
  Drawer,
  Classes,
  Divider,
  FormGroup,
  Card as BpCard,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Table2, Column, Cell, EditableCell } from '@blueprintjs/table';
import { CollectionOpportunity, Site, Pass } from '../../../types/collectionOpportunities';
import {
  formatDurationThreshold,
  getDurationIntent,
  getPassDuration
} from '../../../utils/durationFormatting';
import { OperationalDaysDetailed, OperationalDaysCompact } from '../../OperationalDaysDisplay';

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
  availableSites,
  availablePasses,
  capacityThresholds,
}) => {
  const { state, setSites } = editor;

  // State for table-based interface
  const [siteCollects, setSiteCollects] = useState<Map<string, number>>(new Map());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // State for side panel (replaces row expansion)
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<Site | null>(null);

  // Calculate pass properties per site
  const sitePassProperties = useMemo(() => {
    const propertiesMap = new Map<string, {
      passCount: number;
      totalDuration: number;
      maxElevation: number;
      minDuration: number;
    }>();

    availablePasses.forEach((pass) => {
      pass.siteCapabilities?.forEach((site) => {
        const existing = propertiesMap.get(site.id) || {
          passCount: 0,
          totalDuration: 0,
          maxElevation: 0,
          minDuration: Infinity,
        };

        const duration = getPassDuration(pass);

        propertiesMap.set(site.id, {
          passCount: existing.passCount + 1,
          totalDuration: existing.totalDuration + duration,
          maxElevation: Math.max(existing.maxElevation, pass.elevation || 0),
          minDuration: Math.min(existing.minDuration, duration),
        });
      });
    });

    return propertiesMap;
  }, [availablePasses]);

  // Get selected sites for allocated sites table
  const selectedSites = availableSites.filter(site =>
    state.selectedSiteIds.includes(site.id)
  );

  // Initialize collects for newly selected sites
  React.useEffect(() => {
    const newCollects = new Map(siteCollects);
    selectedSites.forEach(site => {
      if (!newCollects.has(site.id)) {
        const passProps = sitePassProperties.get(site.id);
        newCollects.set(site.id, passProps?.passCount || 0);
      }
    });
    setSiteCollects(newCollects);
  }, [state.selectedSiteIds, sitePassProperties]);

  // Handlers
  const handleSiteToggle = (siteId: string) => {
    const newSelection = state.selectedSiteIds.includes(siteId)
      ? state.selectedSiteIds.filter((id: string) => id !== siteId)
      : [...state.selectedSiteIds, siteId];
    setSites(newSelection);
  };

  const handleCollectsChange = (siteId: string, value: number) => {
    const site = availableSites.find(s => s.id === siteId);
    if (!site) return;

    const maxCollects = site.capacity - site.allocated;

    if (value < 0) {
      setValidationErrors(prev => new Map(prev).set(siteId, 'Value cannot be negative'));
      return;
    }

    if (value > maxCollects) {
      setValidationErrors(prev =>
        new Map(prev).set(siteId, `Exceeds site capacity (max: ${maxCollects})`)
      );
      return;
    }

    // Valid value
    setSiteCollects(prev => new Map(prev).set(siteId, value));
    setValidationErrors(prev => {
      const next = new Map(prev);
      next.delete(siteId);
      return next;
    });
  };

  const openDetailsPanel = (site: Site) => {
    setSelectedSiteForDetails(site);
    setDetailsPanelOpen(true);
  };

  const closeDetailsPanel = () => {
    setDetailsPanelOpen(false);
    // Delay clearing selected site for smooth close animation
    setTimeout(() => setSelectedSiteForDetails(null), 300);
  };

  const handleRemoveSite = (siteId: string) => {
    const collects = siteCollects.get(siteId) || 0;

    // If site has configured collects, show confirmation
    if (collects > 0) {
      const confirmed = window.confirm(
        `This site has ${collects} collect(s) configured. Remove anyway?`
      );
      if (!confirmed) return;
    }

    // Remove from selection
    const newSelection = state.selectedSiteIds.filter((id: string) => id !== siteId);
    setSites(newSelection);

    // Clean up state
    setSiteCollects(prev => {
      const next = new Map(prev);
      next.delete(siteId);
      return next;
    });
    setValidationErrors(prev => {
      const next = new Map(prev);
      next.delete(siteId);
      return next;
    });

    // Close details panel if this site was being viewed
    if (selectedSiteForDetails?.id === siteId) {
      closeDetailsPanel();
    }
  };

  const resetCollects = (siteId: string) => {
    setSiteCollects(prev => new Map(prev).set(siteId, 0));
    setValidationErrors(prev => {
      const next = new Map(prev);
      next.delete(siteId);
      return next;
    });
  };

  // Cell renderers for Available Passes Table
  const renderSelectionCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    const isSelected = state.selectedSiteIds.includes(site.id);

    return (
      <Cell>
        <Checkbox
          checked={isSelected}
          onChange={() => handleSiteToggle(site.id)}
        />
      </Cell>
    );
  };

  const renderSiteNameCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    return (
      <Cell>
        <div className="site-name-cell">
          <span className="site-name-cell__text">{site.name}</span>
        </div>
      </Cell>
    );
  };

  const renderLocationCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    return (
      <Cell>
        {site.location.lat.toFixed(2)}, {site.location.lon.toFixed(2)}
      </Cell>
    );
  };

  const renderPassesCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return <Cell>{passProps?.passCount || 0}</Cell>;
  };

  const renderDurationCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return (
      <Cell>
        {passProps && (
          <div className="duration-cell">
            <div className="duration-cell__total">{passProps.totalDuration}m</div>
            <Tag
              minimal
              intent={getDurationIntent(passProps.minDuration)}
              className="duration-cell__min"
            >
              {formatDurationThreshold(passProps.minDuration)}
            </Tag>
          </div>
        )}
      </Cell>
    );
  };

  const renderElevationCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return <Cell>{passProps && `${passProps.maxElevation}°`}</Cell>;
  };

  const renderCapacityCell = (rowIndex: number): JSX.Element => {
    const site = availableSites[rowIndex];
    const remaining = site.capacity - site.allocated;
    const utilizationPercent = (site.allocated / site.capacity) * 100;

    const statusIntent =
      remaining === 0 ? Intent.DANGER :
      utilizationPercent >= capacityThresholds.critical ? Intent.DANGER :
      utilizationPercent >= capacityThresholds.warning ? Intent.WARNING :
      Intent.SUCCESS;

    return (
      <Cell>
        <div className="capacity-display">
          <div className="capacity-display__available">
            {remaining === 0 ? 'Full' : `${remaining} available`}
          </div>
          <div className="capacity-display__allocated">
            {site.allocated}/{site.capacity}
            <Tag minimal intent={statusIntent} className="capacity-status" />
          </div>
        </div>
      </Cell>
    );
  };

  // Cell renderers for Allocated Sites Table
  const renderAllocatedSiteNameCell = (rowIndex: number): JSX.Element => {
    const site = selectedSites[rowIndex];
    const isSelected = selectedSiteForDetails?.id === site.id;

    return (
      <Cell>
        <div className="site-name-cell">
          <span className={`site-name-cell__text ${isSelected ? 'site-name-cell__text--selected' : ''}`}>
            {site.name}
          </span>
        </div>
      </Cell>
    );
  };

  const renderCollectsEditableCell = (rowIndex: number): JSX.Element => {
    const site = selectedSites[rowIndex];
    const collects = siteCollects.get(site.id) || 0;
    const error = validationErrors.get(site.id);

    return (
      <EditableCell
        value={collects.toString()}
        onConfirm={(value) => handleCollectsChange(site.id, parseInt(value, 10) || 0)}
        onCancel={() => {}}
        intent={error ? Intent.DANGER : Intent.NONE}
      />
    );
  };

  const renderOperationalDaysCell = (rowIndex: number): JSX.Element => {
    const site = selectedSites[rowIndex];

    return (
      <Cell>
        <Tooltip
          content={
            <div>
              <OperationalDaysDetailed operationalDays={site.operationalDays} />
              {site.operationalHours && (
                <div style={{ marginTop: '4px', fontSize: '11px' }}>
                  Hours: {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
                </div>
              )}
            </div>
          }
          position={Position.TOP}
        >
          <div className="operational-days-cell">
            <OperationalDaysCompact operationalDays={site.operationalDays} />
          </div>
        </Tooltip>
      </Cell>
    );
  };

  const renderOperationsCell = (rowIndex: number): JSX.Element => {
    const site = selectedSites[rowIndex];
    const isViewing = selectedSiteForDetails?.id === site.id;

    return (
      <Cell className="operations-cell">
        <ButtonGroup>
          <Tooltip content="View Details">
            <Button
              icon={IconNames.PANEL_STATS}
              onClick={() => openDetailsPanel(site)}
              intent={isViewing ? Intent.PRIMARY : Intent.NONE}
              aria-label="View site details in side panel"
            />
          </Tooltip>
          <Tooltip content="Remove Site">
            <Button
              icon={IconNames.TRASH}
              onClick={() => handleRemoveSite(site.id)}
              intent={Intent.DANGER}
              aria-label="Remove site"
            />
          </Tooltip>
          <Popover
            content={
              <Menu>
                <MenuItem
                  icon={IconNames.RESET}
                  text="Reset Collects"
                  onClick={() => resetCollects(site.id)}
                />
              </Menu>
            }
            position={Position.BOTTOM_LEFT}
          >
            <Button icon={IconNames.MORE} aria-label="More options" />
          </Popover>
        </ButtonGroup>
      </Cell>
    );
  };

  // Get passes for selected site (used in details panel)
  const getPassesForSite = (siteId: string) => {
    const collects = siteCollects.get(siteId) || 0;
    return availablePasses
      .filter(pass => pass.siteCapabilities?.some(s => s.id === siteId))
      .slice(0, collects);
  };

  return (
    <div className="allocation-tab">
      {/* LEFT PANEL: Available Passes Table */}
      <div className="allocation-tab__left-panel">
        <H6>Available Passes</H6>
        <p className="allocation-tab__description">
          Select sites to add to allocation. Pass properties help inform your decision.
        </p>

        <Table2
          numRows={availableSites.length}
          enableRowHeader={false}
          enableColumnReordering={false}
          className="available-passes-table"
        >
          <Column name="Select" cellRenderer={renderSelectionCell} />
          <Column name="Site Name" cellRenderer={renderSiteNameCell} />
          <Column name="Location" cellRenderer={renderLocationCell} />
          <Column name="Passes" cellRenderer={renderPassesCell} />
          <Column name="Duration" cellRenderer={renderDurationCell} />
          <Column name="Elevation" cellRenderer={renderElevationCell} />
          <Column name="Capacity" cellRenderer={renderCapacityCell} />
        </Table2>

        {/* Validation Errors */}
        {state.validationErrors.has('sites') && (
          <Callout intent={Intent.DANGER} icon={IconNames.ERROR} style={{ marginTop: '12px' }}>
            {state.validationErrors.get('sites')}
          </Callout>
        )}
      </div>

      {/* RIGHT PANEL: Allocated Sites Table */}
      <div className="allocation-tab__right-panel">
        <H6>Allocated Sites</H6>
        <p className="allocation-tab__description">
          Configure pass allocation for selected sites.
        </p>

        {selectedSites.length === 0 ? (
          <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
            No sites selected. Check sites from Available Passes table above.
          </Callout>
        ) : (
          <>
            <Table2
              numRows={selectedSites.length}
              enableRowHeader={false}
              enableColumnReordering={false}
              className="allocated-sites-table"
            >
              <Column name="Site Name" cellRenderer={renderAllocatedSiteNameCell} />
              <Column name="Location" cellRenderer={renderLocationCell} />
              <Column name="Collects" cellRenderer={renderCollectsEditableCell} />
              <Column name="Capacity" cellRenderer={renderCapacityCell} />
              <Column name="Operational Days" cellRenderer={renderOperationalDaysCell} />
              <Column name="Operations" cellRenderer={renderOperationsCell} />
            </Table2>
          </>
        )}
      </div>

      {/* SIDE PANEL: Site Details Drawer */}
      <Drawer
        isOpen={detailsPanelOpen}
        onClose={closeDetailsPanel}
        size="450px"
        position={Position.RIGHT}
        title={selectedSiteForDetails?.name || "Site Details"}
        icon={IconNames.INFO_SIGN}
        className="site-details-drawer"
      >
        {selectedSiteForDetails && (
          <>
            <div className={Classes.DRAWER_BODY}>
              {/* Site Metadata */}
              <div className="site-detail-section">
                <H5>Site Information</H5>
                <Divider />

                <div className="site-detail-field">
                  <span className="site-detail-label">Location:</span>
                  <span className="site-detail-value">
                    {selectedSiteForDetails.location.lat.toFixed(2)}, {selectedSiteForDetails.location.lon.toFixed(2)}
                  </span>
                </div>

                <div className="site-detail-field">
                  <span className="site-detail-label">Capacity:</span>
                  <span className="site-detail-value">
                    {selectedSiteForDetails.allocated}/{selectedSiteForDetails.capacity} allocated
                    {' '}({((selectedSiteForDetails.allocated / selectedSiteForDetails.capacity) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="site-detail-field">
                  <span className="site-detail-label">Configured Collects:</span>
                  <span className="site-detail-value">
                    {siteCollects.get(selectedSiteForDetails.id) || 0}
                  </span>
                </div>
              </div>

              {/* Pass Timestamps */}
              <div className="site-detail-section">
                <H5>Pass Timestamps</H5>
                <Divider />
                <div className="pass-timestamps-list">
                  {getPassesForSite(selectedSiteForDetails.id).length === 0 ? (
                    <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
                      No passes allocated. Configure collects above to allocate passes.
                    </Callout>
                  ) : (
                    getPassesForSite(selectedSiteForDetails.id).map((pass, idx) => (
                      <BpCard key={pass.id} className="pass-timestamp-card" elevation={1}>
                        <div className="pass-card-header">
                          <strong>Pass {idx + 1}</strong>
                        </div>
                        <div className="pass-card-body">
                          <div className="pass-timestamp">
                            <span className="pass-timestamp-label">Start:</span>
                            <span className="pass-timestamp-value">{pass.startTime.toLocaleString()}</span>
                          </div>
                          <div className="pass-timestamp">
                            <span className="pass-timestamp-label">End:</span>
                            <span className="pass-timestamp-value">{pass.endTime.toLocaleString()}</span>
                          </div>
                          <div className="pass-timestamp">
                            <span className="pass-timestamp-label">Duration:</span>
                            <span className="pass-timestamp-value">
                              {getPassDuration(pass)}m
                              <Tag
                                minimal
                                intent={getDurationIntent(getPassDuration(pass))}
                                style={{ marginLeft: '8px' }}
                              >
                                {formatDurationThreshold(getPassDuration(pass))}
                              </Tag>
                            </span>
                          </div>
                          {pass.elevation && (
                            <div className="pass-timestamp">
                              <span className="pass-timestamp-label">Elevation:</span>
                              <span className="pass-timestamp-value">{pass.elevation}°</span>
                            </div>
                          )}
                        </div>
                      </BpCard>
                    ))
                  )}
                </div>
              </div>

              {/* Operational Constraints */}
              <div className="site-detail-section">
                <H5>Operational Constraints</H5>
                <Divider />

                <FormGroup label="Operational Days">
                  <OperationalDaysDetailed operationalDays={selectedSiteForDetails.operationalDays} />
                </FormGroup>

                {selectedSiteForDetails.operationalHours && (
                  <FormGroup label="Operational Hours">
                    <div className="operational-hours-display">
                      {selectedSiteForDetails.operationalHours.start} - {selectedSiteForDetails.operationalHours.end}
                      <Tag minimal style={{ marginLeft: '8px' }}>
                        {selectedSiteForDetails.operationalHours.timezone}
                      </Tag>
                    </div>
                  </FormGroup>
                )}
              </div>
            </div>

            <div className={Classes.DRAWER_FOOTER}>
              <ButtonGroup fill>
                <Button
                  icon={IconNames.RESET}
                  onClick={() => resetCollects(selectedSiteForDetails.id)}
                  intent={Intent.NONE}
                >
                  Reset Collects
                </Button>
                <Button
                  icon={IconNames.TRASH}
                  onClick={() => handleRemoveSite(selectedSiteForDetails.id)}
                  intent={Intent.DANGER}
                >
                  Remove Site
                </Button>
              </ButtonGroup>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};
