# Create Collection Deck End-to-End Testing Prompt

## Objective
Validate the Create Collection Deck user experience from a user's perspective, ensuring intuitive interactions, clear navigation, and seamless flow progression across all application entry points. Focus on usability, user comprehension, and interaction intuitiveness.

## SuperClaude Framework Integration

### Primary Commands
```bash
/analyze @src/pages/CreateCollectionDeck --focus quality --persona-qa --seq --play
/test --type e2e --comprehensive --persona-qa --play --seq
/troubleshoot [flow-issues] --persona-analyzer --seq --play
```

### MCP Server Utilization

**Context7 (`--c7`)**:
- Retrieve testing best practices and patterns
- Access Playwright documentation and advanced testing techniques
- Research user experience testing methodologies

**Sequential (`--seq`)**:
- Systematic analysis of Create Collection Deck flow logic
- Multi-step test scenario planning and validation
- Root cause analysis for interaction failures

**Playwright (`--play`)**:
- User interaction simulation and behavioral validation
- Real user journey testing and flow comprehension
- Modal interaction patterns and user feedback validation
- Usability testing across different user scenarios

## Test Scope & Requirements

### Entry Points to Validate
1. **Dashboard**: Primary Create Collection Deck button
2. **Collection Decks Page**: Secondary creation entry points
3. **Navigation Menu**: Global access points
4. **Empty States**: First-time user scenarios

### Critical User Experience Components
1. **Step 1: Input Data** - Intuitive form design, clear field labels, helpful validation messages
2. **Step 2: Review Parameters** - Easy-to-understand data presentation, simple edit workflows
3. **Step 3: Review Matches** - Clear match visualization, obvious selection methods
4. **Step 4: Special Instructions** - User-friendly customization interface, clear option descriptions
5. **Background Processing** - Transparent progress communication, user reassurance during waits
6. **Completion Flow** - Obvious success indicators, clear next-step guidance

### User Experience & Intuitiveness Focus
- **Modal Clarity**: Are modals clearly understandable and purposeful to users?
- **Navigation Logic**: Does the flow make sense from a user's mental model?
- **Feedback Quality**: Do users understand what's happening at each step?
- **Error Communication**: Are error messages helpful and actionable for users?
- **Progress Transparency**: Can users easily understand where they are in the process?
- **Completion Satisfaction**: Do users feel confident they've successfully created their deck?

## Execution Strategy

### Phase 1: User Experience Discovery
```bash
/analyze @src/pages/CreateCollectionDeck @src/components --focus ux --persona-frontend --seq --c7
```
- Map user journey touchpoints and decision moments
- Identify potential confusion points in the interface
- Document user expectations vs actual experience patterns

### Phase 2: Usability Testing Infrastructure Assessment  
```bash
/analyze @playwright-tests --focus ux --persona-qa --play --seq
```
- Evaluate existing user interaction test coverage
- Identify reusable user journey testing patterns
- Assess current usability validation capabilities

### Phase 3: User-Centered Test Suite Development
```bash
/implement test-suite --type playwright --focus ux --persona-frontend --play --seq --c7
```
- Create intuitive user journey validation tests
- Implement user comprehension and interaction flow tests
- Build user feedback and guidance verification
- Establish consistent user experience validation

### Phase 4: Intuitiveness & Usability Validation
```bash
/test --focus ux --persona-frontend --play --seq --validate
```
- Execute real-world user scenarios across all entry points
- Validate that interactions feel natural and obvious to users
- Verify that users can easily understand and recover from errors
- Test user comprehension at each step of the process

### Phase 5: User Experience Issue Resolution
```bash
/troubleshoot [ux-issues] --persona-analyzer --persona-frontend --seq --play --validate
```
- Systematic investigation of user confusion points
- Root cause analysis for unintuitive interactions
- User journey friction point identification
- Interface clarity and guidance improvement analysis

## Expected Deliverables

1. **User Journey Test Suite**: Complete Playwright validation of Create Collection Deck user experiences
2. **Intuitiveness Assessment**: Detailed analysis of user comprehension and interaction clarity
3. **Usability Report**: Comprehensive evaluation of user flow logic and interface guidance
4. **User Experience Issues**: Documented confusion points with user impact assessment and improvement recommendations
5. **User Satisfaction Validation**: Evidence that users can successfully and confidently create collection decks

## User Experience Quality Gates

- ✅ Users can easily discover and understand how to create a collection deck
- ✅ Each step feels logical and predictable to users
- ✅ Users understand what modals are asking them to do
- ✅ Users feel informed and reassured during background processing
- ✅ Users clearly understand when creation is successful and what to do next
- ✅ Error messages help users understand what went wrong and how to fix it
- ✅ The overall flow feels intuitive and user-friendly
- ✅ Users can complete the process without confusion or hesitation

## Success Criteria

The Create Collection Deck functionality should demonstrate:
- **Intuitive User Experience**: Users naturally understand each step without external guidance
- **Clear Communication**: Every interface element and message is immediately understandable
- **Logical Flow Progression**: Each step follows naturally from the user's mental model
- **Confident User Completion**: Users feel successful and accomplished after creating their deck
- **Friction-Free Interactions**: No moments of confusion, hesitation, or uncertainty
- **Accessible User Guidance**: Help and feedback appear exactly when users need them