# Override Workflow: Data Flow Validation
**Legacy System Data Flow vs. Current Implementation**
**Date**: 2025-10-01
**Focus**: Data hydration, state management, and persistence patterns

---

## 🎯 Executive Summary

**Critical Finding**: Our current system handles **data transformations correctly** but **fails to enforce the data validation gates and sequential data collection** that the legacy system uses to ensure data integrity.

**Legacy Data Flow Philosophy**:
> "Each user action transforms local state → System validates completeness → Gates prevent submission until all required data collected → Final confirmation before persistence"

**Current System Gap**:
> "User actions transform state correctly → But validation is optional → No gates prevent incomplete data submission → Impact data not always calculated before commit"

---

## 📊 Step-by-Step Data Flow Validation

### Step 1: Initial Data Hydration

#### Legacy System Data Flow
```javascript
// INPUT
taskId = "SCC 10893"

// SYSTEM FETCHES & LOADS
modalData = {
  header: {
    sccId: "10893",
    orbit: "MEO",
    priority: 51,
    periodicity: 6
  },

  availablePasses: [
    // Filtered to OPTIMAL by default
    { quality: "Optimal", site: "DG", passes: 8, capacity: "9/100", ... },
    { quality: "Optimal", site: "SC", passes: 5, capacity: "7/100", ... },
    { quality: "Optimal", site: "HI", passes: 6, capacity: "5/100", ... }
  ],

  currentAllocation: [
    // Pre-selected optimal sites
    { site: "DG", collects: 8, assignedPasses: [...], ... },
    { site: "SC", collects: 5, assignedPasses: [...], ... },
    { site: "HI", collects: 6, assignedPasses: [...], ... }
  ]
}
```

#### Current System Data Flow

**✅ HAVE: Data Loading Pattern**
```typescript
// CollectionOpportunitiesHub.tsx (lines 914-985)
const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
const [sites, setSites] = useState<Site[]>([]);

useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const mockData = generateCompleteMockData();
      setOpportunities(mockData.opportunities);
      setSites(mockData.availableSites);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [collectionId]);
```

**✅ HAVE: Modal/Detail View Pattern**
```typescript
// UnifiedOpportunityEditor.tsx (lines 45-58)
export const UnifiedOpportunityEditor: React.FC<UnifiedEditorProps> = ({
  opportunity,        // Single selected opportunity (like SCC 10893)
  availableSites,     // Available sites dataset
  availablePasses,    // Available passes dataset
  mode,               // 'quick' | 'standard' | 'override'
  // ...
})
```

**⚠️ GAP: Default Optimal Filtering Not Enforced**
```typescript
// Current: No default filter to show OPTIMAL passes only
// availablePasses includes ALL quality levels by default

// NEEDED:
const defaultFilteredPasses = availablePasses.filter(pass =>
  pass.quality === 'Optimal'
);
// + "Show All" toggle to reveal Baseline/Suboptimal
```

**📊 Validation Status: PARTIAL MATCH**
- ✅ Data structures exist for opportunity, sites, passes
- ✅ Modal pattern for focused task view
- ❌ **Missing**: Default optimal-only filtering
- ❌ **Missing**: Two-panel "available vs current" data separation in UI state

---

### Step 2: Data State Modification in UI

#### Legacy System Data Flow

**De-selection (Remove DG):**
```javascript
// USER ACTION: Uncheck DG checkbox
onCheckboxChange(siteId: "DG", checked: false)

// STATE TRANSFORMATION
currentAllocation = currentAllocation.filter(site => site.id !== "DG")
// DG object REMOVED from right panel dataset

// CAPACITY UPDATE
availablePasses.find(p => p.site === "DG").capacity = "8/100" // was 9/100
```

**Selection (Add ALT):**
```javascript
// USER ACTION: Check ALT checkbox
onCheckboxChange(siteId: "ALT", checked: true)

// STATE TRANSFORMATION
const altPass = availablePasses.find(p => p.site === "ALT")
currentAllocation.push({
  site: "ALT",
  collects: 1,
  assignedPasses: [altPass],
  timeDistribution: calculateDistribution(altPass)
})
// ALT object ADDED to right panel dataset

// CAPACITY UPDATE
altPass.capacity = "1/8" // was 0/8
```

#### Current System Data Flow

