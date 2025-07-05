'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Material You Theme Types
export type ThemeMode = 'light' | 'dark' | 'auto';
export type DeviceSize = 'mobile' | 'tablet' | 'desktop';
export type TypographySize = 'small' | 'normal' | 'large';

export interface MaterialYouTheme {
  mode: ThemeMode;
  primaryColor: string;
  isDynamic: boolean;
  deviceSize: DeviceSize;
  typographySize: TypographySize;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
}

export interface MaterialYouContextType {
  theme: MaterialYouTheme;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  generatePalette: (sourceColor: string) => void;
  isDarkMode: boolean;
  applyTheme: () => void;
  mounted: boolean;
}

// Create the context
const MaterialYouContext = createContext<MaterialYouContextType | null>(null);

// Device detection utility
function getDeviceSize(): DeviceSize {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Typography preference detection
function getTypographyPreference(): TypographySize {
  if (typeof window === 'undefined') return 'normal';
  
  // Check for browser zoom or user preference
  const devicePixelRatio = window.devicePixelRatio || 1;
  const zoom = Math.round((window.outerWidth / window.innerWidth) * 100) / 100;
  
  // Detect if user has larger text preferences
  if (zoom > 1.2 || devicePixelRatio < 1) return 'large';
  if (zoom < 0.9) return 'small';
  return 'normal';
}

// Accessibility preferences detection
function getAccessibilityPreferences() {
  if (typeof window === 'undefined') {
    return {
      prefersReducedMotion: false,
      prefersHighContrast: false,
    };
  }

  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
  };
}

// Color utilities based on Material You algorithms
export class MaterialYouColorUtils {
  /**
   * Extract dominant color from an image or use a provided color
   * This is a simplified version - production apps should use more sophisticated algorithms
   */
  static async extractDominantColor(imageUrl?: string): Promise<string> {
    if (!imageUrl) return '#6750a4'; // Default Material You purple
    
    try {
      // For demo purposes, return default color
      // In production, you'd use libraries like ColorThief or custom canvas analysis
      return '#6750a4';
    } catch {
      return '#6750a4';
    }
  }

  /**
   * Generate a complete Material You color palette from a source color
   * This is a simplified implementation
   */
  static generatePalette(sourceColor: string) {
    // This would typically use the Material Color Utilities library
    // For now, we'll return predefined palettes based on the source
    const palettes = {
      '#6750a4': {
        primary: '#6750a4',
        onPrimary: '#ffffff',
        primaryContainer: '#eaddff',
        onPrimaryContainer: '#21005d',
      },
      '#d32f2f': {
        primary: '#d32f2f',
        onPrimary: '#ffffff',
        primaryContainer: '#ffebee',
        onPrimaryContainer: '#b71c1c',
      },
      '#1976d2': {
        primary: '#1976d2',
        onPrimary: '#ffffff',
        primaryContainer: '#e3f2fd',
        onPrimaryContainer: '#0d47a1',
      },
    };

    return palettes[sourceColor as keyof typeof palettes] || palettes['#6750a4'];
  }

