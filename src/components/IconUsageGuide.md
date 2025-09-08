# Blueprint v6 Icon Usage Guide

## The Issue
In Blueprint v6.1.0 with TypeScript 4.9.x, you may encounter the error:
```
TS2786: 'Icon' cannot be used as a JSX component. 
Its return type 'ReactNode' is not a valid JSX element.
Type 'undefined' is not assignable to type 'Element | null'.
```

## Root Cause
- **TypeScript 4.9.x** has strict JSX component return type checking
- **Blueprint v6** changed Icon component to return `React.ReactNode` instead of `JSX.Element`
- This creates a type compatibility issue in older TypeScript versions

## Solutions

### Solution 1: Use IconWrapper Component (Recommended)
```tsx
// Import the wrapper instead of direct Icon
import IconWrapper from './IconWrapper';
import { IconNames, Intent } from '@blueprintjs/core';

// Use normally
<IconWrapper 
  icon={IconNames.TICK_CIRCLE} 
  intent={Intent.SUCCESS} 
  size={16}
/>
```

### Solution 2: Update TypeScript (Long-term)
Update to TypeScript 5.1+ in package.json:
```json
{
  "dependencies": {
    "typescript": "^5.1.0"
  }
}
```

### Solution 3: Direct Icon Usage with Type Assertion
```tsx
import { Icon } from '@blueprintjs/core';
import { IconNames, Intent } from '@blueprintjs/icons';

// Use with type assertion (not recommended)
{(Icon as any)({
  icon: IconNames.TICK_CIRCLE,
  intent: Intent.SUCCESS,
  size: 16
})}
```

## Correct Blueprint v6 Icon API

### Import Structure
```tsx
import { Icon, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
```

### Icon Properties
- `icon`: Required - `IconName` string or `React.JSX.Element`
- `intent`: Optional - Blueprint intent (`Intent.PRIMARY`, `Intent.SUCCESS`, etc.)
- `size`: Optional - number or `IconSize` enum value
- `autoLoad`: Optional - automatically load icon contents (default: `true`)
- `svgProps`: Optional - props to apply to SVG element

### Usage Examples
```tsx
// Basic usage
<Icon icon={IconNames.SETTINGS} size={16} />

// With intent
<Icon 
  icon={IconNames.TICK_CIRCLE} 
  intent={Intent.SUCCESS} 
  size={20}
/>

// With custom SVG props
<Icon 
  icon={IconNames.WARNING_SIGN} 
  intent={Intent.WARNING}
  svgProps={{ 'data-testid': 'warning-icon' }}
/>

// Custom icon element
<Icon icon={<MyCustomSVG />} />
```

## Alternative: Direct Icon Imports
You can also import icons directly from @blueprintjs/icons:
```tsx
import { TickCircle, Settings, WarningSign } from '@blueprintjs/icons';

// Use directly
<TickCircle size={16} />
<Settings size={20} />
<WarningSign size={18} />
```

## Migration Notes
- Your existing usage syntax is correct for Blueprint v6
- The IconWrapper solution maintains full compatibility
- Consider upgrading TypeScript for better long-term support
- Direct icon imports can reduce bundle size if you use few icons