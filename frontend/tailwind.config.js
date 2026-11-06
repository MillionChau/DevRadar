/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563EB',
        'secondary-cyan': '#0284C7',
        'accent-danger': '#EF4444',
        'accent-warning': '#F59E0B',
        'accent-success': '#10B981',
        'border-default': 'rgb(var(--color-border) / <alpha-value>)',
        brand: {
          primary: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
          secondary: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
          accent: '#818CF8',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          card: 'rgb(var(--color-card) / <alpha-value>)',
          elevated: 'rgb(var(--color-elevated) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          muted: 'rgb(var(--color-muted) / <alpha-value>)',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0284C7',
        },
        text: {
          main: 'rgb(var(--color-text-main) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-text-subtle) / <alpha-value>)',
          primary: 'rgb(var(--color-text-main) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-muted) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-subtle) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'badge': '6px',
      }
    },
  },
  plugins: [],
}
