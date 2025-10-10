# Override Workflow: Temporal Data Display Validation
**Legacy System Time/Duration Patterns vs. Current Implementation**
**Date**: 2025-10-01
**Focus**: Duration display, time distribution, and progressive disclosure

---

## 🎯 Executive Summary

**Critical Finding**: Our current system **lacks the temporal precision and progressive disclosure** that legacy users rely on for understanding collection timing constraints.

**Legacy Temporal Display Philosophy**:
> "Show duration at-a-glance in available options → Show summary time code in allocation plan → Allow detailed time window expansion when needed"

**Current System Gap**:
> "Temporal data exists in backend but lacks structured UI presentation → No clear duration indicators → No progressive time window disclosure"

---

## 📊 Temporal Data Requirements Matrix

### Legacy System: Dual-Panel Temporal Display

| Panel | Data Type | Format | Progressive Disclosure |
|-------|-----------|--------|----------------------|
| **Left: Available Passes** | Duration | `> 5m`, `> 9m` | Static, always visible |
| **Right: Current Allocation** | Time Distribution | Summary: `W` | Collapsed by default |
| **Right: Expanded Detail** | Scheduled Windows | `(274) 0915Z - 1237Z` | Revealed on click |

### Current System: Temporal Data Availability

| Data Type | Backend Support | UI Display | Status |
|-----------|----------------|------------|--------|
| Pass Duration | ✅ Calculated | ❌ Not prominently shown | **Gap** |
| Time Windows | ✅ Available | ⚠️ Partial display | **Gap** |
| Summary Codes | ❌ Not implemented | ❌ Not shown | **Missing** |
| Expandable Details | ✅ Components exist | ❌ Not in workflow | **Gap** |

---

## 🔍 Detailed Validation: Left Panel (Available Passes)

### Legacy System: Duration Column

**User Mental Model:**
> "I can quickly scan the Duration column to see which passes are long enough for my collection needs. > 5m might be too short, but > 9m looks good."

**Visual Pattern:**
```
Available Passes (Optimal)
┌─────────┬──────┬────────┬─────────┬───────────┬──────────┬──────────┐
│ Quality │ Site │ Passes │  Total  │ Elevation │ Duration │ Capacity │
├─────────┼──────┼────────┼─────────┼───────────┼──────────┼──────────┤
│ Optimal │  DG  │   8    │   72m   │    45°    │   > 9m   │  9/100   │
│ Optimal │  SC  │   5    │   45m   │    38°    │   > 9m   │  7/100   │
│ Optimal │  HI  │   6    │   30m   │    42°    │   > 5m   │  5/100   │
└─────────┴──────┴────────┴─────────┴───────────┴──────────┴──────────┘
```

**Data Format:**
- **> 5m**: Pass duration exceeds 5 minutes (minimum viable)
- **> 9m**: Pass duration exceeds 9 minutes (preferred length)
- Format emphasizes **threshold comparison** not exact duration

**User Decision-Making:**
1. User scans Duration column
2. Identifies passes meeting minimum duration requirement
3. Compares duration against collection complexity needs
4. Selects pass with appropriate duration

---

### Current System: Duration Display

**Backend Data Available:**
```typescript
// types/collectionOpportunities.ts
export interface Pass {
  id: PassId;
  startTime: ISODateString;
  endTime: ISODateString;
  duration: number;  // ✅ Duration exists (in minutes)
  elevation: number;
  azimuth: number;
  // ... other fields
}

// utils/collectionOpportunities.ts
export function getPassDuration(pass: Pass): number {
  const start = new Date(pass.startTime);
  const end = new Date(pass.endTime);
  return Math.round((end.getTime() - start.getTime()) / 60000); // minutes
}
```

