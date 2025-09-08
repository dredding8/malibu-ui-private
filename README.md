# VUE Dashboard

A comprehensive front-end application built with Palantir Blueprint component library, designed to provide a user-centric and highly functional interface for managing SCCs (Standard Configuration Collections) and related workflows.

## Features

### Dashboard (Main Page)
- **Header Navigation**: Clean navigation bar with VUE logo and navigation links
- **Search Functionality**: Real-time search through SCCs with filtering capabilities
- **Action Buttons**: 
  - Update Master List (with loading states)
  - Create Collection Deck
  - ADD SCC
- **SCCs Table**: Comprehensive table displaying SCC information with status indicators

### History Page
- **Date Range Filtering**: Start and end date inputs with validation
- **Reset Functionality**: Clear all date selections
- **Ready to Continue Table**: Display items ready for processing
- **Completed Decks Table**: Show completed items with completion dates

### Analytics Page
- **Placeholder Interface**: Ready for future analytics implementation
- **Consistent Navigation**: Maintains navigation structure across all pages

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Palantir Blueprint**: Professional UI component library
- **React Router**: Client-side routing
- **Blueprint Icons**: Comprehensive icon set
- **Blueprint Table**: Advanced table component with sorting and filtering
- **Blueprint DateTime**: Date input components

## Design Principles

### Component Selection
- **Cards**: Used to group related information and create visual hierarchy
- **FormGroup**: Structured form inputs with proper labeling
- **Callout**: Important messages and status updates
- **Navbar**: Consistent navigation across all pages
- **Table**: Advanced data display with custom cell renderers

### Information Architecture
- **Intuitive Navigation**: Clear navigation flow between Master, History, and Analytics
- **Logical Grouping**: Related functionality grouped together
- **Consistent Layout**: Uniform spacing and visual hierarchy

### Visual Hierarchy
- **Typography**: Clear heading structure (H3, H5)
- **Spacing**: Consistent padding and margins
- **Color Coding**: Status indicators using Blueprint's intent system
- **Icons**: Meaningful icons for better visual communication

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vue-dashboard-blueprint
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App (not recommended)

## Project Structure

```
src/
├── components/
│   ├── SCCsTable.tsx          # Main SCCs data table
│   └── HistoryTable.tsx       # History data tables
├── pages/
│   ├── Dashboard.tsx          # Main dashboard page
│   ├── History.tsx            # History page with date filtering
│   └── Analytics.tsx          # Analytics placeholder page
├── App.tsx                    # Main application component
└── index.tsx                  # Application entry point
```

## Design Assumptions

The application was built with the following pragmatic assumptions:

1. **VUE Logo**: Represented as a heading with a cube icon for visual consistency
2. **Search Functionality**: Prominently placed for easy access with real-time filtering
3. **Action Buttons**: Grouped logically with appropriate spacing and loading states
4. **Table Data**: Sample data provided for demonstration with realistic SCC properties
5. **Date Filtering**: Proper validation and user-friendly date input components
6. **Status Indicators**: Color-coded tags for quick visual status recognition
7. **Responsive Design**: Layout adapts to different screen sizes
8. **Accessibility**: Proper ARIA labels and keyboard navigation support

## Component Usage Examples

### Basic Button Usage
```tsx
<Button 
  icon={IconNames.REFRESH} 
  text="Update Master List" 
  intent="primary" 
  loading={isUpdating}
  onClick={handleUpdateMasterList}
/>
```

### Table with Custom Cell Renderers
```tsx
<Table numRows={filteredData.length}>
  <Column 
    name="Status" 
    cellRenderer={statusCellRenderer}
    width={120}
  />
</Table>
```

### Form with Date Input
```tsx
<FormGroup label="Start Date" labelFor="start-date">
  <DateInput
    id="start-date"
    value={startDate}
    onChange={setStartDate}
    placeholder="Select start date..."
    canClearSelection
  />
</FormGroup>
```

## Future Enhancements

- **Analytics Implementation**: Real charts and data visualizations
- **Advanced Filtering**: Multi-criteria filtering and sorting
- **Export Functionality**: PDF and Excel export capabilities
- **User Management**: Authentication and authorization
- **Real-time Updates**: WebSocket integration for live data
- **Mobile Optimization**: Enhanced mobile responsiveness

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.