**✅ HAVE: State Management in UnifiedEditor Hook**
```typescript
// hooks/useUnifiedEditor.ts (inferred from UnifiedOpportunityEditor.tsx)
const editor = useUnifiedEditor(opportunity, availableSites, {
  mode,
  enableRealTimeValidation,
  capacityThresholds
});

// State includes:
editor.state.opportunity        // Current opportunity being edited
editor.state.selectedSites      // Array of selected sites
editor.state.justification      // Override justification
```

**✅ HAVE: Allocation State Management**
```typescript
// contexts/AllocationContext.tsx (lines 461-482)
const [state, dispatch] = useReducer(allocationReducer, initialState);

// Actions available:
dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { id, changes } })
dispatch({ type: 'UPDATE_HEALTH_SCORES', payload: healthScores })
```

**✅ HAVE: Real-time Capacity Updates**
```typescript
// AllocationContext.tsx (lines 467-482)
useEffect(() => {
  const healthScores = calculateBatchHealth(
    state.opportunities,
    state.capacityThresholds
  );
  dispatch({ type: 'UPDATE_HEALTH_SCORES', payload: healthScores });
}, [state.opportunities.length, state.capacityThresholds]);
```

**⚠️ GAP: Two-Panel State Synchronization**
```typescript
// CURRENT: Single state object
state.opportunity.allocatedSites = [...]

// NEEDED: Explicit "available vs selected" state
state = {
  availablePasses: [...],     // Left panel dataset
  currentAllocation: [...],   // Right panel dataset
  selectedPassIds: Set<string>  // Checkbox states
}

// NEEDED: Synchronized updates
function togglePassSelection(passId: string) {
  if (selectedPassIds.has(passId)) {
    // Remove from current allocation
    // Update capacity: allocated--
  } else {
    // Add to current allocation
    // Update capacity: allocated++
  }
}
```

**📊 Validation Status: PARTIAL MATCH**
- ✅ State management infrastructure exists
- ✅ Real-time updates on state changes
- ✅ Health/capacity recalculation
- ⚠️ **Gap**: No explicit two-panel state synchronization pattern
- ⚠️ **Gap**: Capacity updates may not be immediate on checkbox toggle

---

### Step 3: Data Set Expansion

#### Legacy System Data Flow
```javascript
// USER ACTION: Click "Show All" checkbox
onShowAllChange(checked: true)

// DATA FETCH/REVEAL
const additionalPasses = fetchPassesWithAllQualities(sccId)
// Returns passes with quality: "Baseline", "Suboptimal"

// STATE TRANSFORMATION
availablePasses = [
  ...availablePasses,  // Keep existing Optimal passes
  ...additionalPasses.filter(p =>
    p.quality === "Baseline" || p.quality === "Suboptimal"
  )
]

// UI RE-RENDER
// Left panel now shows:
// - Optimal passes (original)
// - Baseline passes (NEW, visually distinct)
// - Suboptimal passes (NEW, visually distinct)
```

#### Current System Data Flow

**⚠️ HAVE: Smart Views (Different Mental Model)**
```typescript
// CollectionOpportunitiesHub.tsx (lines 127-130)
const [activeView, setActiveView] = useState<SmartView | null>(null);

// Smart Views = Saved configurations, NOT progressive disclosure
type SmartView = {
  name: string;
  filter: FilterCriteria;
  sort: SortCriteria;
}
```

**⚠️ HAVE: Search/Filter (Different Pattern)**
```typescript
// CollectionOpportunitiesHub.tsx (line 128)
const [searchQuery, setSearchQuery] = useState('');

// Search = Find specific items, NOT "show all quality levels"
```

**❌ MISSING: "Show All Quality Levels" Toggle**
```typescript
// NEEDED: Progressive disclosure pattern
const [showAllQualityLevels, setShowAllQualityLevels] = useState(false);

const visiblePasses = useMemo(() => {
  if (showAllQualityLevels) {
    return availablePasses; // All qualities
  }
  return availablePasses.filter(p => p.quality === 'Optimal');
}, [availablePasses, showAllQualityLevels]);

// UI:
// <Switch
//   label="Show All Quality Levels (includes Baseline & Suboptimal)"
//   checked={showAllQualityLevels}
//   onChange={() => setShowAllQualityLevels(!showAllQualityLevels)}
// />
```

