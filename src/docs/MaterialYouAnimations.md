# Material You Animation System

A comprehensive animation system built on Material Design 3 (Material You) motion guidelines, providing smooth, accessible, and performant animations throughout the Project Car Marketplace application.

## Overview

The Material You Animation System consists of:

1. **CSS Animation Library** (`material-you-animations.css`)
2. **React Animation Hooks** (`useAnimations.ts`)
3. **Component Integrations** (Button, Toast, etc.)
4. **Performance Optimizations** and accessibility features

## Quick Start

### Basic Usage

```tsx
import { useAnimation, animationUtils } from '@/hooks/useAnimations';

function MyComponent() {
  const animation = useAnimation({
    animation: 'fade-in',
    duration: 300
  });

  return (
    <div
      ref={animation.ref}
      className="md-transition-standard"
      onClick={animation.trigger}
    >
      Click to animate
    </div>
  );
}
```

### CSS Classes

```tsx
// Button with ripple and press animation
<button className="md-button-press md-ripple md-focus-ring">
  Click me
</button>

// Card with hover lift
<div className="card md-hover-lift">
  Hover for lift effect
</div>

// Loading spinner
<div className="md-spinner" />
```

## Animation Categories

### 1. Core Transitions

Standard Material You timing and easing functions:

```css
.md-transition-standard    /* 300ms, standard easing */
.md-transition-emphasized  /* 350ms, emphasized easing */
.md-transition-quick      /* 100ms, standard easing */
.md-transition-slow       /* 500ms, emphasized easing */
```

### 2. State Change Animations

```css
.md-fade-in              /* Fade in with slight upward movement */
.md-fade-out             /* Fade out with slight downward movement */
.md-slide-in-right       /* Slide in from right */
.md-slide-in-left        /* Slide in from left */
.md-slide-in-up          /* Slide in from bottom */
.md-slide-in-down        /* Slide in from top */
```

### 3. Micro-interactions

```css
.md-button-press         /* Scale down on active */
.md-hover-lift           /* Lift and shadow on hover */
.md-focus-ring           /* Animated focus ring */
.md-icon-bounce          /* Icon scale animation on hover */
.md-heart-like           /* Heart pulse animation */
```

## React Animation Hooks

### useAnimation

Core animation hook with accessibility and performance optimizations:

```tsx
import { useAnimation } from '@/hooks/useAnimations';

const animation = useAnimation({
  animation: 'fade-in',
  duration: 300,
  delay: 100,
  onComplete: () => console.log('Animation complete'),
  respectReducedMotion: true
});

// Trigger animation
animation.trigger();

// Reset animation
animation.reset();
```

### useRipple

Material You ripple effect:

```tsx
import { useRipple } from '@/hooks/useAnimations';

const { ref, createRipple } = useRipple();

return (
  <button
    ref={ref}
    onClick={createRipple}
    className="relative overflow-hidden"
  >
    Click for ripple
  </button>
);
```

## Component Examples

### Enhanced Button

```tsx
import { Button } from '@/components/ui/Button';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

<Button
  variant="filled"
  size="md"
  icon={<MaterialYouIcon name="heart" />}
  loading={isLoading}
>
  Like This Car
</Button>
```

Features:
- Automatic ripple effects
- Button press animation
- Focus ring animation
- Hover lift (elevated variant)
- Material You spinner when loading
- Icon bounce animations

## Accessibility Features

### Reduced Motion Support

The system automatically respects user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Optimizations

The hooks automatically manage `will-change` properties for optimal performance and cleanup after animations complete.

## Best Practices

1. Use semantic animation names
2. Respect user motion preferences
3. Cleanup performance properties
4. Use appropriate timing for different interaction types

---

For complete documentation and examples, see the full animation system implementation in the codebase. 