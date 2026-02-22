/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        cyan: {
          200: '#a5f3fc',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        violet: {
          500: '#8b5cf6',
        },
        fuchsia: {
          500: '#d946ef',
        },
      },
    },
  },
  plugins: [],
};
