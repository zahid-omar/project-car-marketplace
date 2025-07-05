# Color System and Tokens

## Overview

The Material You color system provides a comprehensive set of color tokens that adapt to user preferences and system themes. Our implementation supports both light and dark themes with dynamic color adaptation.

## Color Architecture

### 1. **Core Color Roles**

Material You defines semantic color roles that adapt to different themes:

```css
/* Primary Colors - Main brand colors */
--color-primary: oklch(40% 0.2 270);           /* Main brand color */
--color-on-primary: oklch(100% 0 0);           /* Text on primary */
--color-primary-container: oklch(90% 0.1 270); /* Primary backgrounds */
--color-on-primary-container: oklch(10% 0.1 270); /* Text on primary containers */

/* Secondary Colors - Supporting colors */
--color-secondary: oklch(50% 0.1 200);
--color-on-secondary: oklch(100% 0 0);
--color-secondary-container: oklch(90% 0.05 200);
--color-on-secondary-container: oklch(10% 0.05 200);

/* Tertiary Colors - Accent colors */
--color-tertiary: oklch(60% 0.15 120);
--color-on-tertiary: oklch(100% 0 0);
--color-tertiary-container: oklch(90% 0.08 120);
--color-on-tertiary-container: oklch(10% 0.08 120);
```

### 2. **Surface Colors**

Surface colors provide the background hierarchy for the interface:

```css
/* Surface Hierarchy */
--color-surface: oklch(98% 0 0);                    /* Base surface */
--color-surface-dim: oklch(87% 0.02 270);           /* Dimmed surface */
--color-surface-bright: oklch(98% 0 0);             /* Bright surface */

/* Surface Containers */
--color-surface-container-lowest: oklch(100% 0 0);  /* Highest elevation */
--color-surface-container-low: oklch(96% 0.01 270); /* Low elevation */
--color-surface-container: oklch(94% 0.01 270);     /* Default container */
--color-surface-container-high: oklch(92% 0.02 270); /* High elevation */
--color-surface-container-highest: oklch(90% 0.02 270); /* Highest container */

/* Surface Text */
--color-on-surface: oklch(10% 0 0);                 /* Primary text */
--color-on-surface-variant: oklch(30% 0.01 270);    /* Secondary text */
```

### 3. **Utility Colors**

System colors for specific states and feedback:

```css
/* Error Colors */
--color-error: oklch(50% 0.2 25);
--color-on-error: oklch(100% 0 0);
--color-error-container: oklch(90% 0.1 25);
--color-on-error-container: oklch(10% 0.1 25);

/* Warning Colors */
--color-warning: oklch(70% 0.15 70);
--color-on-warning: oklch(10% 0.05 70);
--color-warning-container: oklch(95% 0.08 70);
--color-on-warning-container: oklch(10% 0.08 70);

/* Success Colors */
--color-success: oklch(60% 0.15 140);
--color-on-success: oklch(100% 0 0);
--color-success-container: oklch(90% 0.08 140);
--color-on-success-container: oklch(10% 0.08 140);
```

### 4. **Border and Outline Colors**

```css
/* Borders and Outlines */
--color-outline: oklch(50% 0.01 270);               /* Default borders */
--color-outline-variant: oklch(80% 0.01 270);       /* Subtle borders */
--color-inverse-surface: oklch(20% 0.01 270);       /* Inverse backgrounds */
--color-inverse-on-surface: oklch(95% 0.01 270);    /* Inverse text */
--color-inverse-primary: oklch(80% 0.15 270);       /* Inverse primary */
```

## Usage Guidelines

### ✅ Do's

```tsx
// Use semantic color roles
<Button className="bg-primary text-on-primary">
  Primary Action
</Button>

// Use container colors for backgrounds
<Card className="bg-surface-container border-outline">
  Card content
</Card>

// Use proper text colors for contrast
<div className="bg-error-container text-on-error-container">
  Error message
</div>

// Use surface hierarchy for elevation
<div className="bg-surface-container-low">       {/* Base */}
  <div className="bg-surface-container">         {/* Elevated */}
    <div className="bg-surface-container-high">  {/* Higher */}
      Content with proper elevation
    </div>
  </div>
</div>
```

### ❌ Don'ts

```tsx
// Don't use hardcoded colors
<Button className="bg-blue-500 text-white">
  Avoid this
</Button>

// Don't mix color systems
<div className="bg-primary text-gray-900">
  Poor contrast
</div>

// Don't use wrong text colors
<div className="bg-error text-on-success">
  Inconsistent pairing
</div>
```

## Tailwind CSS Integration

