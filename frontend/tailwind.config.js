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
        brand: {
          primary: '#2563EB',
          hover: '#1D4ED8',
          light: '#3B82F6',
          secondary: '#38BDF8',
          accent: '#818CF8',
        },
        surface: {
          bg: '#090D16',
          card: '#0F172A',
          elevated: '#1E293B',
          border: '#334155',
          muted: '#475569',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#0284C7',
        },
        text: {
          main: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#64748B',
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
