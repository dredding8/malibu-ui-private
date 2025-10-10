# Final AllocationTab Refactoring - Remaining Inline Styles

## Remaining Inline Styles to Remove

Due to file complexity, completing the refactoring requires the following systematic edits:

### 1. Card Header (Lines 251-257)
**Current**:
```typescript
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
  <div>
    <strong>{site.name}</strong>
    <div style={{ fontSize: '12px', color: '#5C7080' }}>
      {passProps.passCount} passes available
    </div>
  </div>
```

**Replace with**:
```typescript
<div className="allocated-site-card__header">
  <div>
    <strong>{site.name}</strong>
    <div className="allocated-site-card__pass-count">
      {passProps.passCount} passes available
    </div>
  </div>
```

### 2. Callout Margins (Lines 283, 288)
Replace `style={{ marginBottom: '12px' }}` with className approach or accept Callout default spacing

### 3. Stepper Grid (Line 292)
**Current**: `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>`
**Replace with**: `<div className="allocated-site-card__stepper-grid">`

### 4. FormGroup Margins (Lines 297, 318)
**Current**: `style={{ marginBottom: 0 }}`
**Replace with**: `className="allocated-site-card__form-group"`

### 5. Read-Only Field Container (Lines 320-324)
**Current**:
```typescript
<div style={{
  padding: '10px 12px',
  background: '#F5F8FA',
  borderRadius: '3px',
  border: '1px solid #E1E8ED'
}}>
```
**Replace with**: `<div className="allocated-site-card__readonly-field">`

### 6. Operational Details (Line 328)
**Current**: `<div style={{ fontSize: '12px', color: '#5C7080', marginTop: '8px' }}>`
**Replace with**: `<div className="allocated-site-card__operational-details">`

### 7. Immutable Note (Line 332)
**Current**: `<div style={{ fontSize: '11px', color: '#5C7080', fontStyle: 'italic', marginTop: '8px' }}>`
**Replace with**: `<div className="allocated-site-card__immutable-note">`

### 8. Summary Row (Line 339)
**Current**: `<div style={{ fontSize: '12px', color: '#5C7080', display: 'flex', justifyContent: 'space-between' }}>`
**Replace with**: `<div className="allocated-site-card__summary">`

### 9. Expandable Section Container (Line 353)
**Current**: `<div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E1E8ED' }}>`
**Replace with**: `<div className="allocated-site-card__expandable-section">`

### 10. Timestamps Header (Line 354)
**Current**: `<div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>`
**Replace with**: `<div className="allocated-site-card__timestamps-header">`

### 11. Timestamps List (Line 357)
**Current**: `<div style={{ fontSize: '11px', color: '#5C7080' }}>`
**Replace with**: `<div className="allocated-site-card__timestamps-list">`

### 12. Timestamp Item (Line 362)
**Current**: `<div key={pass.id} style={{ marginBottom: '4px' }}>`
**Replace with**: `<div key={pass.id} className="allocated-site-card__timestamp-item">`

### 13. Validation Error Callout (Line 224)
**Current**: `<Callout intent={Intent.DANGER} icon={IconNames.ERROR} style={{ marginTop: '12px' }}>`
**Can remain** - Callout components with single spacing property are acceptable for dynamic elements

## Implementation

Continue refactoring by applying edits #1-12 systematically to remove all remaining inline styles from the allocated site cards section.