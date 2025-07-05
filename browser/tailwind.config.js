/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'card': {
          'red': '#dc2626',
          'black': '#1f2937',
          'back': '#1e40af',
          'selected': '#fbbf24'
        },
        'table': {
          'green': '#059669',
          'felt': '#065f46'
        }
      },
      fontFamily: {
        'card': ['Monaco', 'Consolas', 'monospace']
      },
      animation: {
        'card-deal': 'cardDeal 0.5s ease-out',
        'card-play': 'cardPlay 0.3s ease-in-out',
        'thinking': 'pulse 1.5s infinite'
      },
      keyframes: {
        cardDeal: {
          '0%': { transform: 'translateY(-100px) rotate(180deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' }
        },
        cardPlay: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)' }
        }
      }
    },
  },
  plugins: [],
}