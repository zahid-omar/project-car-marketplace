'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types for animation utilities
export type MaterialYouAnimation = 
  | 'fade-in'
  | 'fade-out'
  | 'slide-in-right'
  | 'slide-in-left'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'page-enter'
  | 'page-exit'
  | 'modal-enter'
  | 'modal-exit'
  | 'toast-enter'
  | 'toast-exit';

export type MaterialYouTransition = 
  | 'standard'
  | 'emphasized'
  | 'quick'
  | 'slow';

export interface AnimationConfig {
  animation?: MaterialYouAnimation;
  transition?: MaterialYouTransition;
  duration?: number;
  delay?: number;
  repeat?: boolean;
  onComplete?: () => void;
  onStart?: () => void;
  respectReducedMotion?: boolean;
}

export interface UseAnimationReturn {
  ref: React.RefObject<HTMLElement>;
  isAnimating: boolean;
  trigger: () => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Custom hook for managing Material You animations with accessibility and performance optimizations
 */
export function useAnimation(config: AnimationConfig): UseAnimationReturn {
  const ref = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Animation event handlers
  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true);
    config.onStart?.();
  }, [config]);

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false);
    
    // Cleanup will-change for performance
    if (ref.current) {
      ref.current.style.willChange = 'auto';
    }
    
    config.onComplete?.();
  }, [config]);

  // Setup animation listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('animationstart', handleAnimationStart);
    element.addEventListener('animationend', handleAnimationEnd);

    return () => {
      element.removeEventListener('animationstart', handleAnimationStart);
      element.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [handleAnimationStart, handleAnimationEnd]);

  // Trigger animation
  const trigger = useCallback(() => {
    const element = ref.current;
    if (!element || !config.animation) return;

    // Respect reduced motion preference
    if (prefersReducedMotion && config.respectReducedMotion !== false) {
      config.onComplete?.();
      return;
    }

    // Optimize for animation
    element.style.willChange = 'transform, opacity';

    // Apply animation class
    const animationClass = `md-${config.animation}`;
    element.classList.add(animationClass);

    // Remove class after animation completes
    if (!config.repeat) {
      timeoutRef.current = setTimeout(() => {
        element.classList.remove(animationClass);
      }, config.duration || 300);
    }
  }, [config, prefersReducedMotion]);

  // Reset animation
  const reset = useCallback(() => {
    const element = ref.current;
    if (!element || !config.animation) return;

    const animationClass = `md-${config.animation}`;
    element.classList.remove(animationClass);
    element.style.willChange = 'auto';
    setIsAnimating(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [config.animation]);

  // Pause animation
  const pause = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    element.classList.add('md-animation-paused');
  }, []);

  // Resume animation
  const resume = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    element.classList.remove('md-animation-paused');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ref,
    isAnimating,
    trigger,
    reset,
    pause,
    resume
  };
}

/**
 * Hook for staggered animations (animating lists/groups)
 */
export function useStaggeredAnimation({
  count,
  delay = 50,
  animation = 'fade-in',
  ...config
}: AnimationConfig & { count: number; delay?: number }) {
  const [triggered, setTriggered] = useState(false);
  const refs = useRef<(HTMLElement | null)[]>([]);
  
  // Initialize refs array based on count
  useEffect(() => {
    refs.current = new Array(count).fill(null);
  }, [count]);

  const trigger = useCallback(() => {
    if (triggered) return;
    
    setTriggered(true);
    
    // Use the config spread operator values
    const animationConfig = { animation, delay, ...config };
    
    refs.current.forEach((element, index) => {
      if (!element) return;
      
      setTimeout(() => {
        const animationClass = `md-${animationConfig.animation}`;
        element.classList.add(animationClass);
        
        // Apply stagger delay as CSS custom property
        element.style.setProperty('--stagger-index', index.toString());
        element.style.setProperty('--stagger-delay', `${animationConfig.delay}ms`);
      }, index * delay);
    });
  }, [triggered, animation, delay, config]);

  const reset = useCallback(() => {
    setTriggered(false);
    
    refs.current.forEach((element) => {
      if (!element) return;
      
      const animationClass = `md-${animation}`;
      element.classList.remove(animationClass);
      element.style.removeProperty('--stagger-index');
      element.style.removeProperty('--stagger-delay');
    });
  }, [animation]);

  const getRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  return {
    trigger,
    reset,
    getRef,
    triggered
  };
}

/**
 * Hook for intersection-based animations (animate when element enters viewport)
 */
export function useIntersectionAnimation(config: AnimationConfig & {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const animationHook = useAnimation(config);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting && (!hasTriggered || !config.triggerOnce)) {
          setIsVisible(true);
          setHasTriggered(true);
          animationHook.trigger();
        } else if (!isIntersecting && !config.triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold: config.threshold || 0.1,
        rootMargin: config.rootMargin || '50px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [config, hasTriggered, animationHook]);

  // Merge refs
  const mergedRef = useCallback((node: HTMLElement | null) => {
    if (ref && 'current' in ref) {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    }
    if (animationHook.ref && 'current' in animationHook.ref) {
      (animationHook.ref as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [animationHook.ref]);

  return {
    ...animationHook,
    ref: mergedRef,
    isVisible,
    hasTriggered
  };
}

/**
 * Hook for ripple effect animation
 */
export function useRipple() {
  const ref = useRef<HTMLElement>(null);

  const createRipple = useCallback((event: React.MouseEvent) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.3;
      pointer-events: none;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      animation: mdRipple var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
    `;

    // Add ripple keyframe if not exists
    if (!document.querySelector('#md-ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'md-ripple-keyframes';
      style.textContent = `
        @keyframes mdRipple {
          0% {
            transform: scale(0);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 300);
  }, []);

  return {
    ref,
    createRipple
  };
}

/**
 * Utility functions for common animation patterns
 */
export const animationUtils = {
  // Slide animations
  slideIn: (direction: 'left' | 'right' | 'up' | 'down') => `md-slide-in-${direction}`,
  
  // Page transitions
  pageEnter: 'md-page-enter',
  pageExit: 'md-page-exit',
  
  // Modal animations
  modalEnter: 'md-modal-enter',
  modalExit: 'md-modal-exit',
  
  // Toast animations
  toastEnter: 'md-toast-enter',
  toastExit: 'md-toast-exit',
  
  // Loading states
  skeleton: 'md-skeleton',
  spinner: 'md-spinner',
  
  // Interaction states
  buttonPress: 'md-button-press',
  hoverLift: 'md-hover-lift',
  iconBounce: 'md-icon-bounce',
  heartLike: 'md-heart-like',
  
  // Focus states
  focusRing: 'md-focus-ring',
  
  // Transition utilities
  transition: {
    standard: 'md-transition-standard',
    emphasized: 'md-transition-emphasized',
    quick: 'md-transition-quick',
    slow: 'md-transition-slow'
  },
  
  // Performance optimizations
  gpuAccelerated: 'md-gpu-accelerated',
  animateOptimized: 'md-animate-optimized',
  animateComplete: 'md-animate-complete'
}; 