**📊 Validation Status: MISSING**
- ❌ **No "Show All" toggle** - Different mental model (Smart Views vs Progressive Disclosure)
- ❌ **No default optimal-only filter** - All data visible by default OR hidden in wrong way
- ❌ **No visual differentiation** for quality tiers when expanded
- ⚠️ Search/filter exists but serves different purpose (find vs expand)

---

### Step 4: Data Validation and Gating

#### Legacy System Data Flow
```javascript
// USER ACTION: Click "Allocate" button (first time)
onAllocateClick()

// VALIDATION CHECK
const isOverride = detectOverride(currentAllocation, optimalAllocation)
// Returns TRUE if user selected non-optimal passes

if (isOverride) {
  // GATE: Block submission, require justification
  setRequiresJustification(true)

  // UI STATE CHANGE
  // Show justification text field (was hidden)
  // "Allocate" button stays enabled but won't submit yet

  // NEW REQUIRED DATA
  justificationData = {
    required: true,
    minLength: 50,
    placeholder: "Comment required to override site allocation (Secret Data Only)",
    value: null  // User must populate
  }
} else {
  // No override detected, proceed to save
  submitAllocation()
}
```

#### Current System Data Flow

**✅ HAVE: Justification Form Component**
```typescript
// OverrideJustificationForm.tsx (lines 42-64)
export const OverrideJustificationForm: React.FC<Props> = ({
  originalSiteId,
  originalSiteName,
  alternativeSiteId,
  alternativeSiteName,
  onJustificationChange,
  userId,
  disabled = false
}) => {
  const [category, setCategory] = useState<Category | ''>('');
  const [reason, setReason] = useState('');

  const MIN_REASON_LENGTH = 50;

  // Validation
  const validation = useMemo(() => {
    if (!category || !reason) {
      return { valid: false, errors: [] };
    }
    // ... validates min length, required fields
  }, [category, reason, ...]);
}
```

**❌ MISSING: Override Detection Logic**
```typescript
// NEEDED: Automatic override detection
function detectOverride(
  currentAllocation: Allocation[],
  systemRecommendation: Allocation[]
): boolean {
  // Check if user's selection differs from optimal
  const currentSiteIds = new Set(currentAllocation.map(a => a.siteId));
  const optimalSiteIds = new Set(systemRecommendation.map(a => a.siteId));

  // Different sites = override
  if (currentSiteIds.size !== optimalSiteIds.size) return true;

  for (const siteId of currentSiteIds) {
    if (!optimalSiteIds.has(siteId)) return true;
  }

  return false;
}
```

**❌ MISSING: Automatic Justification Gating**
```typescript
// CURRENT: Justification form exists but is NOT automatically shown
// User can access via different modes but it's not enforced

// NEEDED: Forcing function
const handleSave = async () => {
  const isOverride = detectOverride(state.currentAllocation, state.optimalAllocation);

  if (isOverride && !state.justification?.reason) {
    // GATE: Prevent save, show justification form
    setShowJustificationForm(true);
    return; // Block submission
  }

  // Only proceed if justified or not an override
  await submitChanges();
}
```

**📊 Validation Status: CRITICAL GAP**
- ✅ Justification form component exists with proper validation
- ❌ **CRITICAL**: No automatic override detection
- ❌ **CRITICAL**: No gating logic that prevents save without justification
- ❌ **CRITICAL**: Justification is optional, not required
- ⚠️ Can access justification via "override mode" but mode selection is manual

---

### Step 5: Data Submission and System-Side Processing

#### Legacy System Data Flow
```javascript
// USER ACTION: Type "Override" in comment field, click "Allocate" (second time)
onAllocateClick()

// DATA VALIDATION
const justificationValid = justification.value.length >= 1 // Any text required

if (!justificationValid) {
  // Gate still active, show error
  return
}

// DATA PACKAGE ASSEMBLY
const submissionPackage = {
  sccId: "10893",
  finalAllocation: [
    { site: "SC", collects: 5, ... },
    { site: "ALT", collects: 1, ... },
    { site: "HI", collects: 6, quality: "Baseline", ... }
  ],
  justification: {
    reason: "Override",
    userId: getCurrentUser(),
    timestamp: new Date().toISOString(),
    classificationLevel: "SECRET"
  },
  metadata: {
    isOverride: true,
    originalAllocation: [...],  // For audit trail
    qualityDelta: -14  // Quality dropped from 92% to 78%
  }
}

// BACKEND CALL
const response = await api.submitAllocationOverride(submissionPackage)

// SYSTEM RESPONSE: Impact Calculation
response = {
  success: false,  // Not saved yet!
  requiresConfirmation: true,
  warning: {
    type: "CAPACITY_IMPACT",
    message: "This override will impact weekly capacity",
    impacts: [
      { site: "HI", capacityBefore: "5/100", capacityAfter: "4/100" },
      { site: "DG", capacityBefore: "9/100", capacityAfter: "8/100" },
      { weeklyCapacity: "58/100", newWeeklyCapacity: "56/100" }
    ]
  }
}

// UI STATE CHANGE
// Show "Capacity Warning" modal with impact data
// User MUST acknowledge before final commit
```

