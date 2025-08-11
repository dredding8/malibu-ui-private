# Playwright Vue.js Material-UI Application Mapper

## Objective
You are a Playwright script tasked with creating a comprehensive, plain-text application map for the VUE app. Your goal is to systematically traverse the application and document its information architecture, explicitly identifying the Material-UI (MUI) components used for each interactive element.

## Core Requirements

### Initial Navigation
- Begin by navigating to the application's starting page
- Identify all primary navigation links and user interface elements
- Treat each element as a top-level entry in your map

### Data Collection for Each Element
For each element, capture:
- **Text content** - The visible text or label
- **URL** - The destination URL for navigation elements
- **MUI Component Class** - Use Playwright's inspection capabilities to determine the Material-UI component class (e.g., `MuiButton`, `MuiTable`, `MuiPaper`)

### Recursive Traversal
- Follow all navigation links to new pages
- On each new page, repeat the inspection process
- Build a hierarchical, nested structure that represents the application's flow

### Hierarchical Structure Examples
- The "Satellite Master List" page should be a child of the main dashboard
- The "Add SCC" button should be a child of the "Satellite Master List" page
- Use indentation to clearly show parent-child relationships

## Output Format

### Document Structure
Your final output should be a single, plain-text document formatted as a hierarchical list with:

1. **Page Elements**: Page name and URL
2. **Interactive Elements**: Element name and identified MUI component
3. **Indentation**: Clear visual hierarchy showing relationships

### Example Format
```
Main Dashboard (/dashboard)
  Navigation Menu (MuiAppBar)
    Satellite Master List (/satellites) (MuiListItem)
      Add SCC Button (MuiButton)
      Satellite Table (MuiTable)
        Table Header (MuiTableHead)
        Table Body (MuiTableBody)
    User Settings (/settings) (MuiListItem)
      Profile Form (MuiPaper)
        Name Input (MuiTextField)
        Save Button (MuiButton)
```

## Technical Implementation

### Playwright Capabilities to Utilize
- **Page Navigation**: `page.goto()` for initial page load
- **Element Selection**: `page.locator()` for finding elements
- **Component Inspection**: Use CSS selectors to identify MUI classes
- **Recursive Crawling**: Implement depth-first or breadth-first traversal
- **URL Tracking**: Maintain visited URLs to prevent infinite loops

### MUI Component Detection
- Look for CSS classes starting with `Mui`
- Common patterns: `MuiButton-root`, `MuiTable-root`, `MuiPaper-root`
- Use Playwright's `getAttribute()` method to extract class information
- Handle dynamic components that may have additional classes

### Error Handling
- Implement timeout handling for slow-loading pages
- Handle authentication requirements
- Manage navigation errors gracefully
- Log any components that cannot be identified

## Success Criteria

The final document should serve as a clear, human-readable reference for the application's front-end structure, enabling developers to:

1. **Understand the application flow** through the hierarchical structure
2. **Identify MUI component usage** throughout the application
3. **Plan refactoring efforts** based on component distribution
4. **Document the current state** for future development reference

## Deliverable
A single plain-text file containing the complete application map with proper indentation, clear component identification, and comprehensive coverage of all navigable pages and interactive elements.
