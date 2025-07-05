# Typography System

## Overview

The Material You typography system provides a comprehensive type scale that ensures readability, hierarchy, and visual consistency across all interfaces. Our implementation uses a responsive approach that adapts to different screen sizes and user preferences.

## Type Scale

Material You defines a 15-level type scale with five categories:

### 1. **Display Styles**

Large, prominent text for hero sections and major headings:

```css
/* Display Large - 57px/64px */
.text-display-large {
  font-family: 'Inter', sans-serif;
  font-size: 3.5rem;        /* 56px */
  line-height: 4rem;        /* 64px */
  font-weight: 400;
  letter-spacing: -0.25px;
}

/* Display Medium - 45px/52px */
.text-display-medium {
  font-family: 'Inter', sans-serif;
  font-size: 2.8125rem;     /* 45px */
  line-height: 3.25rem;     /* 52px */
  font-weight: 400;
  letter-spacing: 0;
}

/* Display Small - 36px/44px */
.text-display-small {
  font-family: 'Inter', sans-serif;
  font-size: 2.25rem;       /* 36px */
  line-height: 2.75rem;     /* 44px */
  font-weight: 400;
  letter-spacing: 0;
}
```

### 2. **Headline Styles**

Prominent headings for sections and important content:

```css
/* Headline Large - 32px/40px */
.text-headline-large {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;          /* 32px */
  line-height: 2.5rem;      /* 40px */
  font-weight: 400;
  letter-spacing: 0;
}

/* Headline Medium - 28px/36px */
.text-headline-medium {
  font-family: 'Inter', sans-serif;
  font-size: 1.75rem;       /* 28px */
  line-height: 2.25rem;     /* 36px */
  font-weight: 400;
  letter-spacing: 0;
}

/* Headline Small - 24px/32px */
.text-headline-small {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;        /* 24px */
  line-height: 2rem;        /* 32px */
  font-weight: 400;
  letter-spacing: 0;
}
```

### 3. **Title Styles**

Titles for cards, dialogs, and smaller sections:

```css
/* Title Large - 22px/28px */
.text-title-large {
  font-family: 'Inter', sans-serif;
  font-size: 1.375rem;      /* 22px */
  line-height: 1.75rem;     /* 28px */
  font-weight: 400;
  letter-spacing: 0;
}

/* Title Medium - 16px/24px */
.text-title-medium {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;          /* 16px */
  line-height: 1.5rem;      /* 24px */
  font-weight: 500;
  letter-spacing: 0.15px;
}

/* Title Small - 14px/20px */
.text-title-small {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;      /* 14px */
  line-height: 1.25rem;     /* 20px */
  font-weight: 500;
  letter-spacing: 0.1px;
}
```

### 4. **Label Styles**

Text for UI elements like buttons, tabs, and form labels:

```css
/* Label Large - 14px/20px */
.text-label-large {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;      /* 14px */
  line-height: 1.25rem;     /* 20px */
  font-weight: 500;
  letter-spacing: 0.1px;
}

/* Label Medium - 12px/16px */
.text-label-medium {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;       /* 12px */
  line-height: 1rem;        /* 16px */
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Label Small - 11px/16px */
.text-label-small {
  font-family: 'Inter', sans-serif;
  font-size: 0.6875rem;     /* 11px */
  line-height: 1rem;        /* 16px */
  font-weight: 500;
  letter-spacing: 0.5px;
}
```

### 5. **Body Styles**

Text for paragraphs, descriptions, and general content:

```css
/* Body Large - 16px/24px */
.text-body-large {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;          /* 16px */
  line-height: 1.5rem;      /* 24px */
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* Body Medium - 14px/20px */
.text-body-medium {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;      /* 14px */
  line-height: 1.25rem;     /* 20px */
  font-weight: 400;
  letter-spacing: 0.25px;
}

/* Body Small - 12px/16px */
.text-body-small {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;       /* 12px */
  line-height: 1rem;        /* 16px */
  font-weight: 400;
  letter-spacing: 0.4px;
}
```

## Font Stack

Our typography system uses a carefully selected font stack:

```css
/* Primary font family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

/* Monospace font family (for code) */
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
```

### Inter Font Features

We use Inter with specific OpenType features for better readability:

```css
font-feature-settings: 
  'cv02' 1,    /* Alternate a */
  'cv03' 1,    /* Alternate g */
  'cv04' 1,    /* Alternate y */
  'cv11' 1,    /* Alternate six */
  'calt' 1,    /* Contextual alternates */
  'kern' 1;    /* Kerning */
```

## Usage Guidelines

### ✅ Do's

```tsx
// Use semantic heading hierarchy
<h1 className="text-display-medium">Page Title</h1>
<h2 className="text-headline-large">Section Title</h2>
<h3 className="text-headline-medium">Subsection Title</h3>

// Use appropriate body text sizes
<p className="text-body-large">
  Important paragraph text that needs more prominence.
</p>
<p className="text-body-medium">
  Standard paragraph text for most content.
</p>

// Use labels for UI elements
<label className="text-label-large">
  Form Field Label
</label>
<button className="text-label-large">
  Button Text
</button>

// Combine with color tokens
<h2 className="text-headline-large text-on-surface">
  Properly colored heading
</h2>
```

### ❌ Don'ts

```tsx
// Don't use arbitrary font sizes
<h1 className="text-2xl">Avoid this</h1>

// Don't break semantic hierarchy
<h1 className="text-body-small">Confusing hierarchy</h1>
<h3 className="text-display-large">Too prominent for h3</h3>

// Don't use wrong styles for context
<button className="text-display-medium">Button</button>
<p className="text-label-small">Long paragraph text</p>
```

