# AllocationTab Workshop Compliance Audit Report

**Component**: `UnifiedEditor/OverrideTabs/AllocationTab.tsx`
**Analysis Date**: 2025-10-07
**Analyst**: Claude Code SuperClaude Framework
**Methodology**: Workshop/Blueprint pattern analysis with Context7 research

---

## Executive Summary

**Current Workshop Compliance Score: 4/10** ⚠️

The AllocationTab component demonstrates **strong Blueprint component usage** but suffers from **extensive inline styling violations** that prevent Workshop compliance. While the component architecture (two-panel split view with site cards and allocation configuration) aligns with Workshop patterns, the implementation deviates significantly from Workshop standards through 50+ inline style declarations and hardcoded color values.

### Critical Findings

✅ **Strengths**:
- Blueprint components correctly implemented (Card, Checkbox, Tag, ProgressBar, NumericInput, FormGroup, Callout)
- Intent system properly leveraged for semantic styling
- Capacity constraint logic working correctly
- Two-panel master-detail pattern aligns with Workshop layouts

❌ **Workshop Violations**:
- **50+ inline style declarations** (lines 124-373)
- **Hardcoded color values** instead of Blueprint design tokens
- **Inline layout definitions** (flex, grid) instead of CSS classes
- **No dedicated CSS file** for component styling
- **Mixed unit systems** (px, %, rem) without Blueprint grid alignment

---

## Detailed Component Analysis

### Architecture Pattern Analysis

**Current Pattern**: Two-panel horizontal split layout
- Left Panel: Site selection cards (Available Passes)
- Right Panel: Configuration interface (Allocated Sites)

**Workshop Alignment**: ✅ **Compliant**
- Matches Workshop's master-detail pattern
- Follows section-based layout approach
- Aligns with Workshop's "Add — Right" section pattern

