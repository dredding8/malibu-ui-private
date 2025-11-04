/**
 * Allocation Tab (Override Mode)
 *
 * Handles complex site allocation with table-based interface
 * REDESIGNED: Card-based allocatedSites panel → Blueprint Table2
 *
 * Workshop Compliance: Blueprint v6
 * Redesign Date: 2025-10-14
 */

import React, { useMemo, useState, useEffect } from 'react';
import './AllocationTab.css';
import {
  Checkbox,
  Tag,
  Intent,
  H6,
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
  Text,
  NumericInput,
  Card,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Table2, Column, Cell, EditableCell, ColumnHeaderCell } from '@blueprintjs/table';
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

  // Quality filter state (similar to CollectionOpportunitiesHub pattern)
  const [showAllSites, setShowAllSites] = useState(false);

  // State for side panel (replaces row expansion)
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<Site | null>(null);

  // Drawer editing state (staging changes before save)
  const [drawerCollectsValue, setDrawerCollectsValue] = useState<number>(0);
  const [drawerValidationError, setDrawerValidationError] = useState<string>('');

  // Responsive drawer height (taller on desktop, thumb-zone on mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate pass properties per site (includes quality for filtering)
  const sitePassProperties = useMemo(() => {
    const propertiesMap = new Map<string, {
      passCount: number;
      totalDuration: number;
      maxElevation: number;
      minDuration: number;
      averageQuality: number;
    }>();

    availablePasses.forEach((pass) => {
      pass.siteCapabilities?.forEach((site) => {
        const existing = propertiesMap.get(site.id) || {
          passCount: 0,
          totalDuration: 0,
          maxElevation: 0,
          minDuration: Infinity,
          averageQuality: 0,
        };

        const duration = getPassDuration(pass);

        propertiesMap.set(site.id, {
          passCount: existing.passCount + 1,
          totalDuration: existing.totalDuration + duration,
          maxElevation: Math.max(existing.maxElevation, pass.elevation || 0),
          minDuration: Math.min(existing.minDuration, duration),
          averageQuality: ((existing.averageQuality * existing.passCount) + pass.quality) / (existing.passCount + 1),
        });
      });
    });

    return propertiesMap;
  }, [availablePasses]);

  // Filter sites by pass quality (similar to Hub's quality tier filtering)
  const visibleSites = useMemo(() => {
    if (showAllSites) {
      return availableSites;
    }

    // Only show sites with average pass quality >= 3 (fair, good, excellent)
    // Hides poor (2) and worst (1) quality sites by default
    return availableSites.filter(site => {
      const passProps = sitePassProperties.get(site.id);
      if (!passProps || passProps.passCount === 0) return false;
      return passProps.averageQuality >= 3;
    });
  }, [availableSites, sitePassProperties, showAllSites]);

  // Count hidden sites for toggle button label
  const hiddenSiteCount = availableSites.length - visibleSites.length;

  // Get selected sites for allocated sites table (always show all selected, regardless of filter)
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
    const currentCollects = siteCollects.get(site.id) || 0;
    setDrawerCollectsValue(currentCollects);
    setDrawerValidationError('');
    setSelectedSiteForDetails(site);
    setDetailsPanelOpen(true);
  };

  const closeDetailsPanel = () => {
    // Check for unsaved changes
    if (selectedSiteForDetails) {
      const savedValue = siteCollects.get(selectedSiteForDetails.id) || 0;
      const hasUnsavedChanges = drawerCollectsValue !== savedValue;

      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Close without saving?'
        );
        if (!confirmed) return;
      }
    }

    setDetailsPanelOpen(false);
    setDrawerCollectsValue(0);
    setDrawerValidationError('');
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

  // Drawer-specific handlers
  const handleDrawerCollectsChange = (value: number) => {
    if (!selectedSiteForDetails) return;

    const maxCapacity = selectedSiteForDetails.capacity - selectedSiteForDetails.allocated;

    // Validate
    if (value < 0) {
      setDrawerValidationError('Value cannot be negative');
      setDrawerCollectsValue(value);
      return;
    }

    if (value > maxCapacity) {
      setDrawerValidationError(`Exceeds site capacity (max: ${maxCapacity})`);
      setDrawerCollectsValue(value);
      return;
    }

    // Valid value
    setDrawerCollectsValue(value);
    setDrawerValidationError('');
  };

  const handleDrawerSave = () => {
    if (!selectedSiteForDetails || drawerValidationError) return;

    // Save the staged value to the actual state
    setSiteCollects(prev => new Map(prev).set(selectedSiteForDetails.id, drawerCollectsValue));

    // Clear any previous validation errors for this site
    setValidationErrors(prev => {
      const next = new Map(prev);
      next.delete(selectedSiteForDetails.id);
      return next;
    });

    // Close the drawer
    setDetailsPanelOpen(false);
    setDrawerValidationError('');
    setTimeout(() => setSelectedSiteForDetails(null), 300);
  };

  const handleDrawerCancel = () => {
    // Reset to saved value
    if (selectedSiteForDetails) {
      const savedValue = siteCollects.get(selectedSiteForDetails.id) || 0;
      setDrawerCollectsValue(savedValue);
      setDrawerValidationError('');
    }
  };

  // Cell renderers for Available Passes Table (use visibleSites)
  const renderSelectionCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
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
    const site = visibleSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    // Quality badge (only show when "Show All" is active)
    const qualityIntent =
      !passProps ? Intent.NONE :
      passProps.averageQuality >= 4 ? Intent.SUCCESS :  // Optimal: good/excellent
      passProps.averageQuality >= 3 ? Intent.PRIMARY :  // Baseline: fair
      Intent.WARNING;  // Marginal: poor

    const qualityLabel =
      !passProps ? '-' :
      passProps.averageQuality >= 4 ? 'Optimal' :
      passProps.averageQuality >= 3 ? 'Baseline' :
      'Marginal';

    return (
      <Cell>
        <div className="site-name-cell">
          <span className="site-name-cell__text">{site.name}</span>
          {showAllSites && passProps && passProps.averageQuality < 3 && (
            <Tag minimal intent={qualityIntent} style={{ fontSize: '10px', marginLeft: '6px' }}>
              {qualityLabel}
            </Tag>
          )}
        </div>
      </Cell>
    );
  };

  const renderPassesCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return <Cell>{passProps?.passCount || 0}</Cell>;
  };

  const renderTotalDurationCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return (
      <Cell>
        {passProps && `${passProps.totalDuration}m`}
      </Cell>
    );
  };

  const renderDurationCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return (
      <Cell>
        {passProps && (
          <div className="duration-cell">
            <Tag
              minimal
              intent={getDurationIntent(passProps.minDuration)}
              className="duration-cell__min"
            >
              &gt;{formatDurationThreshold(passProps.minDuration)}
            </Tag>
          </div>
        )}
      </Cell>
    );
  };

  const renderElevationCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
    const passProps = sitePassProperties.get(site.id);

    return <Cell>{passProps && `${passProps.maxElevation}°`}</Cell>;
  };

  const renderCapacityCell = (rowIndex: number): JSX.Element => {
    const site = visibleSites[rowIndex];
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

  // Custom column headers with tooltips
  const renderTotalDurationHeader = () => (
    <ColumnHeaderCell name="Total Duration" nameRenderer={() => (
      <Tooltip content="Sum of all pass durations for this site" position={Position.TOP}>
        <span>Total Duration</span>
      </Tooltip>
    )} />
  );

  const renderDurationHeader = () => (
    <ColumnHeaderCell name="Duration" nameRenderer={() => (
      <Tooltip content="Minimum duration threshold - all passes meet or exceed this value" position={Position.TOP}>
        <span>Duration</span>
      </Tooltip>
    )} />
  );

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

  const renderAllocatedCell = (rowIndex: number): JSX.Element => {
    const site = selectedSites[rowIndex];
    return <Cell>{site.allocated}</Cell>;
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
          <Button
            icon={IconNames.INFO_SIGN}
            text="Details"
            onClick={() => openDetailsPanel(site)}
            intent={isViewing ? Intent.PRIMARY : Intent.NONE}
            minimal
            small
          />
          <Button
            icon={IconNames.TRASH}
            text="Remove"
            onClick={() => handleRemoveSite(site.id)}
            intent={Intent.DANGER}
            minimal
            small
          />
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
            <Button icon={IconNames.MORE} minimal small />
          </Popover>
        </ButtonGroup>
      </Cell>
    );
  };

  // Get passes for selected site (used in details panel)
  // Note: Returns ALL passes for the site, not limited by collects count
  // Time ranges are connected to passes the site has, not to collects configuration
  const getPassesForSite = (siteId: string) => {
    return availablePasses
      .filter(pass => pass.siteCapabilities?.some(s => s.id === siteId));
  };

  // Calculate Julian Day (day of year) from date
  const getJulianDay = (date: Date): number => {
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const diff = date.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return dayOfYear;
  };

  // Format date to Julian Day with Zulu time: YYYYDDD/HHmmZ
  const formatJulianTime = (date: Date): string => {
    const year = date.getUTCFullYear();
    const julianDay = getJulianDay(date).toString().padStart(3, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${year}${julianDay}/${hours}${minutes}Z`;
  };

  // Format pass time range (smart: same day shows once, different days show both)
  const formatPassTimeRange = (startTime: Date, endTime: Date): string => {
    const startJulian = `${startTime.getUTCFullYear()}${getJulianDay(startTime).toString().padStart(3, '0')}`;
    const endJulian = `${endTime.getUTCFullYear()}${getJulianDay(endTime).toString().padStart(3, '0')}`;

    const startHHmm = `${startTime.getUTCHours().toString().padStart(2, '0')}${startTime.getUTCMinutes().toString().padStart(2, '0')}Z`;
    const endHHmm = `${endTime.getUTCHours().toString().padStart(2, '0')}${endTime.getUTCMinutes().toString().padStart(2, '0')}Z`;

    // Same Julian day: "YYYYDDD/HHmmZ-HHmmZ"
    if (startJulian === endJulian) {
      return `${startJulian}/${startHHmm}-${endHHmm}`;
    }

    // Different days: "YYYYDDD/HHmmZ - YYYYDDD/HHmmZ"
    return `${startJulian}/${startHHmm} - ${endJulian}/${endHHmm}`;
  };

  return (
    <div className="allocation-tab">
      {/* LEFT PANEL: Available Passes Table */}
      <div className="allocation-tab__left-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag minimal intent={Intent.PRIMARY}>Step 1</Tag>
            <H6 style={{ margin: 0 }}>Available Passes</H6>
          </div>

          {/* Show All Sites Toggle (pattern from CollectionOpportunitiesHub) */}
          {(hiddenSiteCount > 0 || showAllSites) && (
            <Tooltip
              content={showAllSites ? `Click to hide ${hiddenSiteCount} low quality sites (pass quality < 3)` : `${hiddenSiteCount} low quality sites hidden. Click to show all.`}
              position={Position.TOP}
            >
              <Button
                small
                variant="minimal"
                intent={showAllSites ? Intent.PRIMARY : Intent.NONE}
                icon={showAllSites ? IconNames.EYE_OFF : IconNames.EYE_OPEN}
                text={showAllSites ? "Hide Low Quality" : `Show All (${hiddenSiteCount} hidden)`}
                onClick={() => setShowAllSites(!showAllSites)}
              />
            </Tooltip>
          )}
        </div>
        <p className="allocation-tab__description">
          Select sites to add to allocation. Pass properties help inform your decision.
          {!showAllSites && hiddenSiteCount > 0 && (
            <> <strong>({hiddenSiteCount} low quality sites hidden)</strong></>
          )}
        </p>

        <Table2
          numRows={visibleSites.length}
          enableRowHeader={false}
          enableColumnReordering={false}
          className="available-passes-table"
        >
          <Column name="Select" cellRenderer={renderSelectionCell} />
          <Column name="Site Name" cellRenderer={renderSiteNameCell} />
          <Column name="Passes" cellRenderer={renderPassesCell} />
          <Column columnHeaderCellRenderer={renderTotalDurationHeader} cellRenderer={renderTotalDurationCell} />
          <Column columnHeaderCellRenderer={renderDurationHeader} cellRenderer={renderDurationCell} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Tag minimal intent={Intent.SUCCESS}>Step 2</Tag>
          <H6 style={{ margin: 0 }}>Allocated Sites</H6>
        </div>
        <p className="allocation-tab__description">
          Configure pass allocation for selected sites. <strong>Collects</strong> = number of passes to allocate from each site.
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
              <Column name="Assigned" cellRenderer={renderAllocatedCell} />
              <Column name="Collects" cellRenderer={renderCollectsEditableCell} />
              <Column name="Capacity" cellRenderer={renderCapacityCell} />
              <Column name="Operational Days" cellRenderer={renderOperationalDaysCell} />
              <Column name="Operations" cellRenderer={renderOperationsCell} />
            </Table2>
          </>
        )}
      </div>

      {/* BOTTOM DRAWER: Universal (mobile + desktop) */}
      <Drawer
        isOpen={detailsPanelOpen}
        onClose={closeDetailsPanel}
        size={isMobile ? "60vh" : "400px"}
        position={Position.BOTTOM}
        title={selectedSiteForDetails?.name || "Site Details"}
        icon={IconNames.INFO_SIGN}
        className={`site-details-drawer site-details-drawer--bottom ${isMobile ? 'site-details-drawer--mobile' : 'site-details-drawer--desktop'}`}
        canOutsideClickClose={true}
      >
        {selectedSiteForDetails && (
          <>
            <div className={Classes.DRAWER_BODY}>
              {(() => {
                const passes = getPassesForSite(selectedSiteForDetails.id);
                const savedCollects = siteCollects.get(selectedSiteForDetails.id) || 0;
                const maxCapacity = selectedSiteForDetails.capacity - selectedSiteForDetails.allocated;
                const hasUnsavedChanges = drawerCollectsValue !== savedCollects;

                return (
                  <>
                    {/* Allocation Configuration */}
                    <div className="drawer-section">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <H6>Allocation</H6>
                        {hasUnsavedChanges && (
                          <Tag intent={Intent.WARNING} minimal>
                            Unsaved changes
                          </Tag>
                        )}
                      </div>
                      <FormGroup
                        label="Collects"
                        labelInfo={`(max ${maxCapacity})`}
                        inline
                        style={{ marginTop: 12, marginBottom: 12 }}
                      >
                        <NumericInput
                          value={drawerCollectsValue}
                          onValueChange={handleDrawerCollectsChange}
                          min={0}
                          max={maxCapacity}
                          stepSize={1}
                          majorStepSize={5}
                          minorStepSize={1}
                          fill={false}
                          style={{ width: 80 }}
                          intent={drawerValidationError ? Intent.DANGER : Intent.NONE}
                          buttonPosition="right"
                        />
                        {drawerValidationError && (
                          <Text style={{ color: '#DB3737', fontSize: 12, marginLeft: 8 }}>
                            {drawerValidationError}
                          </Text>
                        )}
                      </FormGroup>
                    </div>

                  {/* Available Passes - Grid Layout */}
                  <div className="drawer-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <H6 style={{ margin: 0 }}>Available Passes</H6>
                      <Tag minimal>
                        Total: {passes.reduce((sum, p) => sum + getPassDuration(p), 0)}m
                      </Tag>
                    </div>
                    {passes.length === 0 ? (
                      <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
                        No passes available for this site
                      </Callout>
                    ) : (
                      <div className="passes-grid">
                        {passes.map((pass, idx) => (
                          <Card
                            key={pass.id}
                            compact
                            interactive={false}
                            className="pass-card"
                          >
                            {/* PRIMARY: Timestamp (70% visual weight) */}
                            <div className="pass-card__time">
                              {formatPassTimeRange(pass.startTime, pass.endTime)}
                            </div>

                            {/* SECONDARY: Details (30% visual weight) */}
                            <div className="pass-card__details">
                              <span className="pass-card__duration">{getPassDuration(pass)}m</span>
                              <span className="pass-card__separator">•</span>
                              <span className="pass-card__elevation">{pass.elevation}°</span>
                              <Tag minimal className="pass-card__index">
                                #{idx + 1}
                              </Tag>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Operational Constraints */}
                  <div className="drawer-section drawer-section--constraints">
                    <H6>Operational Constraints</H6>
                    <Divider style={{ marginTop: 8, marginBottom: 12 }} />

                    <FormGroup label="Days" inline className="constraint-field">
                      <OperationalDaysCompact operationalDays={selectedSiteForDetails.operationalDays} />
                    </FormGroup>

                    {selectedSiteForDetails.operationalHours && (
                      <FormGroup label="Hours" inline className="constraint-field">
                        <Tag minimal icon={IconNames.TIME}>
                          {selectedSiteForDetails.operationalHours.start}-{selectedSiteForDetails.operationalHours.end} {selectedSiteForDetails.operationalHours.timezone}
                        </Tag>
                      </FormGroup>
                    )}
                  </div>
                </>
              );
            })()}
            </div>

            {/* Drawer Footer with Save/Cancel */}
            <div className={Classes.DRAWER_FOOTER}>
              {(() => {
                const savedCollects = siteCollects.get(selectedSiteForDetails.id) || 0;
                const hasUnsavedChanges = drawerCollectsValue !== savedCollects;

                return (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button
                      text="Cancel"
                      onClick={handleDrawerCancel}
                      disabled={!hasUnsavedChanges}
                    />
                    <Button
                      text="Save"
                      intent={Intent.PRIMARY}
                      onClick={handleDrawerSave}
                      disabled={!hasUnsavedChanges || !!drawerValidationError}
                      icon={IconNames.TICK}
                    />
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};