  /**
   * Apply color tokens to CSS custom properties
   */
  static applyColorTokens(palette: any) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      const cssVar = `--md-sys-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value as string);
    });
  }

  /**
   * Apply theme mode (light/dark) to the DOM
   */
  static applyThemeMode(mode: ThemeMode) {
    if (typeof document === 'undefined') return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'auto' && prefersDark);
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }

  /**
   * Apply device-specific adaptations
   */
  static applyDeviceAdaptations(deviceSize: DeviceSize, typographySize: TypographySize) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply device size class
    root.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
    root.classList.add(`device-${deviceSize}`);
    
    // Apply typography size
    root.classList.remove('typography-small', 'typography-normal', 'typography-large');
    root.classList.add(`typography-${typographySize}`);
    
    // Apply responsive typography scaling
    let scale = 1;
    switch (deviceSize) {
      case 'mobile':
        scale = typographySize === 'large' ? 1 : 0.875;
        break;
      case 'tablet':
        scale = typographySize === 'large' ? 1.0625 : 0.9375;
        break;
      case 'desktop':
        scale = typographySize === 'large' ? 1.125 : 1;
        break;
    }
    
    root.style.setProperty('--md-sys-typography-scale', scale.toString());
  }
}

// Theme Provider Component
export function MaterialYouThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<MaterialYouTheme>({
    mode: 'auto',
    primaryColor: '#6750a4',
    isDynamic: false,
    deviceSize: 'desktop',
    typographySize: 'normal',
    prefersReducedMotion: false,
    prefersHighContrast: false,
  });

  // Initialize theme from localStorage and system preferences
  useEffect(() => {
    setMounted(true);
    
    const savedMode = (typeof window !== 'undefined' ? localStorage.getItem('material-you-theme-mode') : null) as ThemeMode || 'auto';
    const savedColor = (typeof window !== 'undefined' ? localStorage.getItem('material-you-primary-color') : null) || '#6750a4';
    const deviceSize = getDeviceSize();
    const typographySize = getTypographyPreference();
    const accessibilityPrefs = getAccessibilityPreferences();

    setTheme(prev => ({
      ...prev,
      mode: savedMode,
      primaryColor: savedColor,
      deviceSize,
      typographySize,
      ...accessibilityPrefs,
    }));
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme.mode === 'auto') {
        MaterialYouColorUtils.applyThemeMode('auto');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode, mounted]);

  // Listen for window resize to update device size
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handleResize = () => {
      const newDeviceSize = getDeviceSize();
      const newTypographySize = getTypographyPreference();
      
      setTheme(prev => ({
        ...prev,
        deviceSize: newDeviceSize,
        typographySize: newTypographySize,
      }));
    };

    const debouncedResize = debounce(handleResize, 150);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [mounted]);

  // Listen for accessibility preference changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = () => {
      setTheme(prev => ({ ...prev, prefersReducedMotion: motionQuery.matches }));
    };

    const handleContrastChange = () => {
      setTheme(prev => ({ ...prev, prefersHighContrast: contrastQuery.matches }));
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, [mounted]);

  // Apply theme when it changes
  useEffect(() => {
    if (mounted) {
      applyTheme();
    }
  }, [theme, mounted]);

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('material-you-theme-mode', mode);
    }
  };

  const setPrimaryColor = (color: string) => {
    setTheme(prev => ({ ...prev, primaryColor: color }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('material-you-primary-color', color);
    }
  };

  const generatePalette = (sourceColor: string) => {
    const palette = MaterialYouColorUtils.generatePalette(sourceColor);
    MaterialYouColorUtils.applyColorTokens(palette);
    setPrimaryColor(sourceColor);
    setTheme(prev => ({ ...prev, isDynamic: true }));
  };

  const applyTheme = () => {
    if (!mounted) return;
    
    // Apply color theme
    MaterialYouColorUtils.applyThemeMode(theme.mode);
    
    // Apply device adaptations
    MaterialYouColorUtils.applyDeviceAdaptations(theme.deviceSize, theme.typographySize);
    
    // Apply color palette
    const palette = MaterialYouColorUtils.generatePalette(theme.primaryColor);
    MaterialYouColorUtils.applyColorTokens(palette);
  };

  const isDarkMode = (() => {
    if (!mounted) return false;
    if (theme.mode === 'dark') return true;
    if (theme.mode === 'light') return false;
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  })();

  const contextValue: MaterialYouContextType = {
    theme,
    setThemeMode,
    setPrimaryColor,
    generatePalette,
    isDarkMode,
    applyTheme,
    mounted,
  };

  return (
    <MaterialYouContext.Provider value={contextValue}>
      {children}
    </MaterialYouContext.Provider>
  );
}

// Hook to use Material You theme
export function useMaterialYouTheme(): MaterialYouContextType {
  const context = useContext(MaterialYouContext);
  if (!context) {
    throw new Error('useMaterialYouTheme must be used within a MaterialYouThemeProvider');
  }
  return context;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// Hook for responsive typography classes
export function useResponsiveTypography() {
  const { theme } = useMaterialYouTheme();
  
  const getTypographyClass = (baseClass: string) => {
    const sizeModifier = theme.typographySize === 'large' ? 'lg' : 
                        theme.typographySize === 'small' ? 'sm' : '';
    
    return sizeModifier ? `${baseClass}-${sizeModifier}` : baseClass;
  };

  return { getTypographyClass, theme };
}

// Hook for device-aware spacing
export function useDeviceSpacing() {
  const { theme } = useMaterialYouTheme();
  
  const spacing = {
    mobile: {
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    tablet: {
      xs: 'p-3',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
    },
    desktop: {
      xs: 'p-4',
      sm: 'p-6',
      md: 'p-8',
      lg: 'p-12',
      xl: 'p-16',
    },
  };

  return spacing[theme.deviceSize];
} 