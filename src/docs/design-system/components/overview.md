# Component Library Overview

## Introduction

The Material You component library provides a comprehensive set of reusable UI components that follow Google's Material Design 3 guidelines. Each component is built with accessibility, theming, and performance in mind.

## Component Architecture

### Design Principles

1. **Consistency** - All components follow the same design patterns and conventions
2. **Accessibility** - WCAG 2.1 AA compliance built into every component
3. **Flexibility** - Components accept customizable props and className overrides
4. **Performance** - Optimized rendering and minimal re-renders
5. **Theming** - Full support for Material You dynamic color system

### Component Categories

Our component library is organized into several categories:

```
src/components/
├── ui/                          # Core UI components
│   ├── Button.tsx              # Button variations
│   ├── Input.tsx               # Form inputs
│   ├── Textarea.tsx            # Text areas
│   ├── Card.tsx                # Container cards
│   ├── Select.tsx              # Dropdown selections
│   └── index.ts                # Component exports
├── forms/                       # Form-specific components
├── filters/                     # Advanced filter components
├── messaging/                   # Chat and messaging UI
└── ...                         # Additional features
```

## Core Components

### 1. **Button Components**

Material You button variants with full accessibility support:

```tsx
import { Button } from '@/components/ui';

// Button variants
<Button variant="filled">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Text Action</Button>
<Button variant="elevated">Elevated Action</Button>
<Button variant="filled-tonal">Tonal Action</Button>

// Button sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// Button states
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

**Features:**
- ✅ All Material You button variants
- ✅ Loading states with spinners
- ✅ Icon support (leading/trailing)
- ✅ Full keyboard accessibility
- ✅ Focus management and ARIA labels
- ✅ Touch-friendly target sizes

### 2. **Input Components**

Form input components with Material You styling:

```tsx
import { Input } from '@/components/ui';

// Basic input
<Input 
  label="Email Address"
  placeholder="Enter your email"
  type="email"
/>

// Input variants
<Input variant="outlined" label="Outlined Input" />
<Input variant="filled" label="Filled Input" />

// Input with icons
<Input 
  label="Search"
  leadingIcon={<SearchIcon />}
  trailingIcon={<ClearIcon />}
/>

// Input states
<Input label="Field" error="This field is required" />
<Input label="Field" helperText="Additional information" />
<Input label="Field" disabled />
```

**Features:**
- ✅ Floating label animation
- ✅ Leading and trailing icons
- ✅ Error and helper text states
- ✅ Character counter support
- ✅ Proper form associations
- ✅ Screen reader compatibility

### 3. **Textarea Components**

Multi-line text input with enhanced features:

```tsx
import { Textarea } from '@/components/ui';

// Basic textarea
<Textarea 
  label="Description"
  placeholder="Enter description"
  rows={4}
/>

// Auto-resizing textarea
<Textarea 
  label="Comments"
  autoResize
  maxRows={8}
/>

// Textarea with character limit
<Textarea 
  label="Review"
  maxLength={500}
  showCounter
/>
```

**Features:**
- ✅ Auto-resize functionality
- ✅ Character counter display
- ✅ Floating labels
- ✅ Error and helper text
- ✅ Accessibility compliance
- ✅ Proper textarea semantics

### 4. **Card Components**

Container components for grouping related content:

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

// Basic card
<Card variant="elevated">
  <CardContent>
    Card content here
  </CardContent>
</Card>

// Complete card structure
<Card variant="outlined">
  <CardHeader>
    <h3 className="text-title-large">Card Title</h3>
    <p className="text-body-small text-on-surface-variant">
      Card subtitle
    </p>
  </CardHeader>
  <CardContent>
    Main card content goes here
  </CardContent>
  <CardFooter>
    <Button variant="text">Action</Button>
  </CardFooter>
</Card>

// Interactive card
<Card 
  variant="filled" 
  interactive
  onClick={() => console.log('Card clicked')}
>
  <CardContent>Clickable card content</CardContent>
</Card>
```

**Features:**
- ✅ Multiple elevation variants
- ✅ Modular sub-components
- ✅ Interactive states
- ✅ Proper semantic structure
- ✅ Keyboard navigation support
- ✅ Focus management

### 5. **Select Components**

Dropdown selection components:

```tsx
import { Select } from '@/components/ui';

// Basic select
<Select 
  label="Country"
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' }
  ]}
/>

// Multi-select
<Select 
  label="Skills"
  multiple
  options={skillOptions}
  value={selectedSkills}
  onChange={setSelectedSkills}
/>

// Select with search
<Select 
  label="City"
  searchable
  placeholder="Search cities..."
  options={cityOptions}
/>
```

**Features:**
- ✅ Single and multi-select modes
- ✅ Search/filter functionality
- ✅ Keyboard navigation
- ✅ Custom option rendering
- ✅ Loading states
- ✅ ARIA compliance

## Advanced Components

### 1. **Filter Components**

Specialized components for advanced filtering interfaces:

```tsx
import { 
  RangeSlider, 
  MultiSelect, 
  ToggleGroup, 
  CollapsibleSection 
} from '@/components/filters';

// Range slider for numeric ranges
<RangeSlider
  label="Price Range"
  min={0}
  max={100000}
  value={[10000, 50000]}
  onChange={setPriceRange}
  formatValue={(value) => `$${value.toLocaleString()}`}
/>

// Multi-select with search
<MultiSelect
  label="Vehicle Makes"
  options={makeOptions}
  value={selectedMakes}
  onChange={setSelectedMakes}
  searchable
  maxDisplayed={5}
/>

// Toggle group for categories
<ToggleGroup
  label="Condition"
  options={[
    { value: 'excellent', label: 'Excellent', icon: '⭐' },
    { value: 'good', label: 'Good', icon: '👍' },
    { value: 'fair', label: 'Fair', icon: '👌' }
  ]}
  value={condition}
  onChange={setCondition}
/>
```

