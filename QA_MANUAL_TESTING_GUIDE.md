# QA Manual Testing Guide

**Feature**: SCC Numeric Changes & Capacity Display Refactor
**Version**: 1.0
**Date**: 2025-10-07
**Status**: Ready for QA Testing

---

## Overview

This guide covers manual testing for three integrated features:
1. SCC numeric type system with formatting
2. Capacity display refactor (text-based, no progress bars)
3. String handling for invalid SCC values

**Estimated Testing Time**: 30-45 minutes

---

## Prerequisites

### Environment Setup
- [ ] Application running on `http://localhost:3000`
- [ ] Browser: Chrome (latest), Firefox (latest), or Safari (latest)
- [ ] Console open for error monitoring (F12 → Console tab)
- [ ] Network tab open for API monitoring

### Test Data Requirements
- [ ] At least 3 collections with opportunities
- [ ] Mix of opportunities with valid and invalid SCC data
- [ ] Collections with allocation workflows enabled

---

## Test Suite 1: SCC Numeric Display

### Test 1.1: Collection Opportunities Table

**Objective**: Verify SCC displays with proper formatting in tables

**Steps**:
1. Navigate to Collections page (`/collections`)
2. Click on any collection
3. Locate the opportunities table
4. Find the SCC column

**Expected Results**:
- ✅ SCC values display with 5-digit zero-padding (e.g., "00123", "12345")
- ✅ No raw strings like "unit-1" or "SCC-001" visible
- ✅ Missing SCC shows "N/A"
- ✅ Column header reads "SCC" or "SCC Number"

**Screenshot**: Take screenshot of table with SCC column visible

**Pass Criteria**: All SCC values are either 5-digit numbers or "N/A"

---

### Test 1.2: UnifiedEditor Header Display

**Objective**: Verify SCC displays correctly in modal header

**Steps**:
1. From Collections page, click on a collection
2. Click "Manage" or "Edit" button on any opportunity
3. Modal should open (UnifiedEditor)
4. Look at the header section
5. Locate the "SCC:" field

**Expected Results**:
- ✅ SCC displays as formatted 5-digit number (e.g., "00123")
- ✅ If SCC is invalid/missing, displays "N/A"
- ✅ Does NOT display raw strings like "unit-1"
- ✅ Tag component has satellite icon
- ✅ Label reads "SCC:"

**Screenshot**: Take screenshot of modal header with SCC visible

**Pass Criteria**: SCC shows formatted number or "N/A" (never invalid strings)

---

### Test 1.3: Search Functionality

**Objective**: Verify numeric SCC search works correctly

**Steps**:
1. Navigate to Collections page
2. Locate search input field
3. Enter numeric SCC value (e.g., "123" or "12345")
4. Observe filtered results

**Expected Results**:
- ✅ Search accepts numeric input
- ✅ Results filter correctly by SCC number
- ✅ Partial matches work (e.g., "123" matches "00123")
- ✅ No JavaScript errors in console

**Pass Criteria**: Search filters opportunities by SCC number correctly

---

## Test Suite 2: Capacity Display Refactor

### Test 2.1: AllocationTab Capacity Display

**Objective**: Verify capacity shows text-based format (no progress bars)

**Steps**:
1. Navigate to Collections page
2. Click on a collection with allocation workflow
3. Click "Manage" on an opportunity
4. UnifiedEditor modal opens
5. Click "Allocation" tab (or navigate to Override mode)
6. Look at the "Available Passes" table
7. Locate the "Capacity" column

**Expected Results**:
- ✅ Capacity displays as text: "X available" (e.g., "12 available")
- ✅ Below that: "Y/Z" format (e.g., "8/20")
- ✅ Small colored dot indicator visible (green/yellow/red)
- ✅ **NO progress bars visible**
- ✅ Text is bold for "X available"
- ✅ "Y/Z" text is muted/smaller

**Screenshot**: Take screenshot of Allocation tab capacity column

**Pass Criteria**: Text-based display with status dots, no progress bars

---

### Test 2.2: Capacity Status Indicators

**Objective**: Verify status dots show correct colors based on capacity

**Steps**:
1. In Allocation tab, view multiple sites
2. Observe the colored dots next to capacity

**Expected Results**:
- ✅ Green dot: Site has good capacity (< 60% utilized)
- ✅ Yellow dot: Site has moderate capacity (60-85% utilized)
- ✅ Red dot: Site is near/at capacity (> 85% utilized)
- ✅ Pulsing red dot: Site is at 100% capacity (critical)

**Pass Criteria**: Status dots display with appropriate colors

---

### Test 2.3: Capacity Display - Full Capacity

**Objective**: Verify "Full" displays for sites at capacity

**Steps**:
1. Find a site with allocated = capacity (100% full)
2. Observe capacity display

**Expected Results**:
- ✅ Shows "Full" instead of "0 available"
- ✅ Shows allocated/capacity ratio (e.g., "20/20")
- ✅ Red pulsing dot visible
- ✅ Clear visual indication of no availability

**Pass Criteria**: "Full" text displayed for 100% capacity sites

---

## Test Suite 3: String Handling

### Test 3.1: Invalid SCC String Handling

**Objective**: Verify invalid SCC strings display as "N/A"

**Test Data**: Opportunities with SCC values like:
- "unit-1"
- "invalid"
- Empty string
- Non-numeric strings

**Steps**:
1. Open UnifiedEditor for opportunity with invalid SCC
2. Check header SCC display
3. Check table SCC display

**Expected Results**:
- ✅ Invalid SCC shows "N/A" in header
- ✅ Invalid SCC shows "N/A" in table
- ✅ Never shows raw invalid string like "unit-1"
- ✅ No JavaScript errors in console

