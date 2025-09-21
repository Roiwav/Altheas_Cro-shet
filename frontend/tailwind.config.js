/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- IMPORTANT ito
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
     // eslint-disable-next-line no-undef
     require('tailwind-scrollbar-hide')
  ],
}
