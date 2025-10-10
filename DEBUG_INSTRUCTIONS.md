# Debug Instructions for SCC Display Issue

## Current Status
✅ Dev server running on http://localhost:3000
✅ Debug logging added to `formatSccNumber()`
✅ Code compiled successfully
✅ **ROOT CAUSE FIXED**: Mock data now generates numeric SCC values

## Issue (RESOLVED)
UnifiedEditor modal was showing undefined/empty instead of formatted SCC numbers because mock data wasn't generating sccNumber field.

## Fix Applied
- Mock data generator now creates numeric SCC values (10000-99999)
- All opportunities now have sccNumber field
- formatSccNumber will receive valid numbers instead of undefined

## Debug Steps

### 1. Open Browser DevTools
1. Navigate to http://localhost:3000
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab

### 2. Clear Browser Cache
**CRITICAL**: Hard refresh to get the latest code:
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### 3. Open UnifiedEditor Modal
1. Go to Collections page
2. Click on any opportunity row to open the UnifiedEditor
3. Look at the header section where SCC number appears

### 4. Check Console Logs
Look for messages starting with `[formatSccNumber]`:

```
[formatSccNumber] Called with: { scc: 'unit-1', type: 'string' }
[formatSccNumber] String detected, attempting parse: unit-1
[formatSccNumber] Parse failed, returning N/A
```

## What the Logs Tell Us

### Scenario A: No logs appear
**Problem**: Browser is using cached code
**Solution**:
- Clear browser cache completely
- Do hard refresh (Cmd+Shift+R)
- If still no logs, restart browser

### Scenario B: Logs show 'unit-1' being passed
**Problem**: Data source still has string values
**Expected behavior**: Function should return "N/A" for invalid strings
**If showing 'unit-1'**: The old component is being used

### Scenario C: Logs show undefined/null
**Problem**: Opportunity data doesn't have sccNumber field
**Expected behavior**: Should return "N/A"

### Scenario D: Logs show valid number
**Expected behavior**: Should format with zero-padding (e.g., 00123)

## Files Modified
- `src/utils/sccFormatting.ts` - Debug logging added
- `src/components/UnifiedEditor/OpportunityInfoHeader.tsx` - Uses formatSccNumber
- `src/components/UnifiedEditor/OpportunityInfoHeaderEnhanced.tsx` - Uses formatSccNumber

## Next Steps After Checking Console

### If no logs appear:
Browser cache issue - need complete cache clear and restart

### If logs show function being called:
Check what value is being passed and whether output matches expected behavior

### If 'unit-1' still appears in UI:
Either:
1. formatSccNumber not being called at all (component issue)
2. Different component is being rendered (routing issue)
3. Browser showing cached HTML (refresh issue)