**UI Display (CollectionOpportunitiesTable.tsx):**
```typescript
// Lines 42-100: Table rendering
<Table2 numRows={filteredOpportunities.length} ...>
  <Column name="Site" cellRenderer={siteCellRenderer} />
  <Column name="Status" cellRenderer={statusCellRenderer} />
  <Column name="Health" cellRenderer={healthCellRenderer} />
  // ❌ NO DURATION COLUMN
</Table2>
```

**❌ CRITICAL GAP: Duration Not Displayed**
```typescript
// MISSING: Duration column in available passes table
// User cannot see at-a-glance which passes are long enough

// NEEDED:
const durationCellRenderer = (rowIndex: number) => {
  const pass = availablePasses[rowIndex];
  const duration = getPassDuration(pass);

  // Format like legacy: "> 5m" or "> 9m"
  let durationDisplay;
  if (duration >= 9) {
    durationDisplay = "> 9m";
  } else if (duration >= 5) {
    durationDisplay = "> 5m";
  } else {
    durationDisplay = `${duration}m`;
  }

  return <Cell>{durationDisplay}</Cell>;
};

<Column
  name="Duration"
  cellRenderer={durationCellRenderer}
  columnHeaderCellRenderer={() => (
    <ColumnHeaderCell
      name="Duration"
      menuRenderer={durationMenuRenderer}
    />
  )}
/>
```

**⚠️ GAP: No Threshold-Based Formatting**
```typescript
// Current: If we show duration, it's exact number: "8.5 minutes"
// Legacy: Threshold indicators: "> 9m" (emphasizes meeting requirements)

// NEEDED: Threshold formatting utility
export function formatPassDuration(
  durationMinutes: number,
  thresholds: { preferred: number; minimum: number } = { preferred: 9, minimum: 5 }
): string {
  if (durationMinutes >= thresholds.preferred) {
    return `> ${thresholds.preferred}m`;
  }
  if (durationMinutes >= thresholds.minimum) {
    return `> ${thresholds.minimum}m`;
  }
  return `${Math.round(durationMinutes)}m`;
}
```

**📊 Validation Status: LEFT PANEL**
- ✅ Backend: Duration data available
- ✅ Backend: Duration calculation function exists
- ❌ **UI: Duration column not in table**
- ❌ **Format: No threshold-based display (> 5m, > 9m)**
- ❌ **Sorting: Cannot sort by duration**
- ❌ **Filtering: Cannot filter by minimum duration**

---

## 🔍 Detailed Validation: Right Panel (Current Allocation)

### Legacy System: Time Distribution Column

**User Mental Model:**
> "I see 'W' which tells me this is a weekly collection. I can click the dropdown to see the exact time windows when I need that detail."

**Progressive Disclosure Pattern:**

**Collapsed State (Summary):**
```
Current Allocation Plan
┌──────┬──────────┬──────────────┬──────────────────┐
│ Site │ Collects │    Passes    │ Time Distribution│
├──────┼──────────┼──────────────┼──────────────────┤
│  DG  │    8     │  8 passes    │  W ▼             │
│  SC  │    5     │  5 passes    │  W ▼             │
│  HI  │    6     │  6 passes    │  W ▼             │
└──────┴──────────┴──────────────┴──────────────────┘
```

**Expanded State (Detailed Time Windows):**
```
Current Allocation Plan
┌──────┬──────────┬──────────────┬──────────────────────────────┐
│ Site │ Collects │    Passes    │ Time Distribution            │
├──────┼──────────┼──────────────┼──────────────────────────────┤
│  DG  │    8     │  8 passes    │  W ▼                         │
│      │          │              │  ├─ (274) 0915Z - 1237Z      │
│      │          │              │  ├─ (275) 1045Z - 1352Z      │
│      │          │              │  ├─ (276) 0823Z - 1156Z      │
│      │          │              │  └─ (277) 0956Z - 1308Z      │
│  SC  │    5     │  5 passes    │  W ▲                         │
└──────┴──────────┴──────────────┴──────────────────────────────┘
```

