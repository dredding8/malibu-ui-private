# Executing the JTBD Round Table Analysis with SuperClaude

## How to Use This Prompt with SuperClaude Commands

This document demonstrates how to execute the round table analysis using SuperClaude's specialized commands and personas.

### Step 1: Initial Architecture Analysis
```bash
/analyze @CollectionOpportunitiesHub.tsx @types/collectionOpportunities.ts --persona-architect --think-hard --focus architecture
```


### Step 2: User Experience Evaluation  
```bash
/analyze @CollectionOpportunitiesHub.tsx @CollectionOpportunitiesEnhanced.tsx --persona-frontend --focus user-experience --think
```


### Step 3: Business Value Assessment
```bash
/analyze @CollectionOpportunitiesHub.tsx --persona-analyzer --focus business-value --validate
```


### Step 4: Gap Implementation Planning
```bash
/design --type gap-resolution --persona-architect --seq --c7
```


### Step 5: User Flow Improvements
```bash
/improve @CollectionOpportunitiesHub.tsx --focus user-experience --persona-frontend --magic --loop
```


### Step 6: Critical Feature Implementation
```bash
/implement --type missing-features --wave-mode auto --delegate
```


### Step 7: Live Application Testing with Playwright
```bash
# Test the running application against JTBD requirements
/test e2e --play --focus jtbd-validation
Ï
# Run comprehensive test suite
/test jtbd-complete --play --persona-qa --metrics --validate
```

This will:
- Test the live application at http://localhost:3000
- Validate each JTBD workflow in real browser
- Measure performance and accessibility
- Capture visual regression screenshots
- Generate actionable gap reports

### Step 8: Performance and Visual Testing
```bash
# Capture performance metrics
/test performance --play --metrics --report

# Run visual regression tests
/test visual-baseline --play --screenshots
```

### Step 9: Documentation and Knowledge Transfer
```bash
/document --type user-guide --persona-scribe=en --focus jtbd-workflows
```


## Advanced Round Table Simulation

### Multi-Persona Collaborative Analysis
```bash
/spawn collaborative-analysis --multi-agent --parallel-focus
```


### Iterative Improvement Cycles
```bash
/improve @CollectionOpportunitiesHub.tsx --wave-mode force --wave-strategy progressive --loop --iterations 5
```


## Expected Outputs

1. **Gap Analysis Report**: Detailed mapping of JTBD to current capabilities
2. **Implementation Roadmap**: Phased plan for addressing gaps
3. **Enhanced Components**: Updated code supporting all JTBD
4. **Test Suite**: Comprehensive tests validating JTBD workflows
5. **User Documentation**: Clear guides for each job workflow

## Monitoring Progress

Use the TodoWrite system to track progress:
```bash
/task create "JTBD Implementation" --epic
/task add "Verify and Validate Plans Feature" --parent "JTBD Implementation"
/task add "Override Workflow Enhancement" --parent "JTBD Implementation"
/task add "Data Integrity Error Handling" --parent "JTBD Implementation"
/task add "Advanced Filtering System" --parent "JTBD Implementation"
```

## Success Validation

After implementation, validate success with:

### Code Analysis
```bash
/analyze @CollectionOpportunitiesHub.tsx --focus jtbd-completion --validate --introspect
```

### Live Application Validation
```bash
# Run full JTBD test suite on live application
/test jtbd-complete --play --persona-qa --metrics --validate

# Generate compliance report
/analyze @playwright-results.json --persona-analyzer --focus jtbd-compliance

# Visual regression check
/test visual-regression --play --compare-baseline
```

### Continuous Monitoring
```bash
# Set up automated JTBD validation
/spawn jtbd-monitor --loop --play --interval 3600 --alert-on-failure
```

This ensures:
- All JTBD workflows remain functional
- Performance doesn't degrade over time
- Visual consistency is maintained
- Users can complete their critical tasks