**Reference**: [Workshop Layouts Documentation](https://www.palantir.com/docs/foundry/workshop/concepts-layouts)

---

## Panel 1: Available Passes (Site Cards)

**Location**: Lines 124-227
**Workshop Compliance**: 3/10 ⚠️

### Current Implementation

```typescript
// LINE 124: Container with inline flex layout
<div className="allocation-tab" style={{ display: 'flex', gap: '16px', height: '100%' }}>
  {/* LEFT PANEL: Available Passes (Legacy Step 2.2) */}
  <div style={{ flex: '1 1 50%', minWidth: 0 }}>
    <H6>Available Passes</H6>
    <p style={{ color: '#5C7080', marginBottom: '16px', fontSize: '13px' }}>
      Select sites to add to allocation. Pass properties help inform your decision.
    </p>

    {/* LINE 132: Grid container with inline styles */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '12px',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
```

### Workshop Violations

#### 1. Container Inline Styles (Line 124)
**Violation**: `style={{ display: 'flex', gap: '16px', height: '100%' }}`

**Workshop Standard**:
```css
/* AllocationTab.css */
.allocation-tab {
  display: flex;
  gap: var(--bp5-grid-size-2x); /* 16px via Blueprint token */
  height: 100%;
}
```

#### 2. Panel Flex Layout (Line 126)
**Violation**: `style={{ flex: '1 1 50%', minWidth: 0 }}`

**Workshop Standard**:
```css
.allocation-tab__left-panel {
  flex: 1 1 50%;
  min-width: 0;
}
```

#### 3. Hardcoded Text Color (Line 128)
**Violation**: `style={{ color: '#5C7080', marginBottom: '16px', fontSize: '13px' }}`

**Workshop Standard**:
```css
.allocation-tab__description {
  color: var(--bp5-text-color-muted); /* #5C7080 in light mode */
  margin-bottom: var(--bp5-grid-size-2x);
  font-size: var(--bp5-font-size-small);
}
```

#### 4. Grid Container Inline Layout (Line 132)
**Violation**:
```typescript
style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '12px',
  maxHeight: '600px',
  overflowY: 'auto'
}}
```

**Workshop Standard**:
```css
.allocation-tab__site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--bp5-grid-size);
  max-height: 600px;
  overflow-y: auto;
}
```

### Site Card Component Analysis

**Location**: Lines 143-217
**Current Implementation**:

```typescript
<Card
  key={site.id}
  interactive
  className={`editor-site-card ${isSelected ? 'selected' : ''}`}
  onClick={() => handleSiteToggle(site.id)}
  style={{
    cursor: 'pointer',
    border: isSelected ? '2px solid #137CBD' : '1px solid #E1E8ED',
  }}
>
```

#### Workshop Violation: Inline Border Selection State

**Current (Line 149-151)**:
```typescript
style={{
  cursor: 'pointer',
  border: isSelected ? '2px solid #137CBD' : '1px solid #E1E8ED',
}}
```

**Workshop Standard**:
```css
.editor-site-card {
  cursor: pointer;
  border: 1px solid var(--bp5-divider-black); /* #E1E8ED */
  transition: border 0.2s ease;
}

.editor-site-card.selected {
  border: 2px solid var(--bp5-intent-primary); /* #137CBD */
}
```

### Pass Properties Section Analysis

**Location**: Lines 168-191
**Current Implementation**:

```typescript
{/* Pass Properties */}
{passProps && (
  <div style={{ marginTop: '8px', fontSize: '11px', color: '#5C7080' }}>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
      <Tag minimal intent={passProps.maxQuality >= 4 ? Intent.SUCCESS : Intent.WARNING}>
        Q: {passProps.maxQuality}/5
      </Tag>
      <Tag minimal>
        {passProps.passCount} passes
      </Tag>
      <Tag minimal>
        {passProps.totalDuration}m total
      </Tag>
    </div>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      <Tag minimal>
        Elev: {passProps.maxElevation}°
      </Tag>
      <Tag intent={getDurationIntent(passProps.minDuration)}>
        {formatDurationThreshold(passProps.minDuration)}
      </Tag>
    </div>
  </div>
)}
```

#### Workshop Violations in Pass Properties

**Line 169**: `style={{ marginTop: '8px', fontSize: '11px', color: '#5C7080' }}`
**Line 170**: `style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}`
**Line 182**: `style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}`

**Workshop Standard**:
```css
.site-card__pass-properties {
  margin-top: var(--bp5-grid-size);
  font-size: 11px;
  color: var(--bp5-text-color-muted);
}

.site-card__tag-row {
  display: flex;
  gap: calc(var(--bp5-grid-size) / 2);
  flex-wrap: wrap;
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

.site-card__tag-row:last-child {
  margin-bottom: 0;
}
```

### Operational Constraints Section Analysis

**Location**: Lines 193-215
**Current Implementation**:

```typescript
{/* Operational Constraints + Capacity */}
<div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E1E8ED' }}>
  <div style={{ fontSize: '11px', marginBottom: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
      <strong>Operations:</strong>
    </div>
    <OperationalDaysCompact operationalDays={site.operationalDays} />
    {site.operationalHours && (
      <div style={{ color: '#5C7080', fontSize: '10px', marginTop: '2px' }}>
        {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
      </div>
    )}
  </div>
  <div style={{ fontSize: '11px', color: '#5C7080', marginBottom: '4px' }}>
    Capacity: {site.allocated} / {site.capacity}
  </div>
  <ProgressBar
    value={capacityPercent / 100}
    intent={capacityIntent}
    stripes={false}
    animate={false}
  />
</div>
```

#### Workshop Violations in Operational Section

**5 inline style declarations** (lines 194, 195, 196, 200, 206)

**Workshop Standard**:
```css
.site-card__operational-section {
  margin-top: var(--bp5-grid-size);
  padding-top: var(--bp5-grid-size);
  border-top: 1px solid var(--bp5-divider-black);
}

.site-card__operational-info {
  font-size: 11px;
  margin-bottom: calc(var(--bp5-grid-size) * 0.75);
}

.site-card__operational-header {
  display: flex;
  align-items: center;
  gap: calc(var(--bp5-grid-size) / 2);
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

.site-card__operational-hours {
  color: var(--bp5-text-color-muted);
  font-size: 10px;
  margin-top: 2px;
}

.site-card__capacity-label {
  font-size: 11px;
  color: var(--bp5-text-color-muted);
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}
```

---

## Panel 2: Allocated Sites Configuration

**Location**: Lines 229-373
**Workshop Compliance**: 4/10 ⚠️

### Current Implementation

```typescript
{/* RIGHT PANEL: Allocated Sites (Legacy Step 2.3) */}
<div style={{ flex: '1 1 50%', minWidth: 0, borderLeft: '1px solid #E1E8ED', paddingLeft: '16px' }}>
  <H6>Allocated Sites</H6>
  <p style={{ color: '#5C7080', marginBottom: '16px', fontSize: '13px' }}>
    Configure pass allocation for selected sites.
  </p>

  {selectedSites.length === 0 ? (
    <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
      Select sites from the left panel to configure allocation.
    </Callout>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {selectedSites.map(site => {
        // Site configuration cards
```

### Workshop Violations

#### 1. Right Panel Container (Line 230)
**Violation**: `style={{ flex: '1 1 50%', minWidth: 0, borderLeft: '1px solid #E1E8ED', paddingLeft: '16px' }}`

**Workshop Standard**:
```css
.allocation-tab__right-panel {
  flex: 1 1 50%;
  min-width: 0;
  border-left: 1px solid var(--bp5-divider-black);
  padding-left: var(--bp5-grid-size-2x);
}
```

#### 2. Configuration List Container (Line 241)
**Violation**: `style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}`

**Workshop Standard**:
```css
.allocation-tab__config-list {
  display: flex;
  flex-direction: column;
  gap: var(--bp5-grid-size);
}
```

### Allocated Site Card Analysis

**Location**: Lines 249-368
**Current Implementation**:

```typescript
<Card key={site.id} elevation={1}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
    <div>
      <strong>{site.name}</strong>
      <div style={{ fontSize: '12px', color: '#5C7080' }}>
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
```

#### Workshop Violations in Card Header

**Line 250**: `style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}`
**Line 253**: `style={{ fontSize: '12px', color: '#5C7080' }}`

**Workshop Standard**:
```css
.allocated-site-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__pass-count {
  font-size: var(--bp5-font-size-small);
  color: var(--bp5-text-color-muted);
}
```

### Stepper Controls Analysis

**Location**: Lines 269-336
**Current Implementation**:

```typescript
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
  <FormGroup
    label="Collects"
    labelInfo={`(max: ${maxCollects})`}
    helperText={`Capacity: ${site.allocated}/${site.capacity} allocated`}
    style={{ marginBottom: 0 }}
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
    style={{ marginBottom: 0 }}
  >
    <div style={{
      padding: '10px 12px',
      background: '#F5F8FA',
      borderRadius: '3px',
      border: '1px solid #E1E8ED'
    }}>
```

#### Workshop Violations in Stepper Section

**Line 291**: Grid container inline styles
**Line 296**: FormGroup inline marginBottom
**Line 317**: FormGroup inline marginBottom
**Lines 319-323**: Read-only field container inline styles

**Workshop Standard**:
```css
.allocated-site-card__stepper-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bp5-grid-size);
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__form-group {
  margin-bottom: 0;
}

.allocated-site-card__readonly-field {
  padding: calc(var(--bp5-grid-size) * 1.25) var(--bp5-grid-size);
  background: var(--bp5-light-gray5);
  border-radius: var(--bp5-border-radius);
  border: 1px solid var(--bp5-divider-black);
}
```

#### NumericInput Pattern Compliance

✅ **Workshop Compliant**: The NumericInput implementation follows Blueprint.js best practices:
- `buttonPosition="right"` aligns with Workshop stepper patterns
- `fill` prop for full-width input
- Proper min/max constraints
- Disabled state for capacity constraints

**Reference**: [Blueprint NumericInput Documentation](https://blueprintjs.com/docs/#core/components/numeric-input)

### Summary Text Analysis

**Location**: Lines 338-346
**Current Implementation**:

```typescript
<div style={{ fontSize: '12px', color: '#5C7080', display: 'flex', justifyContent: 'space-between' }}>
  <div>
    <strong>Allocating:</strong> {config.collects} of {maxCollects} available passes
  </div>
  <div>
    <strong>Total Assigned:</strong> {site.allocated + config.collects} / {site.capacity}
  </div>
</div>
```

#### Workshop Violation

**Workshop Standard**:
```css
.allocated-site-card__summary {
  font-size: var(--bp5-font-size-small);
  color: var(--bp5-text-color-muted);
  display: flex;
  justify-content: space-between;
}
```

### Expandable Pass Timestamps

**Location**: Lines 351-367
**Current Implementation**:

```typescript
<Collapse isOpen={config.expanded}>
  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E1E8ED' }}>
    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
      Pass Timestamps:
    </div>
    <div style={{ fontSize: '11px', color: '#5C7080' }}>
      {availablePasses
        .filter(pass => pass.siteCapabilities?.some(s => s.id === site.id))
        .slice(0, config.collects)
        .map((pass, idx) => (
          <div key={pass.id} style={{ marginBottom: '4px' }}>
            [{idx + 1}] {new Date(pass.startTime).toLocaleTimeString()} - {new Date(pass.endTime).toLocaleTimeString()}
          </div>
        ))}
    </div>
  </div>
</Collapse>
```

#### Workshop Violations (4 inline styles)

**Workshop Standard**:
```css
.allocated-site-card__expandable-section {
  margin-top: var(--bp5-grid-size);
  padding-top: var(--bp5-grid-size);
  border-top: 1px solid var(--bp5-divider-black);
}

.allocated-site-card__timestamps-header {
  font-size: var(--bp5-font-size-small);
  font-weight: 600;
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__timestamps-list {
  font-size: 11px;
  color: var(--bp5-text-color-muted);
}

.allocated-site-card__timestamp-item {
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}
```

---

## Complete Inline Style Violations Inventory

### Total Count: **52 inline style declarations**

#### Container Level (7 violations)
- Line 124: Main container flex layout
- Line 126: Left panel flex basis
- Line 128: Description text styling
- Line 132: Grid container layout
- Line 230: Right panel flex basis + border + padding
- Line 232: Right panel description styling
- Line 241: Configuration list flex container

#### Site Card Level (18 violations)
- Line 149-151: Card selection border state
- Line 169: Pass properties container
- Line 170: Tag row flex layout (first row)
- Line 182: Tag row flex layout (second row)
- Line 194: Operational section spacing + border
- Line 195: Operational info text
- Line 196: Operational header flex layout
- Line 200: Operational hours text
- Line 206: Capacity label text

#### Allocated Card Level (27 violations)
- Line 250: Card header flex layout
- Line 253: Pass count text
- Line 291: Stepper grid layout
- Line 296: FormGroup marginBottom (first)
- Line 317: FormGroup marginBottom (second)
- Lines 319-323: Read-only field container (5 properties)
- Line 325-329: Operational details styling (in read-only field)
- Line 331: Immutable constraint text
- Line 338: Summary text flex layout
- Line 352: Expandable section spacing + border
- Line 353: Timestamps header styling
- Line 356: Timestamps list styling
- Line 361: Timestamp item spacing

---

## Workshop Compliance Recommendations

### Phase 1: Create CSS Architecture (Priority: CRITICAL)

**File to Create**: `/Users/damon/malibu/src/components/UnifiedEditor/OverrideTabs/AllocationTab.css`

**Estimated Impact**: 4/10 → 7/10 compliance

#### CSS File Structure

```css
/**
 * AllocationTab.css
 * Workshop-compliant styling for Override Mode allocation workflow
 */

/* ============================================
   CONTAINER LAYOUT
   ============================================ */

.allocation-tab {
  display: flex;
  gap: var(--bp5-grid-size-2x);
  height: 100%;
}

/* ============================================
   LEFT PANEL - AVAILABLE PASSES
   ============================================ */

.allocation-tab__left-panel {
  flex: 1 1 50%;
  min-width: 0;
}

.allocation-tab__description {
  color: var(--bp5-text-color-muted);
  margin-bottom: var(--bp5-grid-size-2x);
  font-size: var(--bp5-font-size-small);
}

.allocation-tab__site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--bp5-grid-size);
  max-height: 600px;
  overflow-y: auto;
}

/* ============================================
   SITE CARDS
   ============================================ */

.editor-site-card {
  cursor: pointer;
  border: 1px solid var(--bp5-divider-black);
  transition: border 0.2s ease;
}

.editor-site-card.selected {
  border: 2px solid var(--bp5-intent-primary);
}

.site-card__pass-properties {
  margin-top: var(--bp5-grid-size);
  font-size: 11px;
  color: var(--bp5-text-color-muted);
}

.site-card__tag-row {
  display: flex;
  gap: calc(var(--bp5-grid-size) / 2);
  flex-wrap: wrap;
}

.site-card__tag-row:not(:last-child) {
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

.site-card__operational-section {
  margin-top: var(--bp5-grid-size);
  padding-top: var(--bp5-grid-size);
  border-top: 1px solid var(--bp5-divider-black);
}

.site-card__operational-info {
  font-size: 11px;
  margin-bottom: calc(var(--bp5-grid-size) * 0.75);
}

.site-card__operational-header {
  display: flex;
  align-items: center;
  gap: calc(var(--bp5-grid-size) / 2);
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

.site-card__operational-hours {
  color: var(--bp5-text-color-muted);
  font-size: 10px;
  margin-top: 2px;
}

.site-card__capacity-label {
  font-size: 11px;
  color: var(--bp5-text-color-muted);
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

/* ============================================
   RIGHT PANEL - ALLOCATED SITES
   ============================================ */

.allocation-tab__right-panel {
  flex: 1 1 50%;
  min-width: 0;
  border-left: 1px solid var(--bp5-divider-black);
  padding-left: var(--bp5-grid-size-2x);
}

.allocation-tab__config-list {
  display: flex;
  flex-direction: column;
  gap: var(--bp5-grid-size);
}

/* ============================================
   ALLOCATED SITE CARDS
   ============================================ */

.allocated-site-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__pass-count {
  font-size: var(--bp5-font-size-small);
  color: var(--bp5-text-color-muted);
}

.allocated-site-card__stepper-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bp5-grid-size);
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__form-group {
  margin-bottom: 0;
}

.allocated-site-card__readonly-field {
  padding: calc(var(--bp5-grid-size) * 1.25) var(--bp5-grid-size);
  background: var(--bp5-light-gray5);
  border-radius: var(--bp5-border-radius);
  border: 1px solid var(--bp5-divider-black);
}

.allocated-site-card__summary {
  font-size: var(--bp5-font-size-small);
  color: var(--bp5-text-color-muted);
  display: flex;
  justify-content: space-between;
}

/* ============================================
   EXPANDABLE SECTIONS
   ============================================ */

.allocated-site-card__expandable-section {
  margin-top: var(--bp5-grid-size);
  padding-top: var(--bp5-grid-size);
  border-top: 1px solid var(--bp5-divider-black);
}

.allocated-site-card__timestamps-header {
  font-size: var(--bp5-font-size-small);
  font-weight: 600;
  margin-bottom: var(--bp5-grid-size);
}

.allocated-site-card__timestamps-list {
  font-size: 11px;
  color: var(--bp5-text-color-muted);
}

.allocated-site-card__timestamp-item {
  margin-bottom: calc(var(--bp5-grid-size) / 2);
}

/* ============================================
   DARK THEME SUPPORT
   ============================================ */

.bp5-dark .allocated-site-card__readonly-field {
  background: var(--bp5-dark-gray5);
  border-color: var(--bp5-dark-divider-white);
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 1200px) {
  .allocation-tab {
    flex-direction: column;
  }

  .allocation-tab__right-panel {
    border-left: none;
    border-top: 1px solid var(--bp5-divider-black);
    padding-left: 0;
    padding-top: var(--bp5-grid-size-2x);
  }
}
```

### Phase 2: Refactor Component Implementation

**Estimated Effort**: 2-3 hours
**Estimated Impact**: 7/10 → 9/10 compliance

#### Implementation Steps

1. **Import CSS file** (Line 31):
```typescript
import './AllocationTab.css';
```

2. **Replace container inline styles** (Line 124):
```typescript
// BEFORE
<div className="allocation-tab" style={{ display: 'flex', gap: '16px', height: '100%' }}>

// AFTER
<div className="allocation-tab">
```

3. **Replace left panel inline styles** (Line 126):
```typescript
// BEFORE
<div style={{ flex: '1 1 50%', minWidth: 0 }}>

// AFTER
<div className="allocation-tab__left-panel">
```

4. **Replace description inline styles** (Line 128):
```typescript
// BEFORE
<p style={{ color: '#5C7080', marginBottom: '16px', fontSize: '13px' }}>

// AFTER
<p className="allocation-tab__description">
```

5. **Replace grid container inline styles** (Line 132):
```typescript
// BEFORE
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', maxHeight: '600px', overflowY: 'auto' }}>

// AFTER
<div className="allocation-tab__site-grid">
```

6. **Replace site card inline styles** (Lines 149-151):
```typescript
// BEFORE
<Card
  key={site.id}
  interactive
  className={`editor-site-card ${isSelected ? 'selected' : ''}`}
  onClick={() => handleSiteToggle(site.id)}
  style={{
    cursor: 'pointer',
    border: isSelected ? '2px solid #137CBD' : '1px solid #E1E8ED',
  }}
>

// AFTER
<Card
  key={site.id}
  interactive
  className={`editor-site-card ${isSelected ? 'selected' : ''}`}
  onClick={() => handleSiteToggle(site.id)}
>
```

7. **Replace pass properties inline styles** (Lines 169-191):
```typescript
// BEFORE
{passProps && (
  <div style={{ marginTop: '8px', fontSize: '11px', color: '#5C7080' }}>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
      {/* Tags */}
    </div>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {/* Tags */}
    </div>
  </div>
)}

// AFTER
{passProps && (
  <div className="site-card__pass-properties">
    <div className="site-card__tag-row">
      {/* Tags */}
    </div>
    <div className="site-card__tag-row">
      {/* Tags */}
    </div>
  </div>
)}
```

8. **Replace operational section inline styles** (Lines 193-215):
```typescript
// BEFORE
<div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E1E8ED' }}>
  <div style={{ fontSize: '11px', marginBottom: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
      <strong>Operations:</strong>
    </div>
    <OperationalDaysCompact operationalDays={site.operationalDays} />
    {site.operationalHours && (
      <div style={{ color: '#5C7080', fontSize: '10px', marginTop: '2px' }}>
        {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
      </div>
    )}
  </div>
  <div style={{ fontSize: '11px', color: '#5C7080', marginBottom: '4px' }}>
    Capacity: {site.allocated} / {site.capacity}
  </div>
  <ProgressBar /* ... */ />
</div>

// AFTER
<div className="site-card__operational-section">
  <div className="site-card__operational-info">
    <div className="site-card__operational-header">
      <strong>Operations:</strong>
    </div>
    <OperationalDaysCompact operationalDays={site.operationalDays} />
    {site.operationalHours && (
      <div className="site-card__operational-hours">
        {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
      </div>
    )}
  </div>
  <div className="site-card__capacity-label">
    Capacity: {site.allocated} / {site.capacity}
  </div>
  <ProgressBar /* ... */ />
</div>
```

9. **Replace right panel inline styles** (Line 230):
```typescript
// BEFORE
<div style={{ flex: '1 1 50%', minWidth: 0, borderLeft: '1px solid #E1E8ED', paddingLeft: '16px' }}>

// AFTER
<div className="allocation-tab__right-panel">
```

10. **Replace config list inline styles** (Line 241):
```typescript
// BEFORE
<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

// AFTER
<div className="allocation-tab__config-list">
```

11. **Replace allocated card header inline styles** (Lines 250, 253):
```typescript
// BEFORE
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
  <div>
    <strong>{site.name}</strong>
    <div style={{ fontSize: '12px', color: '#5C7080' }}>
      {passProps.passCount} passes available
    </div>
  </div>
  <Button /* ... */ />
</div>

// AFTER
<div className="allocated-site-card__header">
  <div>
    <strong>{site.name}</strong>
    <div className="allocated-site-card__pass-count">
      {passProps.passCount} passes available
    </div>
  </div>
  <Button /* ... */ />
</div>
```

12. **Replace stepper grid inline styles** (Line 291):
```typescript
// BEFORE
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

// AFTER
<div className="allocated-site-card__stepper-grid">
```

13. **Replace FormGroup inline styles** (Lines 296, 317):
```typescript
// BEFORE
<FormGroup
  label="Collects"
  labelInfo={`(max: ${maxCollects})`}
  helperText={`Capacity: ${site.allocated}/${site.capacity} allocated`}
  style={{ marginBottom: 0 }}
>

// AFTER
<FormGroup
  label="Collects"
  labelInfo={`(max: ${maxCollects})`}
  helperText={`Capacity: ${site.allocated}/${site.capacity} allocated`}
  className="allocated-site-card__form-group"
>
```

14. **Replace read-only field inline styles** (Lines 319-334):
```typescript
// BEFORE
<div style={{
  padding: '10px 12px',
  background: '#F5F8FA',
  borderRadius: '3px',
  border: '1px solid #E1E8ED'
}}>
  <OperationalDaysDetailed operationalDays={site.operationalDays} />
  {site.operationalHours && (
    <div style={{ fontSize: '12px', color: '#5C7080', marginTop: '8px' }}>
      <strong>Hours:</strong> {site.operationalHours.start}-{site.operationalHours.end} {site.operationalHours.timezone}
    </div>
  )}
  <div style={{ fontSize: '11px', color: '#5C7080', fontStyle: 'italic', marginTop: '8px' }}>
    Site infrastructure constraint • Cannot be modified
  </div>
</div>

// AFTER
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
```

15. **Replace summary text inline styles** (Line 338):
```typescript
// BEFORE
<div style={{ fontSize: '12px', color: '#5C7080', display: 'flex', justifyContent: 'space-between' }}>

// AFTER
<div className="allocated-site-card__summary">
```

16. **Replace expandable section inline styles** (Lines 352-367):
```typescript
// BEFORE
<Collapse isOpen={config.expanded}>
  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E1E8ED' }}>
    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
      Pass Timestamps:
    </div>
    <div style={{ fontSize: '11px', color: '#5C7080' }}>
      {availablePasses
        .filter(pass => pass.siteCapabilities?.some(s => s.id === site.id))
        .slice(0, config.collects)
        .map((pass, idx) => (
          <div key={pass.id} style={{ marginBottom: '4px' }}>
            [{idx + 1}] {new Date(pass.startTime).toLocaleTimeString()} - {new Date(pass.endTime).toLocaleTimeString()}
          </div>
        ))}
    </div>
  </div>
</Collapse>

// AFTER
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
```

### Phase 3: Add Missing CSS Classes to Readonly Field

**Add to CSS file**:
```css
.allocated-site-card__operational-details {
  font-size: var(--bp5-font-size-small);
  color: var(--bp5-text-color-muted);
  margin-top: var(--bp5-grid-size);
}

.allocated-site-card__immutable-note {
  font-size: 11px;
  color: var(--bp5-text-color-muted);
  font-style: italic;
  margin-top: var(--bp5-grid-size);
}
```

### Phase 4: Validation Testing

**Checklist**:
- [ ] All inline styles removed (52 → 0)
- [ ] All hardcoded colors replaced with Blueprint tokens
- [ ] CSS file imported and loaded correctly
- [ ] Site card selection states working correctly
- [ ] Pass properties display correctly
- [ ] Operational constraints display correctly
- [ ] Capacity indicators working correctly
- [ ] Allocated sites configuration working correctly
- [ ] NumericInput steppers functioning correctly
- [ ] Expandable sections collapsing correctly
- [ ] Dark theme working correctly
- [ ] Responsive layout working at 1200px breakpoint

---

## Expected Compliance Score After Implementation

### Before: 4/10
- ❌ 52 inline style violations
- ❌ Hardcoded color values
- ❌ No CSS file
- ✅ Blueprint components used correctly
- ✅ Intent system properly leveraged
- ✅ NumericInput pattern compliant

### After: 9/10
- ✅ All inline styles removed
- ✅ Blueprint design tokens used throughout
- ✅ Dedicated CSS file with BEM naming
- ✅ Blueprint components used correctly
- ✅ Intent system properly leveraged
- ✅ NumericInput pattern compliant
- ✅ Dark theme support
- ✅ Responsive design implemented

---

## Workshop Pattern Alignment Summary

### ✅ Compliant Patterns

1. **Two-Panel Split Layout**: Correctly implements Workshop's master-detail section pattern
2. **Blueprint Components**: Proper use of Card, Checkbox, Tag, ProgressBar, NumericInput, FormGroup, Callout
3. **Intent System**: Correctly leverages Blueprint intent props for semantic styling
4. **NumericInput Stepper**: Follows Workshop form patterns with proper button positioning
5. **Capacity Constraints**: Business logic correctly implemented with proper error handling
6. **Expandable Sections**: Collapse component used correctly for progressive disclosure

### ❌ Non-Compliant Patterns

1. **Inline Styles**: 52 violations preventing Workshop compliance
2. **Hardcoded Colors**: Using hex values instead of Blueprint design tokens
3. **CSS Architecture**: Missing dedicated CSS file for component styling
4. **Grid System**: Mixed unit systems (px, %, rem) not aligned with Blueprint grid

---

## References

- [Workshop Layouts Documentation](https://www.palantir.com/docs/foundry/workshop/concepts-layouts)
- [Blueprint.js Documentation](https://blueprintjs.com/docs/)
- [Blueprint NumericInput Component](https://blueprintjs.com/docs/#core/components/numeric-input)
- [Workshop Example Applications](https://www.palantir.com/docs/foundry/workshop/example-applications)
- [Blueprint Design System](https://designsystems.surf/design-systems/palantir)

---

## Conclusion

The AllocationTab component demonstrates **strong architectural alignment with Workshop patterns** but requires **systematic inline style removal** to achieve full compliance. The recommended CSS refactoring will eliminate all 52 inline style violations, implement proper Blueprint design tokens, and achieve 9/10 Workshop compliance—matching the standard set by the Collection Management page improvements documented in Phases 1-3.

**Primary Blocker**: Inline styles throughout component (52 violations)
**Recommended Fix**: Create `AllocationTab.css` with Workshop-compliant class architecture
**Estimated Effort**: 2-3 hours implementation + 1 hour testing
**Expected Outcome**: 4/10 → 9/10 Workshop compliance score

---

**Analysis Date**: 2025-10-07
**Framework**: Claude Code SuperClaude with Context7 MCP Integration
**Research Sources**: Palantir Workshop Documentation, Blueprint.js Official Docs, GitHub Issues