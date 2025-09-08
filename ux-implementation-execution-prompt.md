# UX Implementation Execution Prompt - SuperClaude Framework

## /implement Create Collection Deck UX Resolution --focus accessibility --persona-frontend --seq --c7 --validate --think

**Primary Objective**: Execute comprehensive UX fixes and implementations based on the UX Resolution Implementation Plan and validate against the Completion Report requirements.

**Context**: React TypeScript application with Blueprint UI components requiring critical accessibility fixes, form navigation improvements, and test infrastructure updates. Evidence shows 90% test failure rate due to accessibility violations and infrastructure compatibility issues.

---

## Core Implementation Requirements

### Priority 1: Critical Accessibility Fixes (Immediate)
**Target Files**: 
- `src/pages/CreateCollectionDeck/Step1InputData.tsx`
- `src/pages/CreateCollectionDeck/Step2ReviewParameters.tsx` 
- `src/pages/CreateCollectionDeck/Step3ReviewMatches.tsx`
- `src/pages/CreateCollectionDeck/Step4SpecialInstructions.tsx`
- `src/pages/CreateCollectionDeck.tsx`

**Required Implementations**:

1. **Form Input Accessibility Enhancement**:
   ```typescript
   // Add missing aria-labels to ALL form inputs
   <InputGroup
     id="deck-name"
     value={data.deckName || ''}
     onChange={(e) => handleInputChange('deckName', '', e.target.value)}
     placeholder="Enter collection name..."
     aria-label="Collection deck name"
     data-testid="deck-name-input"
   />
   
   <DateInput
     aria-label="Collection start date"
     data-testid="start-date-input"
   />
   
   <HTMLSelect
     aria-label="TLE data source selection" 
     data-testid="tle-source-select"
   />
   ```

2. **ARIA Progressbar Enhancement**:
   ```typescript
   <ProgressBar
     value={currentStep}
     intent="success"
     aria-label={`Collection creation progress: Step ${currentStep} of 4`}
     data-testid="progress-bar"
   />
   ```

3. **Landmark Structure Implementation**:
   ```typescript
   // Wrap main content areas in proper landmarks
   <main className="create-deck-content" role="main">
     <section aria-labelledby="step-heading">
       <h2 id="step-heading">Step {currentStep}: {stepTitle}</h2>
       {/* Step content */}
     </section>
   </main>
   ```

### Priority 2: Test Infrastructure Compatibility
**Target Files**: 
- `create-collection-deck-enhanced-ux.spec.ts`
- Any other test files using network simulation

**Required Fix**:
```typescript
// Replace deprecated setNetworkConditions API
async simulateNetworkConditions(condition: 'offline' | 'slow3g' | 'fast3g'): Promise<void> {
  const context = this.page.context();
  
  switch (condition) {
    case 'slow3g':
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 2000); // Simulate 2s latency
      });
      break;
    case 'offline':
      await context.route('**/*', route => route.abort());
      break;
    case 'fast3g':
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Simulate 100ms latency
      });
      break;
  }
}
```

### Priority 3: Form Navigation Flow Validation
**Requirements**:
- Verify keyboard navigation tab sequence works properly
- Ensure focus management between form steps
- Test complete form completion flow
- Validate all navigation paths function correctly

---

## SuperClaude Framework Integration

### Persona Activation: Frontend Specialist
**Rationale**: UX/accessibility focus, Blueprint UI expertise, performance consciousness
- Priority: User needs > accessibility > performance > technical elegance
- WCAG 2.1 AA compliance minimum
- Performance budgets: <3s on 3G, <500KB bundle size

### MCP Server Strategy
**Primary: Sequential** - For systematic accessibility analysis and validation
**Secondary: Context7** - For Blueprint UI patterns and accessibility best practices
**Excluded: Magic** - Not needed for fixing existing components

### Validation Framework
Execute complete 8-step quality gates:
1. **Syntax**: TypeScript/React validation
2. **Type**: Component prop types and accessibility attributes
3. **Lint**: ESLint accessibility rules compliance
4. **Security**: No security vulnerabilities in form handling
5. **Test**: Run enhanced test suite for >90% pass rate
6. **Performance**: Maintain Core Web Vitals budgets
7. **Documentation**: Update component accessibility documentation
8. **Integration**: Cross-browser accessibility testing

---

## Success Metrics & Evidence Requirements

### Quantitative Targets
- **Accessibility Violations**: 0 critical, <5 moderate
- **Test Pass Rate**: >90% enhanced test suite passing
- **Performance**: Core Web Vitals maintained (<3s load, <500KB bundle)
- **User Journey**: 100% keyboard navigation completion

### Qualitative Validation
- Screen reader users can complete collection creation independently
- Keyboard-only navigation works without assistance
- All form inputs provide clear context and feedback
- Progress indicators communicate current state effectively

### Evidence Documentation Required
- Before/after accessibility audit comparison
- Test suite execution results showing pass rate improvement
- Performance metrics validation
- Cross-browser compatibility verification

---

## Implementation Sequence

### Phase A: Accessibility Implementation (1-2 hours)
1. **Systematic Form Enhancement**: Add aria-labels to all form inputs across all steps
2. **Landmark Structure**: Implement proper semantic HTML with main/section elements
3. **Progress Enhancement**: Add accessible names to progress indicators
4. **Heading Hierarchy**: Ensure proper h1-h6 structure

### Phase B: Infrastructure Updates (30 minutes)
1. **API Compatibility**: Update network simulation in test files
2. **Test Validation**: Run enhanced test suite to verify compatibility
3. **Cross-browser Testing**: Validate accessibility fixes work consistently

### Phase C: Comprehensive Validation (30 minutes)
1. **Accessibility Audit**: Run automated accessibility testing
2. **Performance Testing**: Verify Core Web Vitals maintained
3. **User Journey Testing**: Complete end-to-end keyboard navigation
4. **Evidence Generation**: Document before/after improvements

---

## Risk Mitigation & Quality Gates

### Technical Safeguards
- **Blueprint UI Compatibility**: Test each accessibility enhancement with existing Blueprint patterns
- **Performance Impact**: Monitor bundle size and load times during implementation
- **TypeScript Compliance**: Maintain strict type checking throughout

### User Experience Protection
- **Regression Prevention**: Run complete test suite after each implementation phase
- **Mobile Compatibility**: Verify all fixes work across device sizes
- **Focus on Essentials**: Implement only critical accessibility fixes that directly improve UX

---

## Expected Deliverables

1. **Code Updates**: All accessibility fixes implemented in target files
2. **Test Infrastructure**: Network simulation API updated and functional
3. **Validation Results**: Enhanced test suite achieving >90% pass rate
4. **Performance Verification**: Core Web Vitals maintained within budgets
5. **Documentation**: Evidence of accessibility compliance improvements
6. **Quality Report**: Before/after metrics demonstrating UX enhancements

---

**Framework Flags Summary**: `--focus accessibility --persona-frontend --seq --c7 --validate --think`
**Expected Outcome**: Transform 90% test failure rate into fully accessible, high-performance user experience that meets WCAG guidelines and maintains excellent performance characteristics.