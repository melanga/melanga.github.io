/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        apple: '-0.011em',
        'apple-tight': '-0.025em',
      },
      colors: {
        teal: {
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        cyan: {
          200: '#a5f3fc',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
      },
      borderRadius: {
        glass: '24px',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
};
