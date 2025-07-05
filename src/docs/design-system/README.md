# Project Car Marketplace - Material You Design System

## Overview

This document provides comprehensive documentation for the Material You design system implemented in the Project Car Marketplace application. The design system follows Google's Material Design 3 (Material You) guidelines and provides a consistent, accessible, and modern user experience.

## 🎨 Design System Foundation

Our design system is built on four core pillars:

1. **Design Tokens** - Consistent color, typography, spacing, and elevation values
2. **Component Library** - Reusable UI components following Material You principles
3. **Accessibility** - WCAG 2.1 AA compliance throughout
4. **Theming** - Dynamic color and theme adaptation

## 📁 Documentation Structure

```
src/docs/design-system/
├── README.md                    # This overview document
├── tokens/
│   ├── colors.md               # Color system and tokens
│   ├── typography.md           # Type scale and text styles
│   ├── spacing.md              # Spacing scale and layout
│   └── elevation.md            # Elevation and shadow system
├── components/
│   ├── overview.md             # Component library overview
│   ├── buttons.md              # Button components
│   ├── inputs.md               # Input and form components
│   ├── cards.md                # Card components
│   ├── navigation.md           # Navigation components
│   └── modals.md               # Modal and dialog components
├── theming/
│   ├── theme-system.md         # Theme architecture
│   ├── dynamic-colors.md       # Dynamic color system
│   └── customization.md        # Customization guide
├── accessibility/
│   ├── overview.md             # Accessibility guidelines
│   ├── keyboard-navigation.md  # Keyboard accessibility
│   └── screen-readers.md       # Screen reader support
├── patterns/
│   ├── forms.md                # Form patterns and validation
│   ├── layouts.md              # Layout patterns
│   └── animations.md           # Motion and animation
└── migration/
    ├── from-legacy.md          # Migration from legacy styles
    └── troubleshooting.md      # Common issues and solutions
```

## 🚀 Quick Start

### 1. Using Design Tokens

```tsx
// Import the design tokens
import { cn } from '@/lib/utils';

// Using color tokens
<div className="bg-surface text-on-surface border-outline">
  Content with Material You colors
</div>

// Using typography tokens
<h1 className="text-display-large">Large Display Text</h1>
<p className="text-body-medium">Body text content</p>

// Using spacing tokens
<div className="p-4 gap-3 rounded-xl">
  Consistent spacing and borders
</div>
```

### 2. Using Components

```tsx
import { Button, Card, Input } from '@/components/ui';

export function ExampleUsage() {
  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-headline-medium mb-4">Example Form</h2>
      <Input 
        label="Name" 
        placeholder="Enter your name"
        className="mb-4"
      />
      <Button variant="filled" size="large">
        Submit
      </Button>
    </Card>
  );
}
```

### 3. Using Theme Context

```tsx
import { useMaterialYouTheme } from '@/lib/material-you-theme';

export function ThemedComponent() {
  const { theme, toggleTheme, isDarkMode } = useMaterialYouTheme();
  
  return (
    <div className={cn('p-4', isDarkMode ? 'bg-surface-dark' : 'bg-surface')}>
      <Button onClick={toggleTheme}>
        Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
      </Button>
    </div>
  );
}
```

## 🎯 Design Principles

### 1. **Consistency**
- Unified visual language across all components
- Consistent spacing, typography, and color usage
- Predictable interaction patterns

### 2. **Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Proper contrast ratios

### 3. **Modularity**
- Reusable components with clear APIs
- Composable design patterns
- Flexible theming system

### 4. **Performance**
- Optimized CSS with minimal bundle size
- Efficient component rendering
- Lazy loading where appropriate

## 🔧 Technical Implementation

### CSS Architecture

```css
/* Design tokens are defined in CSS custom properties */
:root {
  /* Color tokens */
  --color-primary: oklch(40% 0.2 270);
  --color-on-primary: oklch(100% 0 0);
  
  /* Typography tokens */
  --font-display-large: 400 3.5rem/4rem 'Inter', sans-serif;
  --font-body-medium: 400 0.875rem/1.25rem 'Inter', sans-serif;
  
  /* Spacing tokens */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### Component Structure

```tsx
// Example component with Material You patterns
interface ButtonProps {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'filled-tonal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Button({ 
  variant = 'filled', 
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        
        // Variant styles
        variant === 'filled' && 'bg-primary text-on-primary hover:bg-primary/90',
        variant === 'outlined' && 'border border-outline text-primary hover:bg-primary/5',
        variant === 'text' && 'text-primary hover:bg-primary/5',
        
        // Size styles
        size === 'small' && 'px-3 py-1.5 text-sm',
        size === 'medium' && 'px-4 py-2 text-base',
        size === 'large' && 'px-6 py-3 text-lg',
        
        // Custom classes
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner className="mr-2" />}
      {children}
    </button>
  );
}
```

## 📊 Implementation Status

- ✅ **Foundation Complete** - Design tokens, theme system, and CSS utilities
- ✅ **Core Components** - Button, Input, Card, Textarea with full Material You compliance
- ✅ **Application Layouts** - Homepage, browse page, and dashboard transformed
- ✅ **Accessibility** - WCAG 2.1 AA compliance across major components
- 🔄 **Iconography** - Material You icons integration (pending)
- 🔄 **Motion** - Animation guidelines implementation (pending)
- ✅ **Documentation** - Comprehensive design system documentation

## 🔗 Related Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Material You Color System](https://m3.material.io/styles/color/overview)
- [Material You Typography](https://m3.material.io/styles/typography/overview)
- [Accessibility Guidelines](https://m3.material.io/foundations/accessibility/overview)

## 🤝 Contributing

When contributing to the design system:

1. Follow the established patterns and conventions
2. Ensure accessibility compliance
3. Test across different themes and screen sizes
4. Update documentation for new components or changes
5. Run the component tests before submitting

## 📞 Support

For questions about the design system:
- Check the specific component documentation
- Review the troubleshooting guide
- Consult the accessibility guidelines
- Reach out to the design system team

---

*This design system documentation is maintained by the Project Car Marketplace development team and follows Material Design 3 guidelines.* 