**Pass Criteria**: All invalid SCC values display as "N/A"

---

### Test 3.2: Valid String SCC Parsing

**Objective**: Verify valid numeric strings parse correctly

**Test Data**: SCC values like:
- "12345" → should show "12345"
- "00123" → should show "00123"
- "678" → should show "00678"

**Steps**:
1. View opportunities with numeric string SCC values
2. Check display in table and header

**Expected Results**:
- ✅ Numeric strings parse and format correctly
- ✅ Zero-padding applied where needed
- ✅ Consistent display across all views

**Pass Criteria**: Valid numeric strings display as formatted numbers

---

## Test Suite 4: Cross-Browser Testing

### Test 4.1: Chrome
- [ ] Run all tests in Chrome
- [ ] Check for console errors
- [ ] Verify visual consistency

### Test 4.2: Firefox
- [ ] Run all tests in Firefox
- [ ] Check for console errors
- [ ] Verify visual consistency

### Test 4.3: Safari (macOS/iOS)
- [ ] Run all tests in Safari
- [ ] Check for console errors
- [ ] Verify visual consistency

**Pass Criteria**: All tests pass in all three browsers

---

## Test Suite 5: Edge Cases

### Test 5.1: Boundary Values

**SCC Boundaries**:
- [ ] SCC = 1 → displays "00001"
- [ ] SCC = 99999 → displays "99999"
- [ ] SCC = 0 → displays "N/A" (invalid)
- [ ] SCC = 100000 → displays "N/A" (out of range)

### Test 5.2: Null/Undefined Values
- [ ] SCC = undefined → displays "N/A"
- [ ] SCC = null → displays "N/A"
- [ ] SCC missing from object → displays "N/A"

### Test 5.3: Capacity Edge Cases
- [ ] Capacity = 0/0 → displays "Full"
- [ ] Capacity = 0/20 → displays "20 available"
- [ ] Capacity = 20/20 → displays "Full"
- [ ] Negative values → handled gracefully

---

## Console Error Monitoring

Throughout all tests, monitor console for:

### Expected Console Messages (OK to ignore)
- ⚠️ "SCC out of range" warnings (validation working)
- ℹ️ Development mode warnings

### Unexpected Errors (REPORT IMMEDIATELY)
- ❌ TypeError: Cannot read property
- ❌ ReferenceError: formatSccNumber is not defined
- ❌ Rendering errors
- ❌ State update errors

**Action**: If any unexpected errors occur, note the exact error message and reproduction steps

---

## Performance Testing

### Test P1: Page Load Performance
1. Open Collections page
2. Measure time to interactive
3. Check for laggy scrolling

**Expected**: No noticeable performance degradation

### Test P2: Modal Open Performance
1. Click to open UnifiedEditor
2. Measure time to fully render

**Expected**: Opens within 500ms

### Test P3: Large Data Sets
1. View collection with 100+ opportunities
2. Check table rendering speed
3. Test scrolling performance

**Expected**: Smooth 60fps scrolling

---

## Accessibility Testing

### Test A1: Keyboard Navigation
- [ ] Tab through capacity display elements
- [ ] Focus indicators visible
- [ ] All interactive elements accessible

### Test A2: Screen Reader
- [ ] SCC label announces correctly
- [ ] Capacity information announces clearly
- [ ] Status indicators have aria-labels

### Test A3: Color Contrast
- [ ] Status dots meet WCAG AA contrast
- [ ] Text meets WCAG AA contrast (4.5:1)
- [ ] Bold "available" text is readable

---

## Bug Report Template

If you find an issue, report using this template:

```markdown
## Bug Report

**Title**: [Brief description]

**Severity**: [Critical/High/Medium/Low]

**Component**: [SCC Display/Capacity Display/String Handling]

**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:

**Actual Result**:

**Screenshots**: [Attach screenshots]

**Browser**: [Chrome/Firefox/Safari + version]

**Console Errors**: [Copy any errors]

**Additional Notes**:
```

---

## Sign-Off Checklist

After completing all tests:

### Functionality
- [ ] All SCC values display correctly
- [ ] Capacity display shows text format (no progress bars)
- [ ] Invalid SCC strings show "N/A"
- [ ] Search works with numeric SCC
- [ ] Status dots show correct colors

### Visual
- [ ] Blueprint design consistency maintained
- [ ] Typography hierarchy correct
- [ ] Colors match design system
- [ ] Responsive layout works

### Technical
- [ ] No console errors (except expected warnings)
- [ ] Performance acceptable
- [ ] Cross-browser compatibility
- [ ] Accessibility standards met

### Documentation
- [ ] All test results documented
- [ ] Screenshots taken for each section
- [ ] Bugs reported with full details
- [ ] Sign-off given or issues escalated

---

## QA Sign-Off

**Tester Name**: _________________

**Test Date**: _________________

**Test Environment**: _________________

**Overall Result**: [ ] PASS [ ] FAIL (with issues logged)

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

**Signature**: _________________

---

## Quick Reference

### Key Features to Validate
1. ✅ SCC displays as 5-digit format or "N/A"
2. ✅ No progress bars in capacity column
3. ✅ Text-based capacity with status dots
4. ✅ No raw invalid strings displayed

### Critical Failures (Stop Testing)
- Cannot open UnifiedEditor
- JavaScript errors prevent functionality
- Build errors or crashes

### Contact for Issues
- **Development Team**: [Contact info]
- **Product Owner**: [Contact info]
- **Integration Lead**: [Contact info]

---

**Guide Version**: 1.0
**Last Updated**: 2025-10-07
**Status**: ✅ Ready for QA Testing