**Time Window Format:**
- **(274)**: Julian day of year (day 274 = October 1st)
- **0915Z**: Start time in Zulu/UTC (09:15 UTC)
- **1237Z**: End time in Zulu/UTC (12:37 UTC)
- Full format: `(JulianDay) HHMM'Z' - HHMM'Z'`

**Interaction Pattern:**
1. User sees summary code "W" (Weekly distribution)
2. User clicks dropdown icon ▼
3. Row expands to show detailed time windows
4. User reviews specific collection times
5. User clicks ▲ to collapse back to summary

---

### Current System: Time Distribution Display

**Backend Data Available:**
```typescript
// types/collectionOpportunities.ts
export interface CollectionOpportunity {
  id: string;
  allocatedSites: Site[];
  passes: Pass[];  // ✅ Pass data with times available
  // ... other fields
}

export interface Pass {
  id: PassId;
  startTime: ISODateString;  // "2025-10-01T09:15:00Z"
  endTime: ISODateString;    // "2025-10-01T12:37:00Z"
  // ... other fields
}
```

**UI Display (CollectionOpportunitiesTable.tsx):**
```typescript
// Lines 42-100: Opportunities table rendering
<Table2 numRows={filteredOpportunities.length} ...>
  <Column name="Name" cellRenderer={nameCellRenderer} />
  <Column name="Site" cellRenderer={siteCellRenderer} />
  <Column name="Status" cellRenderer={statusCellRenderer} />
  // ❌ NO TIME DISTRIBUTION COLUMN
  // ❌ NO EXPANDABLE ROW PATTERN
</Table2>
```

**❌ CRITICAL GAP: No Time Distribution Column**
```typescript
// MISSING: Time Distribution summary and expandable detail

// NEEDED: Time distribution cell renderer
const timeDistributionCellRenderer = (rowIndex: number) => {
  const opportunity = filteredOpportunities[rowIndex];
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate distribution type (Weekly, Daily, etc.)
  const distributionType = calculateDistributionType(opportunity.passes);

  return (
    <Cell>
      <div className="time-distribution-cell">
        {/* Summary */}
        <span className="distribution-summary">
          {distributionType} {/* "W" for Weekly */}
        </span>

        {/* Expand/Collapse Icon */}
        <Icon
          icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
          onClick={() => setIsExpanded(!isExpanded)}
          className="expand-icon"
        />

        {/* Expanded Details */}
        {isExpanded && (
          <div className="time-windows">
            {opportunity.passes.map(pass => (
              <div key={pass.id} className="time-window">
                {formatTimeWindow(pass)}
              </div>
            ))}
          </div>
        )}
      </div>
    </Cell>
  );
};
```

**❌ MISSING: Time Window Formatting**
```typescript
// NEEDED: Format time windows like legacy
export function formatTimeWindow(pass: Pass): string {
  const start = new Date(pass.startTime);
  const end = new Date(pass.endTime);

  // Julian day calculation
  const startOfYear = new Date(start.getFullYear(), 0, 1);
  const julianDay = Math.floor(
    (start.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  ) + 1;

  // Format times in Zulu
  const startTime = formatZuluTime(start); // "0915Z"
  const endTime = formatZuluTime(end);     // "1237Z"

  return `(${julianDay}) ${startTime} - ${endTime}`;
}

function formatZuluTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}${minutes}Z`;
}

// Example output: "(274) 0915Z - 1237Z"
```

**❌ MISSING: Distribution Type Calculation**
```typescript
// NEEDED: Calculate distribution summary code
export function calculateDistributionType(passes: Pass[]): string {
  if (!passes || passes.length === 0) return '-';

  // Analyze pass timing patterns
  const passesPerDay = groupPassesByDay(passes);
  const uniqueDays = Object.keys(passesPerDay).length;

  // Weekly pattern: Passes spread across 7 days
  if (uniqueDays >= 6) return 'W';

  // Daily pattern: Multiple passes same day
  if (uniqueDays === 1 && passes.length > 1) return 'D';

  // Single pass
  if (passes.length === 1) return 'S';

  // Custom pattern
  return 'C';
}

