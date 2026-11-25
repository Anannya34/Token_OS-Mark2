/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark Slate Grey Scale
        slate: {
          950: '#0B0F17', // Deep obsidian canvas
          900: '#121824', // Base panel surface
          850: '#1B2436', // Lifted container / elevated card
          800: '#232F44', // Overlay / interactive fill
          700: '#2A364F', // Structural border
          600: '#3A4B6B', // Muted highlight
          500: '#4D628A', // Muted text
          400: '#7E8B9B', // Metadata gray
          300: '#94A3B8', // Secondary copy
          100: '#F0F4F8', // Primary text
        },
        // Terracotta Flame Accent Scale (Primary #D97757)
        flame: {
          500: '#D97757', // Primary Accent (#D97757)
          400: '#E2896B', // Bright Accent / Hover
          300: '#EBA186', // Flame Glow
          600: '#C16142', // Deep Burn Accent
          700: '#9C4A30', // Dark Flame Border
          900: '#3D1B12', // Subtle Tint Fill
        },
        // Status Semantics
        semantic: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        sans: ['Mona Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Mona Sans Mono', 'monospace'],
      },
      boxShadow: {
        'flame-glow': '0 0 20px -3px rgba(217, 119, 87, 0.35)',
        'flame-glow-lg': '0 0 35px -2px rgba(217, 119, 87, 0.5)',
        'slate-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame-beam': 'flameBeam 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        flameBeam: {
          '0%, 100%': { opacity: '0.4', transform: 'scaleX(0.95)' },
          '50%': { opacity: '1', transform: 'scaleX(1.05)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
};
