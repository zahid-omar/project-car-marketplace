/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Material You Color System Integration
        'md-sys': {
          'primary': 'var(--md-sys-color-primary)',
          'on-primary': 'var(--md-sys-color-on-primary)',
          'primary-container': 'var(--md-sys-color-primary-container)',
          'on-primary-container': 'var(--md-sys-color-on-primary-container)',
          
          'secondary': 'var(--md-sys-color-secondary)',
          'on-secondary': 'var(--md-sys-color-on-secondary)',
          'secondary-container': 'var(--md-sys-color-secondary-container)',
          'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
          
          'tertiary': 'var(--md-sys-color-tertiary)',
          'on-tertiary': 'var(--md-sys-color-on-tertiary)',
          'tertiary-container': 'var(--md-sys-color-tertiary-container)',
          'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
          
          'surface': 'var(--md-sys-color-surface)',
          'on-surface': 'var(--md-sys-color-on-surface)',
          'surface-variant': 'var(--md-sys-color-surface-variant)',
          'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
          
          'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
          'surface-container-low': 'var(--md-sys-color-surface-container-low)',
          'surface-container': 'var(--md-sys-color-surface-container)',
          'surface-container-high': 'var(--md-sys-color-surface-container-high)',
          'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
          
          'outline': 'var(--md-sys-color-outline)',
          'outline-variant': 'var(--md-sys-color-outline-variant)',
          
          'error': 'var(--md-sys-color-error)',
          'on-error': 'var(--md-sys-color-on-error)',
          'error-container': 'var(--md-sys-color-error-container)',
          'on-error-container': 'var(--md-sys-color-on-error-container)',
        },
        
        // Keep automotive colors as fallback/legacy support
        'automotive-blue': '#3182ce', 
        automotive: {
          primary: '#1a365d',
          secondary: '#2d3748',
          accent: '#3182ce',
          highlight: '#ed8936',
          danger: '#e53e3e',
          success: '#38a169',
          warning: '#d69e2e',
        },
        brand: {
          50: '#f7fafc',
          100: '#edf2f7',
          200: '#e2e8f0',
          300: '#cbd5e0',
          400: '#a0aec0',
          500: '#718096',
          600: '#4a5568',
          700: '#2d3748',
          800: '#1a202c',
          900: '#171923',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        // Material You Elevation Levels
        'md-elevation-0': 'var(--md-sys-elevation-level0)',
        'md-elevation-1': 'var(--md-sys-elevation-level1)',
        'md-elevation-2': 'var(--md-sys-elevation-level2)',
        'md-elevation-3': 'var(--md-sys-elevation-level3)',
        'md-elevation-4': 'var(--md-sys-elevation-level4)',
        'md-elevation-5': 'var(--md-sys-elevation-level5)',
        
        // Legacy card shadows (keep for compatibility)
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      fontSize: {
        // Material You Typography Scale
        'md-display-large': ['var(--md-sys-typescale-display-large-size)', {
          lineHeight: 'var(--md-sys-typescale-display-large-line-height)',
          fontWeight: 'var(--md-sys-typescale-display-large-weight)',
        }],
        'md-display-medium': ['var(--md-sys-typescale-display-medium-size)', {
          lineHeight: 'var(--md-sys-typescale-display-medium-line-height)',
          fontWeight: 'var(--md-sys-typescale-display-medium-weight)',
        }],
        'md-headline-large': ['var(--md-sys-typescale-headline-large-size)', {
          lineHeight: 'var(--md-sys-typescale-headline-large-line-height)',
          fontWeight: 'var(--md-sys-typescale-headline-large-weight)',
        }],
        'md-title-large': ['var(--md-sys-typescale-title-large-size)', {
          lineHeight: 'var(--md-sys-typescale-title-large-line-height)',
          fontWeight: 'var(--md-sys-typescale-title-large-weight)',
        }],
        'md-label-large': ['var(--md-sys-typescale-label-large-size)', {
          lineHeight: 'var(--md-sys-typescale-label-large-line-height)',
          fontWeight: 'var(--md-sys-typescale-label-large-weight)',
        }],
        'md-body-medium': ['var(--md-sys-typescale-body-medium-size)', {
          lineHeight: 'var(--md-sys-typescale-body-medium-line-height)',
          fontWeight: 'var(--md-sys-typescale-body-medium-weight)',
        }],
      },
      transitionTimingFunction: {
        // Material You Motion Curves
        'md-standard': 'var(--md-sys-motion-easing-standard)',
        'md-emphasized': 'var(--md-sys-motion-easing-emphasized)',
      },
      transitionDuration: {
        // Material You Motion Durations
        'md-short1': 'var(--md-sys-motion-duration-short1)',
        'md-short2': 'var(--md-sys-motion-duration-short2)',
        'md-short3': 'var(--md-sys-motion-duration-short3)',
        'md-short4': 'var(--md-sys-motion-duration-short4)',
        'md-medium1': 'var(--md-sys-motion-duration-medium1)',
        'md-medium2': 'var(--md-sys-motion-duration-medium2)',
        'md-medium3': 'var(--md-sys-motion-duration-medium3)',
        'md-medium4': 'var(--md-sys-motion-duration-medium4)',
        'md-long1': 'var(--md-sys-motion-duration-long1)',
        'md-long2': 'var(--md-sys-motion-duration-long2)',
        'md-long3': 'var(--md-sys-motion-duration-long3)',
        'md-long4': 'var(--md-sys-motion-duration-long4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 