## Responsive Typography

### Mobile Adjustments

Typography scales down appropriately on smaller screens:

```css
/* Mobile-first approach */
@media (max-width: 640px) {
  .text-display-large {
    font-size: 2.5rem;       /* 40px instead of 56px */
    line-height: 3rem;       /* 48px instead of 64px */
  }
  
  .text-display-medium {
    font-size: 2rem;         /* 32px instead of 45px */
    line-height: 2.5rem;     /* 40px instead of 52px */
  }
  
  .text-headline-large {
    font-size: 1.75rem;      /* 28px instead of 32px */
    line-height: 2.25rem;    /* 36px instead of 40px */
  }
}
```

### Large Screen Enhancements

```css
@media (min-width: 1200px) {
  .text-display-large {
    font-size: 4rem;         /* 64px for large displays */
    line-height: 4.5rem;     /* 72px line height */
  }
}
```

## Accessibility Features

### 1. **Readable Line Heights**

All type styles use line heights optimized for readability:
- Display/Headline: 1.1-1.2x font size
- Body text: 1.4-1.6x font size
- Labels: 1.3-1.4x font size

### 2. **Sufficient Contrast**

Combined with our color system for WCAG compliance:

```tsx
// High contrast text combinations
<h1 className="text-display-large text-on-surface">
  Primary heading
</h1>

<p className="text-body-medium text-on-surface-variant">
  Secondary text content
</p>
```

### 3. **User Preferences**

Respects system typography preferences:

```css
/* Respect user font size preferences */
@media (prefers-reduced-motion: no-preference) {
  .text-scale-responsive {
    font-size: max(1rem, 1em);
  }
}

/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  .text-body-medium {
    font-weight: 500;        /* Slightly bolder for clarity */
  }
}
```

## Component Integration

### Form Components

```tsx
// Input labels and help text
<div className="space-y-2">
  <label className="text-label-large text-on-surface">
    Email Address
  </label>
  <input 
    className="text-body-medium"
    placeholder="Enter your email"
  />
  <p className="text-body-small text-on-surface-variant">
    We'll never share your email with anyone else.
  </p>
</div>
```

### Button Components

```tsx
// Button text sizes
<Button className="text-label-large">
  Primary Action
</Button>

<Button size="small" className="text-label-medium">
  Secondary Action
</Button>
```

### Card Components

```tsx
<Card>
  <CardHeader>
    <h3 className="text-title-large text-on-surface">
      Card Title
    </h3>
    <p className="text-body-small text-on-surface-variant">
      Card subtitle or description
    </p>
  </CardHeader>
  <CardContent>
    <p className="text-body-medium text-on-surface">
      Main card content with appropriate text size.
    </p>
  </CardContent>
</Card>
```

## Custom Typography Utilities

### Text Truncation

```css
/* Single line truncation */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.text-truncate-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
```

### Text Emphasis

```css
/* Emphasis utilities following Material You */
.text-emphasis-high {
  color: oklch(var(--color-on-surface));
  opacity: 0.87;
}

.text-emphasis-medium {
  color: oklch(var(--color-on-surface-variant));
  opacity: 0.60;
}

.text-emphasis-low {
  color: oklch(var(--color-on-surface-variant));
  opacity: 0.38;
}
```

## Tailwind Configuration

Typography classes are configured in Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Display styles
        'display-large': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.25px' }],
        'display-medium': ['2.8125rem', { lineHeight: '3.25rem', letterSpacing: '0' }],
        'display-small': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '0' }],
        
        // Headline styles
        'headline-large': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0' }],
        'headline-medium': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0' }],
        'headline-small': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0' }],
        
        // Title styles
        'title-large': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'title-medium': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.15px' }],
        'title-small': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.1px' }],
        
        // Body styles
        'body-large': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.5px' }],
        'body-medium': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.25px' }],
        'body-small': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.4px' }],
        
        // Label styles
        'label-large': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.1px' }],
        'label-medium': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.5px' }],
        'label-small': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.5px' }],
      }
    }
  }
}
```

## Performance Considerations

### Font Loading Strategy

```tsx
// Next.js font optimization
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
```

### Font Face Declaration

```css
/* Self-hosted fallback */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

## Best Practices

1. **Use the semantic type scale** rather than arbitrary sizes
2. **Maintain consistent hierarchy** throughout your application
3. **Consider reading distance** when choosing type sizes
4. **Test with actual content** to ensure readability
5. **Respect user preferences** for font size and contrast
6. **Use appropriate line heights** for different content types
7. **Combine with color tokens** for proper contrast
8. **Test across devices** to ensure responsive behavior

## Common Patterns

### Article/Blog Content

```tsx
<article className="prose prose-material-you">
  <h1 className="text-display-small text-on-surface mb-4">
    Article Title
  </h1>
  <p className="text-body-large text-on-surface-variant mb-6">
    Article subtitle or excerpt
  </p>
  <div className="text-body-medium text-on-surface space-y-4">
    <p>Article content...</p>
  </div>
</article>
```

### Form Layouts

```tsx
<form className="space-y-6">
  <h2 className="text-headline-medium text-on-surface">
    Contact Information
  </h2>
  <div className="space-y-4">
    <div>
      <label className="text-label-large text-on-surface block mb-2">
        Full Name
      </label>
      <input className="text-body-medium" />
    </div>
  </div>
</form>
```

---

*For more information, see the [Material Design 3 Typography](https://m3.material.io/styles/typography/overview).* 