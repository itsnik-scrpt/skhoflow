/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red:    '#c0392b',
          gold:   '#c9962a',
          orange: '#d4621a',
        },
      },
      fontFamily: {
        sans:    ['"Nunito"', 'system-ui', 'sans-serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-up':  'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':  'fadeIn 0.5s ease both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity:'0', transform:'translateY(24px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn:  { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        scaleIn: { '0%': { opacity:'0', transform:'scale(0.95)' }, '100%': { opacity:'1', transform:'scale(1)' } },
      },
      boxShadow: {
        'glass':     '0 4px 24px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-dark':'0 4px 24px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card':      '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',
        'card-dark': '0 2px 8px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        'red-glow':  '0 0 40px -8px rgba(192,57,43,0.4)',
        'gold-glow': '0 0 40px -8px rgba(201,150,42,0.35)',
      },
    },
  },
  plugins: [],
};
