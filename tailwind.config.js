/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          background: '#19161a',
          backgroundLighter: '#28232a',
          accent: '#452451',
          secondary: '#8b6699',
          text: '#ded7e0',
          gray: '#e4e4e4',
          destructive: '#51242d',
          success: '#24512b',
          warning: '#51410c',
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