#### Current System Data Flow

**✅ HAVE: Data Package Assembly**
```typescript
// UnifiedOpportunityEditor.tsx (lines 71-102)
const handleSave = useCallback(async () => {
  if (!editor.isValid) {
    console.warn('Validation failed:', editor.validation.errors);
    return;
  }

  const changes: Partial<typeof opportunity> = {
    ...editor.state.opportunity,
    changeJustification: editor.state.justification,
    classificationLevel: editor.state.classificationLevel,
    lastModified: new Date().toISOString(),
    modifiedBy: 'current-user',
  };

  await onSave(opportunity.id, changes);
  onClose();
}, [opportunity.id, editor, onSave, onClose]);
```

**✅ HAVE: Impact Calculation**
```typescript
// utils/opportunityHealth.ts (inferred)
export function calculateOpportunityHealth(
  opportunity: CollectionOpportunity
): OpportunityHealth {
  // Calculates health scores, capacity impacts
}

// components/OverrideImpactCalculator.tsx exists
```

**❌ MISSING: Server-Side Impact Validation**
```typescript
// CURRENT: Client calculates impact but doesn't REQUIRE server confirmation

// NEEDED: Server validates and returns impact warning
async function submitAllocationOverride(data: OverrideData) {
  const response = await api.post('/allocations/override', data);

  if (response.requiresConfirmation) {
    // Server says: "This will break capacity, confirm?"
    return {
      success: false,
      pendingConfirmation: true,
      impacts: response.impacts
    };
  }

  return response;
}
```

**❌ MISSING: Pre-Commit Warning Gate**
```typescript
// NEEDED: Don't save immediately, show warning first
const handleSave = async () => {
  const submission = assembleDataPackage();

  const response = await submitAllocationOverride(submission);

  if (response.requiresConfirmation) {
    // GATE: Show impact warning modal
    setImpactWarning(response.impacts);
    setShowWarningModal(true);
    // User must click "Yes, I understand" to proceed
    return; // Block until confirmed
  }

  // Only close modal after confirmation
  onClose();
}
```

**📊 Validation Status: CRITICAL GAP**
- ✅ Data package assembly with justification
- ✅ Impact calculation capabilities exist
- ❌ **CRITICAL**: No server-side impact validation before commit
- ❌ **CRITICAL**: No forced warning modal with impact preview
- ❌ **CRITICAL**: Save happens immediately without confirmation gate
- ⚠️ Impact calculator exists but not integrated into save flow

---

### Step 6: Data Persistence

#### Legacy System Data Flow
```javascript
// USER ACTION: Click "Yes" on capacity warning modal
onWarningConfirm()

// FINAL CONFIRMATION SENT
const confirmationPackage = {
  ...originalSubmissionPackage,
  impactAcknowledged: true,
  confirmedAt: new Date().toISOString(),
  confirmedBy: getCurrentUser()
}

// BACKEND TRANSACTION
await api.commitAllocationOverride(confirmationPackage)

// DATABASE OPERATIONS
// 1. Begin transaction
// 2. Update allocation record for SCC 10893
// 3. Replace optimal allocation with override allocation
// 4. Store justification in audit log
// 5. Store impact acknowledgment
// 6. Update capacity aggregates
// 7. Commit transaction

// SUCCESS RESPONSE
response = {
  success: true,
  allocationId: "10893",
  commitTimestamp: "2025-10-01T10:30:00Z",
  capacityUpdated: true,
  auditLogId: "audit-12345"
}

// UI STATE CHANGE
// Close warning modal
// Close allocation modal
// Refresh main table to show updated allocation
// Show success toast: "Allocation updated for SCC 10893"
```