### 2. **Form Components**

Specialized form components for complex data entry:

```tsx
import { 
  BasicDetailsForm, 
  VehicleSpecsForm, 
  ModificationsForm 
} from '@/components/forms';

// Multi-step form components
<BasicDetailsForm 
  data={formData}
  onChange={updateFormData}
  onNext={goToNextStep}
/>

<VehicleSpecsForm
  data={formData}
  onChange={updateFormData}
  onNext={goToNextStep}
  onBack={goToPreviousStep}
/>
```

### 3. **Navigation Components**

Enhanced navigation with Material You styling:

```tsx
import { MaterialYouNavigation } from '@/components';

<MaterialYouNavigation
  user={currentUser}
  isAuthenticated={isLoggedIn}
  currentPath={pathname}
  onThemeToggle={toggleTheme}
/>
```

## Accessibility Features

All components include comprehensive accessibility support:

### Keyboard Navigation

```tsx
// All interactive components support keyboard navigation
<Button>Tab to focus, Enter/Space to activate</Button>
<Input /> {/* Tab to focus, Arrow keys for text navigation */}
<Select /> {/* Tab to focus, Arrow keys to navigate options */}
```

### Screen Reader Support

```tsx
// Components include proper ARIA labels and descriptions
<Input 
  label="Password"
  type="password"
  aria-describedby="password-help"
  helperText="Must be at least 8 characters"
/>

<Button 
  aria-label="Close dialog"
  onClick={closeDialog}
>
  ×
</Button>
```

### Focus Management

```tsx
// Components properly manage focus states
<Card interactive>
  {/* Proper focus rings and hover states */}
</Card>

<Button autoFocus>
  {/* Can auto-focus when needed */}
</Button>
```

## Theming Integration

All components work seamlessly with the Material You theme system:

```tsx
import { useMaterialYouTheme } from '@/lib/material-you-theme';

function ThemedComponent() {
  const { theme, isDarkMode } = useMaterialYouTheme();
  
  return (
    <div className={`theme-${theme}`}>
      <Button variant="filled">
        Automatically themed button
      </Button>
      <Card variant="elevated">
        <CardContent>
          Theme-aware card content
        </CardContent>
      </Card>
    </div>
  );
}
```

## Component Props and APIs

### Common Props Pattern

Most components follow a consistent props pattern:

```tsx
interface CommonComponentProps {
  // Styling
  className?: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  
  // States
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  id?: string;
  
  // Events
  onClick?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}
```

### Component-Specific Props

Each component extends the common pattern with specific functionality:

```tsx
// Button-specific props
interface ButtonProps extends CommonComponentProps {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'filled-tonal';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

// Input-specific props
interface InputProps extends CommonComponentProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}
```

## Performance Optimization

### Component Memoization

```tsx
// Components use React.memo where appropriate
const Button = React.memo(({ children, ...props }) => {
  return (
    <button {...props}>
      {children}
    </button>
  );
});

// Large lists use virtualization
const VirtualizedList = React.memo(({ items }) => {
  // Implementation with react-window or similar
});
```

### Bundle Optimization

```tsx
// Tree-shakable imports
import { Button, Input } from '@/components/ui';

// Instead of importing everything
// import * as UI from '@/components/ui'; // ❌ Avoid this
```

## Testing Strategy

### Unit Testing

```tsx
// Components include comprehensive test coverage
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui';

test('Button handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Accessibility Testing

```tsx
// Automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Test</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration Guide

### From Legacy Components

```tsx
// OLD - Legacy button
<button className="btn btn-primary">
  Action
</button>

// NEW - Material You button
<Button variant="filled">
  Action
</Button>

// OLD - Legacy form input
<div className="form-group">
  <label>Email</label>
  <input type="email" className="form-control" />
</div>

// NEW - Material You input
<Input 
  label="Email" 
  type="email"
  variant="outlined"
/>
```

### Gradual Migration Strategy

1. **Start with new features** - Use Material You components for all new development
2. **Replace high-traffic components** - Migrate frequently used components first
3. **Update page by page** - Gradually convert existing pages
4. **Remove legacy styles** - Clean up old CSS after migration is complete

## Best Practices

### 1. **Component Usage**

```tsx
// ✅ Use semantic variants
<Button variant="filled">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>

// ✅ Provide proper labels
<Input label="Email Address" type="email" />

// ✅ Handle loading states
<Button loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

### 2. **Accessibility**

```tsx
// ✅ Use proper ARIA labels
<Button aria-label="Close dialog" onClick={close}>
  ×
</Button>

// ✅ Associate labels with inputs
<Input 
  id="email-input"
  label="Email"
  aria-describedby="email-help"
  helperText="We'll never share your email"
/>
```

### 3. **Performance**

```tsx
// ✅ Memoize expensive computations
const expensiveOptions = useMemo(() => 
  computeOptions(data), [data]
);

// ✅ Use callback refs for dynamic behavior
const inputRef = useCallback((node) => {
  if (node && shouldFocus) {
    node.focus();
  }
}, [shouldFocus]);
```

## Future Roadmap

### Planned Components

- **Data Table** - Sortable, filterable tables with pagination
- **Date Picker** - Calendar-based date selection
- **File Upload** - Drag-and-drop file upload component
- **Stepper** - Multi-step process indicator
- **Timeline** - Event timeline visualization
- **Tooltip** - Contextual help and information

### Enhancements

- **Animation Library** - Enhanced motion and transitions
- **Icon System** - Comprehensive Material You icon set
- **Form Builder** - Dynamic form generation
- **Chart Components** - Data visualization components

---

*This component library is continuously evolving. Check back for updates and new components.* 