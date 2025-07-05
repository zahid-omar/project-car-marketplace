# Accessibility Overview

## Introduction

Accessibility is a fundamental principle of our Material You design system. We strive to create inclusive experiences that work for all users, regardless of their abilities or the assistive technologies they use. Our implementation follows WCAG 2.1 AA standards and Material Design 3 accessibility guidelines.

## Accessibility Principles

### 1. **Perceivable**
Information and user interface components must be presentable to users in ways they can perceive.

### 2. **Operable**
User interface components and navigation must be operable by all users.

### 3. **Understandable**
Information and the operation of user interface must be understandable.

### 4. **Robust**
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

## Implementation Status

Our design system has achieved comprehensive accessibility compliance across all major components:

### ✅ **Fully Accessible Components**

1. **Navigation Components**
   - Skip to main content links
   - Proper focus management and keyboard navigation
   - ARIA labels and expanded states
   - Focus trapping in mobile drawer
   - Screen reader announcements

2. **ListingCard Component**
   - Semantic HTML with `<article>` elements
   - Comprehensive ARIA labels and descriptions
   - Screen reader support with live regions
   - Keyboard navigation with focus indicators
   - Dynamic alt text generation for images
   - Enhanced button accessibility with contextual labeling
   - Proper semantic structure with headings and lists

3. **RatingDisplay Component**
   - Semantic rating representation with proper roles
   - Screen reader descriptions for star ratings ("3 filled stars, 2 empty stars")
   - Comprehensive rating announcements ("Average rating: 4.2 out of 5 stars, based on 27 reviews")
   - Accessible loading states with proper announcements
   - Enhanced ARIA labels for all rating information

4. **AdvancedPagination Component**
   - Navigation landmark with proper roles and labels
   - Live region announcements for page changes
   - Comprehensive ARIA labels for navigation buttons
   - Enhanced keyboard navigation with proper event handling
   - Screen reader descriptions for current page state
   - Accessible "Jump to page" functionality with help text
   - aria-current="page" for current page identification

5. **UserReviews Component**
   - Interactive star rating system with full keyboard navigation (arrow keys)
   - ARIA radiogroup pattern with role="radio" and aria-checked states
   - Screen reader announcements for rating navigation
   - Enhanced form accessibility with fieldset/legend structure
   - Live regions (aria-live="polite") for form status announcements
   - Character counter with live updates
   - Semantic content structure with proper heading hierarchy
   - Individual review articles with proper role="listitem" structure

6. **FilterSidebar Component**
   - Complete semantic structure transformation (aside, header, form, fieldset elements)
   - Proper role attributes (region, search, radiogroup, group, list, listitem)
   - Hierarchical heading structure with h2, h3, h4 elements
   - Comprehensive form accessibility with htmlFor associations
   - ARIA descriptions (aria-describedby) for all form controls
   - Live regions for filter result announcements
   - Complex interaction patterns (price range, multi-select, dynamic search)
   - Full keyboard accessibility across all interactive elements

7. **Modal Components (ContactSellerModal, MakeOfferModal)**
   - Complete focus management with focus trapping and restoration
   - Proper ARIA dialog attributes (role="dialog", aria-modal="true")
   - Keyboard navigation with Escape key and Tab cycling
   - Semantic structure with header, main, form elements
   - Live regions for form status announcements
   - Enhanced form accessibility with proper labels and error handling

8. **Core UI Components**
   - LoadingSpinner: Proper ARIA roles and announcements
   - ToastNotification: ARIA labels and live regions
   - SearchInput: Enhanced suggestion dropdown with keyboard navigation
   - NotificationDropdown: Focus management and proper semantics

## Core Accessibility Features

### 1. **Semantic HTML**

All components use appropriate semantic HTML elements:

```tsx
// ✅ Proper semantic structure for listings
<article role="article" aria-labelledby="listing-title-123" aria-describedby="listing-desc-123">
  <header>
    <h3 id="listing-title-123" className="text-title-large">
      2023 BMW M3 Competition
    </h3>
  </header>
  <main>
    <p id="listing-desc-123" className="text-body-medium">
      Vehicle description with comprehensive details
    </p>
    <ul role="list" aria-label="Vehicle specifications">
      <li role="listitem">
        <span role="text">Mileage: 15,000 miles</span>
      </li>
      <li role="listitem">
        <span role="text">Engine: 3.0L Twin Turbo</span>
      </li>
    </ul>
  </main>
  <footer>
    <button 
      type="button" 
      aria-label="Add 2023 BMW M3 Competition to favorites"
      aria-pressed="false"
    >
      Add to Favorites
    </button>
  </footer>
</article>

// ❌ Avoid generic divs for interactive content
<div onClick={handleClick}>
  <div>Title</div>
  <div>Content</div>
  <div>Action</div>
</div>
```

### 2. **ARIA Implementation**

Comprehensive ARIA support throughout the design system:

```tsx
// Form accessibility with proper associations
<fieldset>
  <legend>Rating Selection</legend>
  <div role="radiogroup" aria-label="Rate your experience from 1 to 5 stars">
    {[1, 2, 3, 4, 5].map(rating => (
      <button
        key={rating}
        role="radio"
        aria-checked={selectedRating === rating}
        aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
        onClick={() => setRating(rating)}
      >
        ⭐
      </button>
    ))}
  </div>
  <div aria-live="polite" aria-atomic="true">
    {selectedRating && `You selected ${selectedRating} stars`}
  </div>
</fieldset>

// Filter interface with complex interactions
<aside role="region" aria-label="Filter options">
  <header>
    <h2>Filter Vehicles</h2>
  </header>
  <form role="search">
    <fieldset>
      <legend>Price Range</legend>
      <div role="group" aria-labelledby="price-range-label">
        <label id="price-range-label">Select price range</label>
        <div role="radiogroup" aria-describedby="price-help">
          <button role="radio" aria-checked="false">Under $20,000</button>
          <button role="radio" aria-checked="true">$20,000 - $50,000</button>
          <button role="radio" aria-checked="false">Over $50,000</button>
        </div>
        <div id="price-help" className="sr-only">
          Use arrow keys to navigate price ranges
        </div>
      </div>
    </fieldset>
  </form>
</aside>
```

