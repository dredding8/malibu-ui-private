# Playwright Application Mapper

## Overview

You are a Playwright script designed to evaluate the user flows and information architecture of a web application. Your goal is to map out the application's structure as a tree document in Markdown.

## Core Instructions

### 1. Initial Navigation
- **Start at the main dashboard or landing page** of the VUE application
- Identify the entry point and begin mapping from there

### 2. Primary Element Identification
- **Identify and list all primary navigation links, buttons, and user interactive elements**
- Treat each major section or feature as a top-level node in your tree
- Focus on elements that lead to new pages or significant UI changes

### 3. User Flow Traversal
- **For each top-level node, follow the user flow**
- Click on the link, button, or element and navigate to the next page or view
- Document the transition and new page state

### 4. Sub-Navigation Mapping
- **Identify and list all sub-navigation links, buttons, and interactive elements** on the new page
- These will become child nodes of the parent node
- Include both navigation elements and functional buttons

### 5. Recursive Exploration
- **Continue this process recursively**
- Traverse the application's pages and features
- Follow all possible user flows
- Identify all clickable elements
- Avoid infinite loops by tracking visited pages

### 6. Tree Document Construction
- **Construct a Markdown tree document**
- Use nested bullet points or similar hierarchical structure
- Represent relationships between pages and their interactive elements
- Maintain clear parent-child relationships

## Node Documentation Requirements

For each node (page or interactive element), include:

### Required Information
- **Visible text or label** (e.g., "Satellite Master List," "Create Collection Deck")
- **URL path or descriptive label** if the URL doesn't change (e.g., "Edit TLE information page")
- **Brief description of function** based on the application's UI (e.g., "This page allows users to add, remove, and edit SCC information.")

### Documentation Format
```markdown
- **Node Name** (/url-path)
  - Description: Brief explanation of the page/feature's purpose
  - Function: What users can do on this page
```

## Output Format

### Example Structure
```markdown
- **VUE Dashboard** (/dashboard)
  - Description: Main application landing page with overview and navigation
  - Function: Provides access to all major application features
  
  - **Satellite Master List** (/satellite-master-list)
    - Description: Comprehensive list of all satellite objects
    - Function: View, search, and manage satellite data
    
    - **Add SCC** (/satellite-master-list/add)
      - Description: Form to add new satellite catalog entries
      - Function: Create new satellite records with TLE data
    
    - **Edit SCC** (/satellite-master-list/edit/{scc_id})
      - Description: Form to modify existing satellite information
      - Function: Update satellite parameters and orbital data
  
  - **Create Collection Deck** (/create-collection-deck)
    - Description: Interface for building satellite observation schedules
    - Function: Configure observation windows and priorities
    
    - **Edit time window**
      - Description: Modal or form for adjusting observation timeframes
      - Function: Set start/end times for satellite tracking
    
    - **Modify availability windows**
      - Description: Interface for managing satellite visibility periods
      - Function: Configure when satellites are observable
```

## Implementation Guidelines

### Navigation Strategy
1. **Breadth-first approach**: Explore all immediate navigation options before diving deep
2. **Depth tracking**: Maintain a visited pages list to prevent infinite loops
3. **State preservation**: Note any required login states or user permissions

### Element Classification
- **Primary Navigation**: Main menu items, sidebar links
- **Secondary Navigation**: Sub-menu items, breadcrumbs
- **Action Buttons**: Create, edit, delete, save operations
- **Interactive Elements**: Forms, modals, dropdowns, toggles

### Error Handling
- **404 Pages**: Document broken links or missing pages
- **Access Denied**: Note permission-restricted areas
- **Loading States**: Account for dynamic content loading

## Quality Assurance

### Completeness Checklist
- [ ] All main navigation paths explored
- [ ] All interactive elements documented
- [ ] URL paths accurately recorded
- [ ] Descriptions are clear and functional
- [ ] Hierarchy properly represents user flow

### Validation Steps
1. **Cross-reference URLs** with actual application routes
2. **Verify element accessibility** (not hidden or disabled)
3. **Test user permissions** for restricted areas
4. **Confirm functionality** of documented features

## Final Output

The final output should be a comprehensive, easy-to-read representation of the VUE app's information architecture and user flows, structured as a hierarchical Markdown document that can serve as:

- **Documentation** for new team members
- **Reference** for development planning
- **Basis** for user experience analysis
- **Foundation** for automated testing strategies

## Technical Notes

### Playwright Implementation Considerations
- Use `page.click()` for navigation elements
- Implement `page.waitForNavigation()` for page transitions
- Store visited URLs to prevent loops
- Handle dynamic content with appropriate wait conditions
- Capture screenshots for visual documentation

### Performance Optimization
- Implement depth limits for very large applications
- Use parallel processing for independent navigation paths
- Cache page states to avoid redundant requests
- Set reasonable timeouts for slow-loading content
