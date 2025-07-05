# Material You Icon System

This document provides a comprehensive guide to using the Material You icon system in the Project Car Marketplace application.

## Overview

The Material You icon system provides a consistent, accessible, and theme-aware way to use icons throughout the application. It uses official Material Design icons from `@mui/icons-material` and follows Material Design 3 (Material You) specifications.

## Basic Usage

```tsx
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

// Basic icon
<MaterialYouIcon name="home" />

// With size and styling
<MaterialYouIcon 
  name="heart" 
  size="lg" 
  className="text-red-500" 
/>

// Interactive icon
<MaterialYouIcon 
  name="search" 
  size="md" 
  onClick={() => console.log('Search clicked')}
  aria-label="Search listings"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `MaterialYouIconName` | Required | The icon name (see available icons below) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Icon size following Material You specifications |
| `variant` | `'outlined' \| 'filled' \| 'rounded' \| 'sharp'` | `'outlined'` | Icon variant (future use) |
| `weight` | `100 \| 200 \| 300 \| 400 \| 500 \| 600 \| 700` | `400` | Icon weight (future use) |
| `filled` | `boolean` | `false` | Whether to use filled variant |
| `className` | `string` | - | Additional CSS classes |
| `aria-hidden` | `boolean` | - | Hide from screen readers |
| `aria-label` | `string` | - | Accessible label |
| `onClick` | `() => void` | - | Click handler |
| `style` | `React.CSSProperties` | - | Inline styles |

## Icon Sizes

The icon system follows Material You size specifications:

- `xs`: 12px
- `sm`: 16px  
- `md`: 20px (default)
- `lg`: 24px
- `xl`: 32px
- `2xl`: 40px

## Available Icons

### Navigation & Actions
- `home` - Home/dashboard
- `arrow-left` / `arrow-right` - Directional navigation
- `chevron-left` / `chevron-right` / `chevron-up` / `chevron-down` - Subtle navigation
- `plus` / `minus` - Add/remove actions
- `close` / `x-mark` - Close/cancel actions
- `menu` - Menu/hamburger icon
- `refresh` / `arrow-path` - Refresh/reload

### User & Account
- `user` / `user-outline` - User profile
- `user-circle` - User avatar
- `settings` / `settings-outline` - Settings/preferences

### Content & Media
- `photo` - Images/gallery
- `camera` - Camera/photo capture
- `upload` / `download` - File operations
- `share` - Sharing functionality

### Communication
- `envelope` - Email/messages
- `phone` - Phone/contact
- `paper-airplane` - Send message
- `bell` / `bell-outline` - Notifications

### Search & Filters
- `search` - Search functionality
- `adjustments-horizontal` - Filters/settings
- `bars-arrow-up` - Sorting

### Status & Feedback
- `check` / `check-circle` - Success/completion
- `exclamation-triangle` - Warning
- `exclamation-circle` - Error
- `information-circle` - Information
- `x-circle` - Error/failure

### Views & Layout
- `list-bullet` - List view
- `squares-2x2` - Grid view
- `view-columns` - Column view

### Favorites & Ratings
- `heart` / `heart-outline` - Favorites
- `star` / `star-outline` - Ratings

### Location & Time
- `map-pin` - Location/address
- `calendar` - Date/time

### Vehicle & Commerce
- `car` - Vehicle/automotive
- `currency-dollar` - Price/money

### Editing & Actions
- `edit` - Edit/modify
- `trash` - Delete/remove
- `eye` / `eye-slash` - Visibility toggle

### Connectivity
- `wifi` / `wifi-slash` - WiFi status
- `cloud` / `cloud-slash` - Cloud connectivity

### Security
- `lock-closed` / `lock-open` - Security/privacy
- `shield-check` - Security/verification

## Theme Integration

Icons automatically integrate with the Material You theme system:

```tsx
// Uses theme-aware colors
<MaterialYouIcon name="heart" className="text-md-sys-primary" />

// Interactive states
<MaterialYouIcon 
  name="star" 
  className="text-md-sys-on-surface-variant hover:text-md-sys-on-surface"
  onClick={handleClick}
/>
```

## Accessibility

The icon system is built with accessibility in mind:

### Screen Readers
```tsx
// Decorative icons (hidden from screen readers)
<MaterialYouIcon name="chevron-right" aria-hidden="true" />

// Meaningful icons (with labels)
<MaterialYouIcon 
  name="heart" 
  aria-label="Add to favorites"
  onClick={toggleFavorite}
/>
```

### Interactive Icons
```tsx
// Interactive icons get proper focus states
<MaterialYouIcon 
  name="close" 
  onClick={handleClose}
  aria-label="Close dialog"
  className="focus:ring-2 focus:ring-md-sys-primary"
/>
```

## Migration from Legacy Icons

### From Heroicons
```tsx
// Before
import { HeartIcon } from '@heroicons/react/24/outline';
<HeartIcon className="w-5 h-5" />

// After
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
<MaterialYouIcon name="heart-outline" size="md" />
```

### From Lucide React
```tsx
// Before
import { Heart } from 'lucide-react';
<Heart className="w-5 h-5" />

// After
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
<MaterialYouIcon name="heart-outline" size="md" />
```

## Migration Utilities

Use the migration utilities to systematically update components:

```tsx
import { getHeroiconEquivalent, getLucideEquivalent } from '@/lib/icon-migration';

// Get Material You equivalent for existing icons
const migration = getHeroiconEquivalent('HeartIcon');
console.log(migration.materialYouIcon); // 'heart-outline'
```

## Best Practices

### Consistent Sizing
- Use `sm` (16px) for inline icons within text
- Use `md` (20px) for standard UI icons
- Use `lg` (24px) for prominent actions
- Use `xl`/`2xl` for large featured icons

### Color Usage
- Use Material You color tokens: `text-md-sys-on-surface-variant` for subtle icons
- Use `text-md-sys-primary` for interactive icons
- Use semantic colors for status: `text-red-500` for errors, `text-green-500` for success

### Accessibility
- Always include `aria-label` for interactive icons
- Use `aria-hidden="true"` for decorative icons
- Ensure sufficient color contrast
- Provide keyboard navigation for interactive icons

### Performance
- Icons are efficiently rendered using MUI components
- No additional bundle size impact for unused icons
- Automatic tree-shaking support

## Examples

### Favorite Button
```tsx
<MaterialYouIcon 
  name={isFavorited ? "heart" : "heart-outline"}
  size="sm"
  className={cn(
    'transition-colors duration-md-short2',
    isFavorited 
      ? 'text-red-500' 
      : 'text-md-sys-on-surface-variant hover:text-red-500'
  )}
  onClick={toggleFavorite}
  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
/>
```

### Navigation Arrow
```tsx
<MaterialYouIcon 
  name="chevron-right"
  size="sm"
  className="transition-transform duration-md-short2 group-hover:translate-x-1"
  aria-hidden="true"
/>
```

### Status Indicator
```tsx
<MaterialYouIcon 
  name="check-circle"
  size="lg" 
  className="text-green-500"
  aria-label="Success"
/>
```

## Future Enhancements

- Support for animated icons
- Additional Material Symbol variants
- Custom icon registration
- Icon theme customization
- Batch migration tools 