function groupPassesByDay(passes: Pass[]): Record<string, Pass[]> {
  return passes.reduce((acc, pass) => {
    const day = new Date(pass.startTime).toISOString().split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(pass);
    return acc;
  }, {} as Record<string, Pass[]>);
}
```

**📊 Validation Status: RIGHT PANEL**
- ✅ Backend: Pass start/end time data available
- ❌ **UI: No Time Distribution column**
- ❌ **Summary: No distribution type indicator (W, D, S)**
- ❌ **Progressive Disclosure: No expand/collapse pattern**
- ❌ **Format: No Julian day + Zulu time formatting**
- ❌ **Interaction: No row expansion for time details**

---

## 🎨 Visual Design Patterns: Temporal Data

### Legacy Pattern: Information Hierarchy

**Level 1: Quick Scan (Collapsed)**
```
Site: DG
Collects: 8
Time Distribution: W ▼
                  ↑ Summary code tells distribution pattern
```

**Level 2: Detailed Review (Expanded)**
```
Site: DG
Collects: 8
Time Distribution: W ▼
  ├─ (274) 0915Z - 1237Z
  ├─ (275) 1045Z - 1352Z
  ├─ (276) 0823Z - 1156Z
  └─ (277) 0956Z - 1308Z
    ↑ Specific time windows for planning
```

**Design Principles:**
1. **Default to Summary**: Don't overwhelm with detail
2. **Progressive Disclosure**: Expand only when user needs it
3. **Consistent Format**: Julian day + Zulu time (unambiguous)
4. **Visual Hierarchy**: Summary bold, details indented
5. **Affordance**: Arrow icon signals expandability

---

### Current System: Missing Progressive Disclosure

**What We Have:**
```typescript
// CollectionOpportunitiesRefactoredBento.tsx has expandable sections
// But NOT for time distribution within allocation table
```

**⚠️ GAP: Progressive Disclosure Pattern Not Applied to Temporal Data**

The current system has expandable UI patterns (Bento layout, collapsible sections) but doesn't apply them to the **time distribution use case** that legacy users rely on.

**NEEDED: Expandable Row Pattern**
```typescript
// Add to CollectionOpportunitiesTable
interface ExpandableRowState {
  expandedRows: Set<string>;  // Track which rows are expanded
}

const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

const toggleRowExpansion = (opportunityId: string) => {
  setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(opportunityId)) {
      next.delete(opportunityId);
    } else {
      next.add(opportunityId);
    }
    return next;
  });
};