#### Current System Data Flow

**✅ HAVE: Save Handler**
```typescript
// UnifiedOpportunityEditor.tsx (lines 71-102)
const handleSave = useCallback(async () => {
  try {
    const changes = assembleChanges();
    await onSave(opportunity.id, changes);
    onClose(); // Success - close modal
  } catch (error) {
    setSaveError(error.message); // Show error
  }
}, [opportunity.id, editor, onSave, onClose]);
```

**✅ HAVE: State Updates After Save**
```typescript
// AllocationContext.tsx (lines 480-487)
const updateOpportunity = useCallback((id: string, changes: Partial<CollectionOpportunity>) => {
  dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { id, changes } });
}, []);

// Updates local state after successful save
```

**❌ MISSING: Acknowledgment Data in Persistence**
```typescript
// CURRENT: Saves justification but not impact acknowledgment

// NEEDED: Include acknowledgment in persistence
const finalCommit = {
  ...changes,
  justification: {
    reason: justification.reason,
    category: justification.category,
    providedAt: timestamp
  },
  impactAcknowledgment: {  // MISSING
    acknowledged: true,
    impacts: calculatedImpacts,
    acknowledgedAt: timestamp,
    acknowledgedBy: userId
  }
}
```

**❌ MISSING: Two-Stage Commit Pattern**
```typescript
// CURRENT: Single save call

// NEEDED: Two-stage pattern
// Stage 1: Validate & get impacts (done in Step 5)
const validation = await api.validateOverride(data);

// Stage 2: Only commit after user confirms impact
if (userConfirmedImpact) {
  await api.commitOverride(data, validation.impactId);
}
```

**📊 Validation Status: PARTIAL MATCH**
- ✅ Save handler exists
- ✅ Local state updates after save
- ✅ Success/error feedback
- ❌ **Gap**: No impact acknowledgment stored in persistence
- ❌ **Gap**: Single-stage save, not two-stage validate→confirm→commit
- ⚠️ Audit trail partial - has justification but missing impact acknowledgment

---

## 🚨 Critical Data Flow Gaps Summary

### 1. Missing Default Optimal Filtering (Step 1 & 3)
**Legacy:** `availablePasses` filtered to show OPTIMAL only by default
**Current:** All passes shown, or wrong filter mental model (Smart Views)
**Impact:** Cognitive overload, wrong mental model

### 2. Missing Two-Panel State Synchronization (Step 2)
**Legacy:** Explicit `availablePasses` ↔️ `currentAllocation` state sync
**Current:** Single `opportunity.allocatedSites` state
**Impact:** Harder to track "what's available" vs "what's selected"

### 3. Missing "Show All" Progressive Disclosure (Step 3)
**Legacy:** Toggle to expand from Optimal to include Baseline/Suboptimal
**Current:** Different patterns (Smart Views, Search) - wrong mental model
**Impact:** Users can't find alternatives they need

### 4. Missing Override Detection & Gating (Step 4) ⚠️ CRITICAL
**Legacy:** System detects deviation from optimal → Forces justification
**Current:** Justification form exists but isn't automatically triggered
**Impact:** Users can save overrides without documentation

### 5. Missing Pre-Commit Impact Warning (Step 5) ⚠️ CRITICAL
**Legacy:** Server returns impacts → Warning modal → User must confirm
**Current:** Impact calculation exists but no forced warning before save
**Impact:** Users can break capacity without realizing

### 6. Missing Impact Acknowledgment Persistence (Step 6)
**Legacy:** Stores both justification AND impact acknowledgment
**Current:** Stores justification only
**Impact:** Incomplete audit trail - can't prove user knew about impacts

---

## ✅ Recommendations: Data Flow Alignment

### Priority 1: Implement Override Detection & Gating (CRITICAL)

```typescript
// Add to save handler
const handleAllocate = async () => {
  // STEP 1: Detect override
  const isOverride = detectOverride(
    editor.state.selectedSites,
    opportunity.systemRecommendedSites
  );

  // STEP 2: Gate if override without justification
  if (isOverride && !editor.state.justification?.reason) {
    setShowJustificationForm(true);
    return; // BLOCK save
  }

  // STEP 3: Calculate impact
  const impacts = calculateImpact(editor.state);

  // STEP 4: Gate if no impact acknowledgment
  if (impacts.affectsCapacity && !impactAcknowledged) {
    setImpactData(impacts);
    setShowWarningModal(true);
    return; // BLOCK save
  }

  // STEP 5: Only now can we save
  await commitChanges();
};
```

