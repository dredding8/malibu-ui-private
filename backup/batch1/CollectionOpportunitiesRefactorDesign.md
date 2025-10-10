# Collection Opportunities Refactor - Human-Centered Design Document

## Overview

This document outlines the human-centered design approach for refactoring the Collection Opportunities system, focusing on creating an intuitive manual override workflow that reduces cognitive load while empowering operators with intelligent decision support.

## Design Principles

### 1. Progressive Disclosure
- Start with essential information, reveal complexity on demand
- Use expandable sections for advanced features
- Implement smart defaults with override capability

### 2. Flow State Enablement
- Keyboard-first navigation with comprehensive shortcuts
- Predictive interactions with type-ahead search
- Minimal context switching with inline editing

### 3. Confidence Building
- Clear, immediate feedback for all actions
- Comprehensive undo/redo with visual history
- Preview changes before committing
- Real-time validation with helpful suggestions

### 4. Multi-Level Expertise Support
- Guided mode for new operators with tooltips
- Power user shortcuts and batch operations
- Customizable workspace layouts
- Context-aware help system

## Component Architecture

### 1. CollectionOpportunitiesTable (Main View)

```typescript
interface TableDesign {
  layout: {
    primary: 'Blueprint Table2 with virtualization',
    navigation: 'Three-tab system (All/Needs Review/Unmatched)',
    filtering: 'Global site filter with smart suggestions',
    indicators: 'Inline health scores with visual coding'
  },
  interactions: {
    rowClick: 'Quick preview in side panel',
    doubleClick: 'Open override modal',
    rightClick: 'Context menu with common actions',
    keyboard: 'Arrow navigation with Enter to edit'
  },
  visualDesign: {
    healthIndicators: 'Traffic light system (green/yellow/red)',
    statusBadges: 'Blueprint Tags with semantic colors',
    progressBars: 'Capacity visualization inline',
    icons: 'Consistent Blueprint icon usage'
  }
}
```

### 2. ManualOverrideModal (Two-Panel Workspace)

```typescript
interface ModalDesign {
  layout: {
    structure: 'SplitPane with resizable panels',
    leftPanel: 'Available Passes',
    rightPanel: 'Allocated Sites',
    footer: 'Action bar with validation summary'
  },
  
  leftPanelFeatures: {
    passCard: {
      display: 'Compact cards with key metrics',
      quality: 'Visual quality indicator (1-5 stars)',
      capacity: 'Available slots with progress bar',
      metadata: 'Time window, classification level'
    },
    interactions: {
      drag: 'Drag to allocate to sites',
      click: 'Select for batch operations',
      hover: 'Preview detailed metrics'
    }
  },
  
  rightPanelFeatures: {
    siteAllocation: {
      display: 'Site name with current allocations',
      timeline: 'Visual time distribution graph',
      conflicts: 'Real-time conflict indicators',
      capacity: 'Remaining capacity counter'
    },
    interactions: {
      drop: 'Drop passes to allocate',
      reorder: 'Drag to prioritize',
      remove: 'Click X to deallocate'
    }
  }
}
```

### 3. Progressive Workflow Steps

```typescript
interface WorkflowDesign {
  steps: [
    {
      name: 'Selection',
      description: 'Choose collection deck and passes',
      features: [
        'Smart filtering by site requirements',
        'Batch selection with shift+click',
        'Quick actions toolbar'
      ]
    },
    {
      name: 'Allocation',
      description: 'Distribute passes to sites',
      features: [
        'Drag-drop with visual feedback',
        'Auto-optimize suggestions',
        'Conflict resolution wizard',
        'Real-time capacity updates'
      ]
    },
    {
      name: 'Justification',
      description: 'Document override rationale',
      features: [
        'Template suggestions',
        'Classification-aware fields',
        'Required vs optional fields',
        'Auto-save draft'
      ]
    },
    {
      name: 'Review & Submit',
      description: 'Validate and confirm changes',
      features: [
        'Visual diff of changes',
        'Impact analysis summary',
        'One-click undo after submit',
        'Email notification options'
      ]
    }
  ]
}
```

## Interaction Patterns

### Keyboard Shortcuts

```typescript
const keyboardShortcuts = {
  // Navigation
  'Tab': 'Move between panels',
  'Arrow Keys': 'Navigate table rows',
  'Enter': 'Open selected item',
  'Escape': 'Close modal/cancel operation',
  
  // Selection
  'Ctrl+A': 'Select all visible',
  'Ctrl+Click': 'Multi-select',
  'Shift+Click': 'Range select',
  
  // Actions
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+S': 'Save draft',
  'Ctrl+Enter': 'Submit changes',
  
  // View
  'Ctrl+F': 'Focus search',
  'Ctrl+1/2/3': 'Switch tabs',
  'Ctrl+H': 'Toggle help'
}
```

