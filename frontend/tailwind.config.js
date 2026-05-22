/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All semantic colors use CSS variables so they switch with theme
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          dim: 'var(--color-text-dim)',
        },
        // Accent colors stay fixed
        cyan: {
          DEFAULT: '#06B6D4',
          muted: 'rgba(6,182,212,0.12)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          muted: 'rgba(139,92,246,0.12)',
        },
        accent: {
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          violet: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(6,182,212,0.12), 0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(6,182,212,0.15)',
      },
    },
  },
  plugins: [],
}