### 3. **Keyboard Navigation**

Full keyboard accessibility across all components:

```tsx
// Enhanced keyboard event handling
function AccessibleComponent() {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleActivation();
        break;
      case 'Escape':
        handleClose();
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        navigateNext();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        navigatePrevious();
        break;
    }
  };

  return (
    <div
      role="application"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      Interactive content with full keyboard support
    </div>
  );
}
```

### 4. **Screen Reader Support**

Optimized content for screen readers with proper announcements:

```tsx
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Comprehensive image accessibility
<img
  src={vehicleImage}
  alt={generateImageAlt({
    year: 2023,
    make: 'BMW',
    model: 'M3 Competition',
    condition: 'Excellent',
    price: '$75,000'
  })}
  role="img"
  aria-describedby="image-description"
/>
<div id="image-description" className="sr-only">
  High-quality photo of a pristine 2023 BMW M3 Competition in excellent condition, 
  professionally photographed showing the vehicle's exterior in detail
</div>

// Form feedback and validation
<input
  type="email"
  aria-invalid={hasError}
  aria-describedby="email-error email-help"
  aria-required="true"
/>
{hasError && (
  <div id="email-error" role="alert" aria-live="assertive">
    Please enter a valid email address
  </div>
)}
<div id="email-help">
  We'll use this email to send you important updates
</div>
```

### 5. **Focus Management**

Proper focus handling throughout the application:

```tsx
// Modal focus management
function AccessibleModal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (lastFocusedElement.current) {
      lastFocusedElement.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
    if (event.key === 'Tab') {
      trapFocus(event, modalRef.current);
    }
  };

  return (
    <dialog
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
      className="focus:outline-none"
    >
      {children}
    </dialog>
  );
}
```

## Testing Strategy

### 1. **Automated Testing**

```tsx
// Accessibility testing with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

test('Component has no accessibility violations', async () => {
  const { container } = render(<AccessibleComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. **Manual Testing**

- **Keyboard-only navigation** through all interactive elements
- **Screen reader testing** with NVDA, JAWS, and VoiceOver
- **Color contrast verification** using WebAIM Contrast Checker
- **Focus indicator visibility** across all themes
- **Zoom testing** up to 200% without horizontal scrolling

### 3. **Accessibility Checklist**

Before releasing any component:

- [ ] Semantic HTML structure is correct
- [ ] ARIA labels and roles are properly implemented
- [ ] Keyboard navigation works for all interactions
- [ ] Focus indicators are visible and appropriate
- [ ] Color contrast meets WCAG AA standards (4.5:1 minimum)
- [ ] Screen reader announcements are clear and helpful
- [ ] Error messages are properly associated with form controls
- [ ] Loading states are announced to assistive technologies
- [ ] Dynamic content changes are communicated via live regions

## Common Accessibility Patterns

### 1. **Interactive Lists**

```tsx
<ul role="list" aria-label="Vehicle listings">
  {vehicles.map((vehicle, index) => (
    <li key={vehicle.id} role="listitem">
      <article
        role="article"
        aria-labelledby={`vehicle-title-${vehicle.id}`}
        tabIndex={0}
        className="focus-visible:ring-2 focus-visible:ring-primary"
      >
        <h3 id={`vehicle-title-${vehicle.id}`}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        {/* Content */}
      </article>
    </li>
  ))}
</ul>
```

### 2. **Form Validation**

```tsx
<form noValidate>
  <fieldset>
    <legend>Contact Information</legend>
    <div>
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        type="email"
        aria-invalid={emailError ? 'true' : 'false'}
        aria-describedby="email-error email-help"
        required
      />
      {emailError && (
        <div id="email-error" role="alert">
          {emailError}
        </div>
      )}
      <div id="email-help">
        We'll never share your email with anyone else
      </div>
    </div>
  </fieldset>
</form>
```

### 3. **Status Updates**

```tsx
function StatusAnnouncer({ message, type = 'polite' }) {
  return (
    <div
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Usage
<StatusAnnouncer message="Vehicle saved to favorites" />
<StatusAnnouncer message="Error: Unable to save vehicle" type="assertive" />
```

## Browser and Screen Reader Support

### Tested Combinations

- **Windows**: NVDA + Chrome, JAWS + Edge, Dragon + Chrome
- **macOS**: VoiceOver + Safari, VoiceOver + Chrome
- **iOS**: VoiceOver + Safari
- **Android**: TalkBack + Chrome

### Best Practices for Screen Readers

1. **Use descriptive, unique headings** for page structure
2. **Provide context for form controls** with labels and descriptions
3. **Announce dynamic changes** with live regions
4. **Use semantic markup** instead of relying solely on ARIA
5. **Test with actual screen readers**, not just accessibility tools

## Resources and Guidelines

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3 Accessibility](https://m3.material.io/foundations/accessibility/overview)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

*Our accessibility implementation is continuously improved based on user feedback and testing. For specific accessibility questions or to report issues, please refer to our accessibility testing guidelines or reach out to the development team.* 