### Visual Feedback System

```typescript
interface FeedbackDesign {
  immediate: {
    hover: 'Highlight drop zones',
    drag: 'Ghost image with count badge',
    validation: 'Inline error messages',
    success: 'Green checkmark animation'
  },
  
  persistent: {
    changes: 'Yellow badge for pending',
    errors: 'Red exclamation with tooltip',
    warnings: 'Orange alert with suggestion',
    info: 'Blue info icon with context'
  },
  
  notifications: {
    save: 'Toast with undo option',
    error: 'Alert dialog with recovery',
    conflict: 'Modal with resolution options',
    success: 'Celebration animation (subtle)'
  }
}
```

## Accessibility Considerations

### WCAG 2.1 AA Compliance

```typescript
interface AccessibilityFeatures {
  keyboard: {
    fullNavigation: 'All features keyboard accessible',
    focusIndicators: 'Clear visual focus states',
    skipLinks: 'Skip to main content option',
    shortcuts: 'Customizable key bindings'
  },
  
  screenReader: {
    ariaLabels: 'Comprehensive ARIA labeling',
    liveRegions: 'Status updates announced',
    semanticHTML: 'Proper heading hierarchy',
    descriptions: 'Detailed action descriptions'
  },
  
  visual: {
    highContrast: 'Full theme support',
    colorBlind: 'Patterns beyond color',
    zoomSupport: 'Up to 200% without loss',
    reduceMotion: 'Respect user preferences'
  }
}
```

## Performance Optimizations

### Large Dataset Handling

```typescript
interface PerformanceStrategy {
  virtualization: {
    table: 'React-window integration',
    scrolling: 'Smooth 60fps target',
    loading: 'Progressive data fetch',
    caching: 'Smart client-side cache'
  },
  
  optimization: {
    memoization: 'React.memo for cards',
    debouncing: 'Search and filter inputs',
    lazyLoading: 'Modal content on demand',
    batchUpdates: 'Grouped state changes'
  }
}
```

## Error Prevention & Recovery

### Validation Strategy

```typescript
interface ValidationDesign {
  preventive: {
    capacityChecks: 'Disable over-allocation',
    conflictPrevention: 'Warn before conflicts',
    requiredFields: 'Clear field indicators',
    smartDefaults: 'Reduce error likelihood'
  },
  
  corrective: {
    inlineErrors: 'Immediate field feedback',
    suggestions: 'How to fix each error',
    bulkFix: 'Apply fix to similar items',
    validation: 'Pre-submit full check'
  },
  
  recovery: {
    undo: 'Single and bulk undo',
    history: 'Full action history',
    restore: 'Recover from errors',
    rollback: 'Server error handling'
  }
}
```

## Mobile Responsiveness

While primarily desktop-focused, the design accommodates tablet usage:

```typescript
interface ResponsiveDesign {
  breakpoints: {
    desktop: '1200px+ (full features)',
    tablet: '768px-1199px (adapted layout)',
    mobile: 'Not supported (show message)'
  },
  
  tabletAdaptations: {
    layout: 'Stack panels vertically',
    interactions: 'Touch-friendly targets',
    modals: 'Full-screen on tablet',
    navigation: 'Hamburger menu'
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Consolidate table components
- Implement basic modal structure
- Set up state management
- Create keyboard navigation

### Phase 2: Core Features (Week 2)
- Build drag-drop allocation
- Add real-time validation
- Implement undo/redo
- Create justification workflow

### Phase 3: Enhancement (Week 3)
- Add auto-optimization
- Implement accessibility
- Performance optimization
- Comprehensive testing

### Phase 4: Polish (Week 4)
- User feedback integration
- Documentation
- Training materials
- Launch preparation

## Success Metrics

### Quantitative
- Time to complete override: <2 minutes (50% reduction)
- Error rate: <5% (90% reduction)
- Keyboard usage: >80% of actions
- Page load time: <1 second

### Qualitative
- User satisfaction: 4.5+ rating
- Ease of learning: <30 minutes training
- Confidence level: High (measured via survey)
- Feature adoption: >80% using advanced features

## Conclusion

This human-centered design approach prioritizes operator efficiency and confidence while maintaining the robustness required for satellite operations. By focusing on progressive disclosure, keyboard navigation, and intelligent assistance, we create a system that serves both novice and expert users effectively.