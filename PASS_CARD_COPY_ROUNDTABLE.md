# Roundtable: Pass Card Copy & Information Audit

**Date**: 2025-10-01
**Participants**: PM, UX Copywriter, Architect, Legacy Operator, Frontend, Scribe
**Objective**: Ensure pass cards in override modal match legacy terminology and data requirements

---

## Current Pass Card Implementation

### Location
**File**: `/Users/damon/malibu/src/components/ManualOverrideModalRefactored.tsx`
**Function**: `renderPassCard()` (lines 551-604)

### Current Display (Lines 572-602)

```typescript
<div className="pass-card">
    <div className="pass-header">
        <strong>{pass.name}</strong>                    // ✅ Pass name
        <Tag intent={pass.priority === 'high' ? Intent.DANGER : Intent.NONE} minimal>
            {pass.priority}                             // ⚠️ Priority (format issue)
        </Tag>
    </div>

    <div className="pass-quality">
        {/* 5-star rating visualization */}              // ❌ NOT in legacy
        <span className="quality-label">Quality: {pass.quality}/5</span>  // ⚠️ Wrong label
    </div>

    <div className="pass-metadata">
        <Tag minimal icon="satellite">
            {pass.metadata?.satellite || 'Unknown'}    // ✅ Satellite
        </Tag>
        <Tag minimal icon="time">
            {new Date(pass.startTime).toLocaleTimeString()}  // ⚠️ Format issue
        </Tag>
    </div>

    <div className="pass-sites">
        <small>Available for {pass.siteCapabilities.length} sites</small>  // ❌ NOT in legacy
    </div>
</div>
```

---

## Legacy Operator Input

**Legacy Operator**: "In the old system, each pass card showed exactly this information, in this order:

1. **Pass Unit** - e.g., 'Unit-3, Pass-27' (not just 'pass.name')
2. **Classification Level** - UNCLASSIFIED / CONFIDENTIAL / SECRET / TOP SECRET (banner color-coded)
3. **Priority** - CRITICAL / HIGH / NORMAL (uppercase, red/orange/gray)
4. **Time Window** - Start/End in Zulu time (e.g., '0500Z - 0520Z')
5. **Conflict Indicator** - Red badge if conflicts exist

