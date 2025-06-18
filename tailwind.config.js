/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        neon: {
          green: '#00ff41',
          blue: '#0099ff',
          purple: '#9933ff',
        },
        dark: {
          100: '#1a1a1a',
          200: '#2a2a2a',
          300: '#3a3a3a',
          400: '#4a4a4a',
          500: '#5a5a5a',
        },
      },
      fontFamily: {
        'chillax': ['Chillax-Regular'],
        'chillax-light': ['Chillax-Light'],
        'chillax-extralight': ['Chillax-Extralight'],
        'chillax-medium': ['Chillax-Medium'],
        'chillax-semibold': ['Chillax-Semibold'],
        'chillax-bold': ['Chillax-Bold'],
      },
    },
  },
  plugins: [],
}