### Priority 2: Add Two-Panel State Management

```typescript
// Restructure state to match legacy pattern
type AllocationEditorState = {
  // Left panel: Available options
  availablePasses: Pass[];
  defaultFilter: 'optimal' | 'all';

  // Right panel: Current plan
  currentAllocation: Allocation[];

  // Synchronization
  selectedPassIds: Set<string>;

  // Validation
  systemRecommendedAllocation: Allocation[];
  isOverride: boolean;
}

// Synchronize on checkbox change
function togglePass(passId: string) {
  if (selectedPassIds.has(passId)) {
    // Remove from allocation
    setSelectedPassIds(prev => {
      const next = new Set(prev);
      next.delete(passId);
      return next;
    });
    setCurrentAllocation(prev =>
      prev.filter(a => a.passId !== passId)
    );
  } else {
    // Add to allocation
    setSelectedPassIds(prev => new Set(prev).add(passId));
    const pass = availablePasses.find(p => p.id === passId);
    setCurrentAllocation(prev => [...prev, createAllocation(pass)]);
  }

  // Trigger override detection
  setIsOverride(
    detectOverride(currentAllocation, systemRecommendedAllocation)
  );
}
```

### Priority 3: Implement "Show All" Toggle

```typescript
// Add progressive disclosure
const [showAllQualityLevels, setShowAllQualityLevels] = useState(false);

const displayedPasses = useMemo(() => {
  if (showAllQualityLevels) {
    return availablePasses; // All: Optimal + Baseline + Suboptimal
  }
  return availablePasses.filter(p => p.quality === 'Optimal');
}, [availablePasses, showAllQualityLevels]);

// UI
<FormGroup label="Available Passes">
  <Switch
    label="Show all quality levels (includes Baseline & Suboptimal)"
    checked={showAllQualityLevels}
    onChange={(e) => setShowAllQualityLevels(e.target.checked)}
  />
  {/* Render displayedPasses */}
</FormGroup>
```

### Priority 4: Add Impact Warning Gate

```typescript
// Two-stage save pattern
const [pendingSubmission, setPendingSubmission] = useState(null);
const [impactData, setImpactData] = useState(null);

const handleSave = async () => {
  // Stage 1: Validate and calculate impacts
  const submission = assembleDataPackage();
  const validation = await api.validateAllocation(submission);

  if (validation.hasImpacts) {
    // GATE: Show warning, don't save yet
    setPendingSubmission(submission);
    setImpactData(validation.impacts);
    setShowImpactModal(true);
    return;
  }

  // No impacts, safe to save
  await commitChanges(submission);
};

const handleImpactConfirm = async () => {
  // Stage 2: User confirmed, now commit
  const finalSubmission = {
    ...pendingSubmission,
    impactAcknowledgment: {
      acknowledged: true,
      impacts: impactData,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId
    }
  };

  await commitChanges(finalSubmission);
  setShowImpactModal(false);
  onClose();
};
```

### Priority 5: Persist Impact Acknowledgment

```typescript
// Update save data structure
interface AllocationSubmission {
  opportunityId: string;
  finalAllocation: Allocation[];

  justification: {
    category: string;
    reason: string;
    providedAt: string;
    providedBy: string;
  };

  // ADD: Impact acknowledgment
  impactAcknowledgment?: {
    acknowledged: boolean;
    impacts: ImpactData;
    acknowledgedAt: string;
    acknowledgedBy: string;
  };

  metadata: {
    isOverride: boolean;
    originalAllocation: Allocation[];
    qualityDelta?: number;
  };
}
```

---

## 📏 Data Integrity Validation Checklist

### ✅ Data Flow Requirements

**Step 1: Initial Hydration**
- [ ] Load opportunity header data (SCC, orbit, priority, periodicity)
- [ ] Load available passes dataset
- [ ] **Default filter to Optimal quality only**
- [ ] Load current allocation (pre-selected sites)
- [ ] Sync checkbox states with current allocation