// Render expanded content below main row
const renderExpandedContent = (rowIndex: number) => {
  const opportunity = opportunities[rowIndex];

  if (!expandedRows.has(opportunity.id)) return null;

  return (
    <div className="expanded-row-content">
      <div className="time-windows-detail">
        <h4>Scheduled Collection Windows</h4>
        {opportunity.passes.map(pass => (
          <div key={pass.id} className="time-window-item">
            <span className="julian-day">
              (Day {getJulianDay(pass.startTime)})
            </span>
            <span className="time-range">
              {formatZuluTime(pass.startTime)} - {formatZuluTime(pass.endTime)}
            </span>
            <span className="duration">
              ({getPassDuration(pass)}m)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔧 Implementation Recommendations

### Priority 1: Add Duration Column to Available Passes

**Component:** `CollectionOpportunitiesTable.tsx`

```typescript
// Add duration utility
import { getPassDuration } from '../types/collectionOpportunities';

// Add threshold formatter
function formatDurationThreshold(minutes: number): string {
  if (minutes >= 9) return '> 9m';
  if (minutes >= 5) return '> 5m';
  return `${Math.round(minutes)}m`;
}

// Add duration cell renderer
const durationCellRenderer = (rowIndex: number) => {
  const opportunity = filteredOpportunities[rowIndex];

  // Calculate average duration from passes
  const avgDuration = opportunity.passes.length > 0
    ? opportunity.passes.reduce((sum, pass) =>
        sum + getPassDuration(pass), 0) / opportunity.passes.length
    : 0;

  const durationText = formatDurationThreshold(avgDuration);

  // Visual indicator for duration quality
  const intent = avgDuration >= 9 ? Intent.SUCCESS
    : avgDuration >= 5 ? Intent.WARNING
    : Intent.DANGER;

  return (
    <Cell>
      <Tag intent={intent} minimal>
        {durationText}
      </Tag>
    </Cell>
  );
};

// Add to table columns
<Column
  name="Duration"
  cellRenderer={durationCellRenderer}
  columnHeaderCellRenderer={() => (
    <ColumnHeaderCell
      name="Duration"
      menuRenderer={createDurationFilterMenu}
    />
  )}
/>
```

### Priority 2: Add Time Distribution Column with Expansion

**Component:** `CollectionOpportunitiesTable.tsx`

```typescript
// Add expandable row state
const [expandedOpportunityIds, setExpandedOpportunityIds] = useState<Set<string>>(new Set());

// Calculate distribution type
function getDistributionCode(passes: Pass[]): string {
  if (!passes || passes.length === 0) return '-';

  const daysSpanned = new Set(
    passes.map(p => new Date(p.startTime).toISOString().split('T')[0])
  ).size;

  if (daysSpanned >= 6) return 'W'; // Weekly
  if (daysSpanned === 1 && passes.length > 1) return 'D'; // Daily
  if (passes.length === 1) return 'S'; // Single
  return 'C'; // Custom
}

// Format time window
function formatTimeWindow(pass: Pass): string {
  const start = new Date(pass.startTime);
  const julianDay = Math.floor(
    (start - new Date(start.getFullYear(), 0, 1)) / 86400000
  ) + 1;

  const startTime = start.getUTCHours().toString().padStart(2, '0') +
                   start.getUTCMinutes().toString().padStart(2, '0') + 'Z';
  const endTime = new Date(pass.endTime).getUTCHours().toString().padStart(2, '0') +
                 new Date(pass.endTime).getUTCMinutes().toString().padStart(2, '0') + 'Z';

  return `(${julianDay}) ${startTime} - ${endTime}`;
}

// Time distribution cell renderer
const timeDistributionCellRenderer = (rowIndex: number) => {
  const opportunity = filteredOpportunities[rowIndex];
  const isExpanded = expandedOpportunityIds.has(opportunity.id);
  const distributionCode = getDistributionCode(opportunity.passes);

  return (
    <Cell>
      <div className="time-distribution-cell">
        <Button
          minimal
          small
          icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
          text={distributionCode}
          onClick={() => {
            setExpandedOpportunityIds(prev => {
              const next = new Set(prev);
              isExpanded ? next.delete(opportunity.id) : next.add(opportunity.id);
              return next;
            });
          }}
        />
      </div>
    </Cell>
  );
};

// Render expanded time windows
const renderExpandedTimeWindows = (rowIndex: number) => {
  const opportunity = filteredOpportunities[rowIndex];

  if (!expandedOpportunityIds.has(opportunity.id)) return null;

  return (
    <tr className="expanded-time-windows">
      <td colSpan={8}>
        <Card elevation={0} className="time-windows-detail">
          <h5>Scheduled Collection Windows</h5>
          <div className="time-windows-list">
            {opportunity.passes.map(pass => (
              <div key={pass.id} className="time-window-item">
                {formatTimeWindow(pass)}
              </div>
            ))}
          </div>
        </Card>
      </td>
    </tr>
  );
};
```

### Priority 3: Add CSS for Progressive Disclosure

**File:** `CollectionOpportunitiesTable.css`

```css
/* Duration column */
.duration-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.duration-cell .bp5-tag {
  font-weight: 500;
  font-family: monospace;
}

/* Time distribution column */
.time-distribution-cell {
  display: flex;
  align-items: center;
}

.time-distribution-cell .bp5-button {
  font-weight: 600;
  font-family: monospace;
}

/* Expanded time windows */
.expanded-time-windows td {
  padding: 0;
  background: var(--bp5-background-color-selected);
}

.time-windows-detail {
  margin: 8px 12px;
  padding: 12px;
  border-left: 3px solid var(--bp5-intent-primary);
}

.time-windows-detail h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--bp5-text-color-muted);
}

.time-windows-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-window-item {
  font-family: monospace;
  font-size: 13px;
  padding: 4px 8px;
  background: var(--bp5-code-background-color);
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
}

.time-window-item .julian-day {
  color: var(--bp5-intent-warning);
  font-weight: 600;
}

.time-window-item .time-range {
  color: var(--bp5-text-color);
}

.time-window-item .duration {
  color: var(--bp5-text-color-muted);
  font-size: 11px;
}
```

---

## 🎯 Mental Model Alignment: Temporal Data

### Legacy User's Temporal Thinking Pattern

**When Reviewing Available Passes:**
> "I need passes that are at least 5 minutes long for simple collections, or 9+ minutes for complex ones. Let me scan the Duration column to find suitable options."

**Mental Process:**
1. Glance at Duration column
2. Identify passes with > 9m (preferred)
3. Consider > 5m as backup options
4. Eliminate anything shorter

**When Planning Allocation:**
> "I see 'W' which means weekly distribution. I don't need to see every time window right now, but I can expand if I need to verify specific collection times."

**Mental Process:**
1. See distribution summary code (W, D, S)
2. Understand general pattern without details
3. Expand only when needed for verification
4. Collapse back to keep view clean

### Current System: Missing Temporal Context

**User Frustration:**
> "I can see which sites are allocated, but I don't know if the passes are long enough. And I have no idea when the actual collections are scheduled."

**Impact:**
- Cannot quickly assess duration suitability
- Cannot verify time window conflicts
- Cannot plan around operational constraints
- Must mentally calculate or check elsewhere

---

## 📏 Success Metrics: Temporal Data Display

### Duration Column Effectiveness
- **Scan Speed**: User identifies viable passes in <5 seconds
- **Decision Confidence**: User can select appropriate duration without external reference
- **Filter Usage**: >60% of users filter by duration threshold

### Time Distribution Effectiveness
- **Default Clarity**: User understands distribution pattern from summary code
- **Expansion Rate**: <30% of rows expanded (most users satisfied with summary)
- **Time Verification**: When expanded, user confirms time window in <10 seconds

### Overall Temporal Awareness
- **Duration Errors**: <5% of allocations have insufficient duration
- **Time Conflicts**: Zero undetected scheduling conflicts
- **User Satisfaction**: >85% report clear understanding of temporal constraints

---

## 🎬 Conclusion: Temporal Data Integration

**The Temporal Dimension is Missing from Current UI**

We have excellent temporal data in the backend:
- ✅ Pass start/end times
- ✅ Duration calculations
- ✅ Time window formatting utilities

But the UI doesn't surface this data in the patterns legacy users expect:
- ❌ No Duration column in available passes
- ❌ No threshold-based duration display (> 5m, > 9m)
- ❌ No Time Distribution summary codes (W, D, S)
- ❌ No progressive disclosure of time windows
- ❌ No Julian day + Zulu time formatting

**Implementation Priority:**
1. **Week 1-2**: Add Duration column with threshold formatting
2. **Week 3-4**: Add Time Distribution column with summary codes
3. **Week 5-6**: Implement expandable time windows
4. **Week 7**: Polish and user testing

**Risk of Not Fixing:**
- Users cannot assess duration suitability at-a-glance
- Time window verification requires external tools
- Scheduling conflicts go undetected
- Decision-making slows significantly

**Timeline:** 6-7 weeks to achieve full temporal data parity with legacy system