We did NOT show:
- Star ratings (that's not how we think about passes)
- 'Available for X sites' (we know that already)
- Localized times (everything is Zulu)

The language was **terse** and **military-standard**. No friendly 'Quality: 3/5' labels. Just facts."

---

## Pass Type Definition Analysis

**Architect**: "Looking at the `Pass` interface in `/Users/damon/malibu/src/types/collectionOpportunities.ts` (lines 380-407), we have:

```typescript
export interface Pass {
  readonly id: PassId;
  readonly name: string;                                    // ✅ Have it
  readonly startTime: Date;                                 // ✅ Have it
  readonly endTime: Date;                                   // ✅ Have it
  readonly quality: PassQuality; // 1-5 scale              // ✅ Have it (but wrong display)
  readonly duration?: PassDuration;
  readonly elevation?: Degrees;
  readonly azimuth?: Degrees;
  readonly siteCapabilities: ReadonlyArray<Site>;
  readonly priority: PassPriority;                          // ✅ Have it ('normal' | 'high' | 'critical')
  readonly classificationLevel: ClassificationLevel;        // ✅ Have it (but NOT displayed!)
  readonly conflictsWith?: ReadonlyArray<PassId>;           // ✅ Have it (but NOT displayed!)
  readonly requiredResources?: ReadonlyArray<ResourceRequirement>;
  readonly metadata?: PassMetadata;
}
```

**Critical Missing Display**:
- ❌ `classificationLevel` - **MUST SHOW** (P0)
- ❌ `conflictsWith` - **MUST SHOW** (P0)

**Wrong Display**:
- ⚠️ Quality shown as stars instead of text
- ⚠️ Time shown in local format instead of Zulu
- ⚠️ Priority shown as lowercase

**Unnecessary Display**:
- ❌ 'Available for X sites' - remove"

---

## UX Copywriter Analysis

**Copywriter**: "The current copy doesn't match legacy voice and tone:

### Current vs Legacy

| Current | Legacy | Fix |
|---------|--------|-----|
| `Quality: 3/5` | *Not shown* or `QUAL-3` | Remove stars, use `QUAL-{n}` if needed |
| `high` (priority tag) | `HIGH` | Uppercase |
| `3:42 PM` (time) | `1542Z` | Zulu format: `HHmmZ` |
| `Available for 3 sites` | *Not shown* | Remove |
| *Missing* | `SECRET` (classification) | Add banner at top |
| *Missing* | `⚠ 2 CONFLICTS` | Add badge if conflicts exist |

### Voice & Tone Patterns

**Legacy System**:
- **Terse**: No unnecessary words
- **Uppercase**: Priority levels, classification
- **Military Time**: Always Zulu (UTC), format `HHmmZ`
- **Color-Coded**: Classification levels have standard colors
  - UNCLASSIFIED: Green
  - CONFIDENTIAL: Blue
  - SECRET: Red
  - TOP SECRET: Orange
- **Status-Driven**: Show problems (conflicts) immediately

**Current System**:
- Too verbose ('Available for...')
- Mixed case (should be UPPERCASE for emphasis)
- Localized time (should be Zulu)
- No classification (security risk!)
- No conflict warnings (usability issue)"

---

## Frontend Developer Input

**Frontend**: "Here's what we need to change:

### Priority Tag
```typescript
// Current
<Tag intent={pass.priority === 'high' ? Intent.DANGER : Intent.NONE} minimal>
    {pass.priority}
</Tag>

// Should be
<Tag
    intent={
        pass.priority === 'critical' ? Intent.DANGER :
        pass.priority === 'high' ? Intent.WARNING : Intent.NONE
    }
    minimal
>
    {pass.priority.toUpperCase()}  // CRITICAL, HIGH, NORMAL
</Tag>
```

### Classification Banner
```typescript
// NEW - Add at top of pass card
<div className={`classification-banner classification-${pass.classificationLevel.toLowerCase()}`}>
    {pass.classificationLevel}  // UNCLASSIFIED, SECRET, etc.
</div>
```

### Time Window (Zulu Format)
```typescript
// Current
<Tag minimal icon="time">
    {new Date(pass.startTime).toLocaleTimeString()}
</Tag>

// Should be
<div className="time-window">
    <Icon icon="time" size={12} />
    <span>
        {formatZuluTime(pass.startTime)} - {formatZuluTime(pass.endTime)}
    </span>
</div>

// Helper function
function formatZuluTime(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}Z`;
}
```

### Conflict Indicator
```typescript
// NEW - Add after priority tag
{pass.conflictsWith && pass.conflictsWith.length > 0 && (
    <Tag intent={Intent.DANGER} icon="warning-sign" minimal>
        {pass.conflictsWith.length} CONFLICT{pass.conflictsWith.length > 1 ? 'S' : ''}
    </Tag>
)}
```

### Quality Display
```typescript
// Current - REMOVE star visualization entirely
<div className="pass-quality">
    {/* 5-star rating - DELETE THIS */}
    <span className="quality-label">Quality: {pass.quality}/5</span>
</div>