**Step 2: State Modifications**
- [ ] Checkbox de-selection removes from current allocation
- [ ] Checkbox selection adds to current allocation
- [ ] Capacity updates in real-time on each change
- [ ] Two-panel state stays synchronized

**Step 3: Data Expansion**
- [ ] "Show All" toggle reveals Baseline & Suboptimal passes
- [ ] Expanded data visually differentiated by quality tier
- [ ] Original Optimal passes remain visible

**Step 4: Validation Gating**
- [ ] **Detect when user deviates from optimal allocation**
- [ ] **Automatically show justification form (gate)**
- [ ] **Prevent save until justification provided**
- [ ] Validate justification completeness (min length, category)

**Step 5: Impact Warning**
- [ ] Calculate capacity impacts before submission
- [ ] **Show impact warning modal (gate)**
- [ ] **Require explicit acknowledgment**
- [ ] Include impact data in submission package

**Step 6: Persistence**
- [ ] Store final allocation
- [ ] Store justification with metadata
- [ ] **Store impact acknowledgment**
- [ ] Update capacity aggregates
- [ ] Create audit log entry
- [ ] Refresh UI with new data

---

## 🎯 Success Metrics: Data Integrity

### Data Completeness (Target: 100%)
- ✅ **Every override has justification**: Category + reason text
- ✅ **Every capacity-affecting change has impact acknowledgment**: User confirmed understanding
- ✅ **Every change has audit trail**: Who, what, when, why

### Data Validation (Target: Zero Invalid Submissions)
- ✅ **Cannot save override without justification**: Forcing function prevents it
- ✅ **Cannot save capacity change without acknowledgment**: Warning gate prevents it
- ✅ **Cannot bypass validation**: Gates are architectural, not just UI

### Data Flow Accuracy (Target: <1% Error Rate)
- ✅ **Checkbox state matches allocation state**: 100% synchronization
- ✅ **Capacity numbers update correctly**: Real-time, accurate
- ✅ **Impact calculations are accurate**: Server-validated, not just client

---

## 💡 Key Insights: Data Flow Philosophy

### Legacy System's Data Integrity Strategy
> "Collect all required data sequentially → Validate completeness at each gate → Only persist when all requirements met → Create comprehensive audit trail"

The legacy system treats data collection like a **state machine**:
1. **State: Viewing** → Can browse, no data changed
2. **State: Modifying** → Local changes, not saved
3. **State: Overriding** → Detected deviation, need justification
4. **State: Confirming** → Have justification, need impact acknowledgment
5. **State: Committing** → Have everything, can persist

### Current System's Data Handling
> "Allow data changes → Optionally collect justification → Optionally show impacts → Save when user clicks save"

We have a **request/response** model, not a **state machine**:
- User requests change → System allows it
- User requests save → System saves it
- No gates enforce data collection sequence

### The Fix: Implement State Machine Pattern

```typescript
type AllocationWorkflowState =
  | 'viewing'           // Just looking
  | 'modifying'         // Making changes
  | 'override_detected' // Deviation from optimal
  | 'justifying'        // Providing reason
  | 'impact_preview'    // Reviewing consequences
  | 'committing'        // Saving to server

// Each state transition has requirements
const stateTransitions = {
  'viewing' → 'modifying': () => true, // Always allowed

  'modifying' → 'override_detected': () => {
    return detectOverride(current, optimal);
  },

  'override_detected' → 'justifying': () => true, // Forced

  'justifying' → 'impact_preview': () => {
    return justification.isValid; // Gate: Must complete
  },

  'impact_preview' → 'committing': () => {
    return impactAcknowledged; // Gate: Must confirm
  }
};
```

---

## 🎬 Conclusion

**The Data Flow Architecture is Sound, But the Gates Are Missing**

Our current system has excellent data structures and transformation logic:
- ✅ State management works
- ✅ Capacity calculations work
- ✅ Justification forms work
- ✅ Impact calculations work

But we're missing the **sequential data collection enforcement**:
- ❌ No automatic override detection
- ❌ No forced justification gate
- ❌ No forced impact acknowledgment gate
- ❌ No two-stage validate→confirm→commit pattern

**Timeline to Fix:** 4-6 weeks to implement state machine pattern with proper gates

**Risk of Not Fixing:**
- Incomplete audit trails
- Undocumented override decisions
- Capacity breaks without user awareness
- Regulatory/operational compliance issues