Our Tailwind configuration includes Material You color tokens:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary colors
        'primary': 'oklch(var(--color-primary))',
        'on-primary': 'oklch(var(--color-on-primary))',
        'primary-container': 'oklch(var(--color-primary-container))',
        'on-primary-container': 'oklch(var(--color-on-primary-container))',
        
        // Surface colors
        'surface': 'oklch(var(--color-surface))',
        'surface-dim': 'oklch(var(--color-surface-dim))',
        'surface-bright': 'oklch(var(--color-surface-bright))',
        'surface-container': 'oklch(var(--color-surface-container))',
        'surface-container-low': 'oklch(var(--color-surface-container-low))',
        'surface-container-high': 'oklch(var(--color-surface-container-high))',
        'on-surface': 'oklch(var(--color-on-surface))',
        'on-surface-variant': 'oklch(var(--color-on-surface-variant))',
        
        // Utility colors
        'outline': 'oklch(var(--color-outline))',
        'outline-variant': 'oklch(var(--color-outline-variant))',
        
        // State colors
        'error': 'oklch(var(--color-error))',
        'error-container': 'oklch(var(--color-error-container))',
        'on-error': 'oklch(var(--color-on-error))',
        'on-error-container': 'oklch(var(--color-on-error-container))',
      }
    }
  }
}
```

## Dark Theme Colors

Dark theme variants use inverted lightness values:

```css
[data-theme="dark"] {
  /* Primary colors in dark theme */
  --color-primary: oklch(80% 0.15 270);
  --color-on-primary: oklch(20% 0.1 270);
  --color-primary-container: oklch(30% 0.15 270);
  --color-on-primary-container: oklch(90% 0.08 270);
  
  /* Surface colors in dark theme */
  --color-surface: oklch(6% 0.01 270);
  --color-surface-dim: oklch(6% 0.01 270);
  --color-surface-bright: oklch(24% 0.02 270);
  --color-surface-container: oklch(12% 0.02 270);
  --color-surface-container-low: oklch(10% 0.02 270);
  --color-surface-container-high: oklch(17% 0.02 270);
  --color-on-surface: oklch(90% 0.02 270);
  --color-on-surface-variant: oklch(80% 0.03 270);
}
```

## Dynamic Color System

### Theme Detection

```tsx
import { useMaterialYouTheme } from '@/lib/material-you-theme';

function ThemedComponent() {
  const { 
    theme, 
    isDarkMode, 
    toggleTheme, 
    systemPreference 
  } = useMaterialYouTheme();
  
  return (
    <div className={`theme-${theme}`}>
      <p className="text-on-surface">
        Current theme: {theme}
      </p>
      <Button 
        variant="outlined" 
        onClick={toggleTheme}
        className="border-outline text-primary"
      >
        Toggle Theme
      </Button>
    </div>
  );
}
```

### System Integration

The theme system automatically responds to system preferences:

```css
/* Automatic theme detection */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Apply dark theme colors */
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  :root {
    --color-outline: oklch(20% 0 0);
    --color-on-surface: oklch(0% 0 0);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}
```

## Color Accessibility

### Contrast Ratios

All color combinations meet WCAG 2.1 AA standards:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### Testing Colors

```tsx
// Test color contrast
function checkContrast(foreground: string, background: string) {
  // Implementation should check WCAG contrast ratios
  const ratio = calculateContrastRatio(foreground, background);
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    ratio
  };
}

// Example usage
const contrast = checkContrast('oklch(10% 0 0)', 'oklch(98% 0 0)');
console.log(`Contrast ratio: ${contrast.ratio}, AA: ${contrast.AA}`);
```

## Common Color Patterns

### 1. **Status Indicators**

```tsx
// Success state
<div className="bg-success-container text-on-success-container border-success/20">
  ✓ Operation completed successfully
</div>

// Error state
<div className="bg-error-container text-on-error-container border-error/20">
  ✗ Something went wrong
</div>

// Warning state
<div className="bg-warning-container text-on-warning-container border-warning/20">
  ⚠ Please review this information
</div>
```

### 2. **Interactive Elements**

```tsx
// Primary button
<Button className="bg-primary text-on-primary hover:bg-primary/90">
  Primary Action
</Button>

// Secondary button
<Button className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80">
  Secondary Action
</Button>

// Text button
<Button className="text-primary hover:bg-primary/5">
  Text Action
</Button>
```

### 3. **Card Hierarchy**

```tsx
// Base card
<Card className="bg-surface-container border-outline">
  Base content
</Card>

// Elevated card
<Card className="bg-surface-container-high border-outline-variant">
  Elevated content
</Card>

// Interactive card
<Card className="bg-surface-container hover:bg-surface-container-high border-outline transition-colors">
  Interactive content
</Card>
```

## Migration Guide

### From Legacy Colors

```tsx
// OLD - Legacy automotive colors
<div className="bg-automotive-blue text-white">

// NEW - Material You semantic colors
<div className="bg-primary text-on-primary">
```

### Custom Color Implementation

If you need custom colors, extend the token system:

```css
:root {
  /* Custom brand colors following Material You patterns */
  --color-brand: oklch(45% 0.18 260);
  --color-on-brand: oklch(100% 0 0);
  --color-brand-container: oklch(92% 0.09 260);
  --color-on-brand-container: oklch(8% 0.09 260);
}
```

```javascript
// Add to Tailwind config
colors: {
  'brand': 'oklch(var(--color-brand))',
  'on-brand': 'oklch(var(--color-on-brand))',
  'brand-container': 'oklch(var(--color-brand-container))',
  'on-brand-container': 'oklch(var(--color-on-brand-container))',
}
```

## Best Practices

1. **Always use semantic color roles** instead of hardcoded values
2. **Test color combinations** for accessibility compliance
3. **Consider both light and dark themes** when implementing
4. **Use container colors** for backgrounds and surfaces
5. **Follow the elevation hierarchy** for surface colors
6. **Provide sufficient contrast** for all text and interactive elements

---

*For more information, see the [Material Design 3 Color System](https://m3.material.io/styles/color/overview).* 