// Option 1: Don't show at all (legacy didn't have it)
// Option 2: Show as terse label
<Tag minimal>QUAL-{pass.quality}</Tag>
```"

---

## PM Decision Matrix

**PM**: "Let's prioritize:

### P0 (Must Fix - Security/Usability)
1. ✅ **Add Classification Level Banner** - Security requirement
2. ✅ **Add Conflict Indicator** - Operators need to see this
3. ✅ **Fix Time Format to Zulu** - Operational requirement
4. ✅ **Uppercase Priority** - Consistency with legacy

### P1 (Should Fix - UX Polish)
5. ✅ **Remove 'Available for X sites'** - Unnecessary noise
6. ✅ **Remove/Simplify Quality Display** - Legacy didn't have stars
7. ✅ **Reorder Elements** - Classification → Name → Priority → Time → Conflicts

### P2 (Nice to Have)
8. ⏳ **Add Duration** - e.g., '(20 min)'
9. ⏳ **Add Elevation** - e.g., '47° elevation' (if space permits)"

---

## Proposed New Pass Card Layout

```
┌─────────────────────────────────────────────────────┐
│ SECRET                                              │ ← Classification banner (color-coded)
├─────────────────────────────────────────────────────┤
│ Unit-3, Pass-27                          [CRITICAL] │ ← Pass name + Priority tag
│                                                     │
│ 🛰 WV-3                                             │ ← Satellite
│ ⏱ 1542Z - 1602Z                                    │ ← Time window (Zulu)
│                                                     │
│ ⚠ 2 CONFLICTS                                      │ ← Conflict indicator (if any)
└─────────────────────────────────────────────────────┘
```

### Character Count
- **Legacy**: ~60-80 characters per card
- **Current**: ~120-150 characters (too verbose)
- **Proposed**: ~70-90 characters ✅

---

## Scribe Language Preservation Checklist

**Scribe**: "For ubiquitous language consistency:

### Terminology Standards

| Term | Legacy | Current | Status |
|------|--------|---------|--------|
| Time | `1542Z - 1602Z` | `3:42 PM - 4:02 PM` | ❌ Fix |
| Priority | `CRITICAL`, `HIGH`, `NORMAL` | `critical`, `high`, `normal` | ❌ Fix |
| Classification | `SECRET`, `TOP SECRET` | *Not shown* | ❌ Add |
| Conflicts | `2 CONFLICTS` | *Not shown* | ❌ Add |
| Quality | *Not shown* or `QUAL-3` | `Quality: 3/5` ⭐⭐⭐ | ❌ Fix |
| Unit | `Unit-3, Pass-27` | `pass.name` (variable) | ✅ OK (if name formatted correctly) |

### Voice & Tone Rules
1. **ALL CAPS** for: Classification levels, priority HIGH/CRITICAL, status words (CONFLICTS)
2. **Title Case** for: Pass names, satellite names
3. **Zulu Time** for: All timestamps (format: `HHmmZ`)
4. **Terse Labels** for: All metadata (no 'Available for...' prose)
5. **Color Coding** for: Classification levels (standard DOD colors)"

---

## Implementation Plan

### Phase 1: Security & Critical UX (P0) - 2 hours

**File**: `/Users/damon/malibu/src/components/ManualOverrideModalRefactored.tsx`

1. Add `formatZuluTime()` helper function
2. Update `renderPassCard()` to include:
   - Classification banner at top
   - Uppercase priority
   - Zulu time format
   - Conflict indicator

**File**: `/Users/damon/malibu/src/components/ManualOverrideModalRefactored.css`

3. Add classification banner styles:
   ```css
   .classification-banner {
     padding: 2px 8px;
     font-weight: bold;
     font-size: 10px;
     text-align: center;
     border-bottom: 2px solid;
   }

   .classification-unclassified {
     background: #0F9960;
     color: white;
     border-color: #0D8050;
   }

   .classification-confidential {
     background: #2B95D6;
     color: white;
     border-color: #1F77B4;
   }

   .classification-secret {
     background: #DB3737;
     color: white;
     border-color: #C23030;
   }

   .classification-top_secret {
     background: #F29D49;
     color: white;
     border-color: #D68537;
   }
   ```

### Phase 2: UX Polish (P1) - 1 hour

4. Remove star rating visualization
5. Remove 'Available for X sites' text
6. Reorder elements to match legacy layout

### Phase 3: Testing - 1 hour

7. Create Playwright test to verify:
   - Classification displayed
   - Priority uppercase
   - Time in Zulu format
   - Conflicts shown
8. Visual regression screenshots

---

## Acceptance Criteria

### ✅ Pass Card Must Include (P0)
- [ ] Classification level banner (color-coded)
- [ ] Pass name
- [ ] Priority in UPPERCASE
- [ ] Time window in Zulu format (`HHmmZ - HHmmZ`)
- [ ] Conflict indicator (if applicable)
- [ ] Satellite name

### ❌ Pass Card Must NOT Include
- [ ] Star rating visualization
- [ ] 'Available for X sites' text
- [ ] Localized time formats
- [ ] Lowercase priority

### ✅ Visual Design
- [ ] Classification colors match DOD standard
- [ ] Card height ≤ 150px
- [ ] Character count ≤ 90 per card
- [ ] Terse, scannable layout

---

## Legacy Operator Verdict

**Operator**: "Once this is fixed, I'll be able to scan pass cards at a glance like I used to:

1. **Classification** - Do I have clearance?
2. **Priority** - Is this urgent?
3. **Time** - Does this fit my timeline?
4. **Conflicts** - Do I need to resolve something?

Right now, I'm wasting time parsing 'Quality: 3/5' stars and wondering why classification isn't shown. That's a security issue and a usability problem."

---

## Files to Modify

1. `/Users/damon/malibu/src/components/ManualOverrideModalRefactored.tsx` - Update `renderPassCard()`
2. `/Users/damon/malibu/src/components/ManualOverrideModalRefactored.css` - Add classification styles
3. `/Users/damon/malibu/test-pass-card-legacy-copy.spec.ts` (NEW) - Verify changes

---

## Estimated Time

- **Phase 1 (P0)**: 2 hours
- **Phase 2 (P1)**: 1 hour
- **Phase 3 (Testing)**: 1 hour
- **Total**: 4 hours

---

**Status**: ⏳ **READY FOR IMPLEMENTATION**
**Priority**: **P0** - Security and usability critical
**Blockers**: None
**Next Action**: Implement Phase 1 changes to `renderPassCard()`
