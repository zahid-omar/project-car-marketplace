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

### 4. Page Transitions

```css
.md-page-enter           /* Page entrance animation */
.md-page-exit            /* Page exit animation */
.md-modal-enter          /* Modal entrance */
.md-modal-exit           /* Modal exit */
.md-toast-enter          /* Toast entrance */
.md-toast-exit           /* Toast exit */
```

### 5. Loading States

```css
.md-skeleton             /* Shimmer loading effect */
.md-spinner              /* Circular loading spinner */
.md-progress-bar         /* Indeterminate progress bar */
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

// Pause/Resume
animation.pause();
animation.resume();
```

### useStaggeredAnimation

For animating lists with staggered timing:

```tsx
import { useStaggeredAnimation } from '@/hooks/useAnimations';

const stagger = useStaggeredAnimation({
  count: 5,
  delay: 100,
  animation: 'fade-in'
});

return (
  <div>
    {items.map((item, index) => (
      <div key={item.id} ref={stagger.getRef(index)}>
        {item.content}
      </div>
    ))}
    <button onClick={stagger.trigger}>Animate All</button>
  </div>
);
```

### useIntersectionAnimation

Animate when elements enter the viewport:

```tsx
import { useIntersectionAnimation } from '@/hooks/useAnimations';

const animation = useIntersectionAnimation({
  animation: 'slide-in-up',
  threshold: 0.1,
  triggerOnce: true
});

return (
  <div ref={animation.ref}>
    Content that animates when visible
  </div>
);
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

### Enhanced Toast

```tsx
import { useToast } from '@/components/ToastNotification';

const { showSuccess, showError } = useToast();

// Animated toast with Material You styling
showSuccess('Success!', 'Your listing has been saved.');
```

Features:
- Toast enter/exit animations
- Staggered animations for multiple toasts
- Material You icons
- Ripple effect on close button
- Focus and interaction animations

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

### Focus Management

All interactive elements include proper focus indicators:

```css
.md-focus-ring {
  /* Animated focus ring that scales and fades in */
}
```

### ARIA Support

Loading states include proper ARIA attributes:

```tsx
<div className="md-spinner" role="status" aria-label="Loading">
  <span className="sr-only">Loading...</span>
</div>
```

## Performance Optimizations

### Hardware Acceleration

```css
.md-gpu-accelerated {
  transform: translate3d(0, 0, 0);
  will-change: transform;
}
```

### Optimized Animations

```css
.md-animate-optimized {
  will-change: transform, opacity;
  transform: translate3d(0, 0, 0);
}

.md-animate-complete {
  will-change: auto; /* Cleanup after animation */
}
```

### Animation Cleanup

The hooks automatically manage `will-change` properties for optimal performance:

```tsx
// Automatically sets will-change during animation
// Cleans up will-change after completion
const animation = useAnimation({ animation: 'fade-in' });
```

## Staggered Animations

For lists and groups of elements:

```tsx
// CSS approach
<div className="md-stagger-children" style={{'--stagger-delay': '100ms'}}>
  <div style={{'--stagger-index': 0}}>Item 1</div>
  <div style={{'--stagger-index': 1}}>Item 2</div>
  <div style={{'--stagger-index': 2}}>Item 3</div>
</div>

// React hook approach
const stagger = useStaggeredAnimation({ count: 3, delay: 100 });
```

## Integration with Material You Tokens

All animations use Material You design tokens:

```css
/* Duration tokens */
var(--md-sys-motion-duration-short1)    /* 50ms */
var(--md-sys-motion-duration-medium2)   /* 300ms */
var(--md-sys-motion-duration-long2)     /* 500ms */

/* Easing tokens */
var(--md-sys-motion-easing-standard)            /* cubic-bezier(0.2, 0, 0, 1) */
var(--md-sys-motion-easing-emphasized)          /* cubic-bezier(0.2, 0, 0, 1) */
var(--md-sys-motion-easing-emphasized-decelerate) /* cubic-bezier(0.05, 0.7, 0.1, 1) */
```

## Best Practices

### 1. Use Semantic Animation Names

```tsx
// Good
const animation = useAnimation({ animation: 'page-enter' });

// Avoid
const animation = useAnimation({ animation: 'fade-in' }); // for page transitions
```

### 2. Respect User Preferences

```tsx
const animation = useAnimation({
  animation: 'slide-in-up',
  respectReducedMotion: true // Default: true
});
```

### 3. Cleanup Performance Properties

```tsx
useEffect(() => {
  return () => {
    // Hooks automatically cleanup will-change
    // Manual cleanup if needed:
    element.style.willChange = 'auto';
  };
}, []);
```

### 4. Use Appropriate Timing

```css
/* Quick interactions */
.button:hover { transition: var(--md-sys-motion-duration-short2); }

/* State changes */
.modal { animation-duration: var(--md-sys-motion-duration-medium2); }

/* Page transitions */
.page { animation-duration: var(--md-sys-motion-duration-long1); }
```

## Troubleshooting

### Animations Not Working

1. Check if `material-you-animations.css` is imported in `globals.css`
2. Verify animation class names (they should start with `md-`)
3. Check for conflicting CSS that might override animations

### Performance Issues

1. Ensure `will-change` is cleaned up after animations
2. Use hardware acceleration classes for complex animations
3. Check for too many simultaneous animations

### Accessibility Issues

1. Verify `prefers-reduced-motion` is respected
2. Ensure focus indicators are visible
3. Add appropriate ARIA attributes for loading states

## Examples in Codebase

### Button Component
- Location: `src/components/ui/Button.tsx`
- Features: Ripple, press animation, focus ring, hover lift

### Toast Component
- Location: `src/components/ToastNotification.tsx`
- Features: Enter/exit animations, staggered toasts, ripple close button

### Card Components
- Usage: Apply `md-hover-lift` class for elevation changes

## Future Enhancements

1. **More Component Integrations**: Apply to modals, dropdowns, navigation
2. **Advanced Animations**: Shared element transitions, morphing animations
3. **Motion Preferences**: More granular motion control options
4. **Performance Monitoring**: Animation performance metrics and optimization

---

This animation system provides a solid foundation for creating smooth, accessible, and performant user interfaces that align with Material Design 3 principles while maintaining excellent performance and accessibility standards. 