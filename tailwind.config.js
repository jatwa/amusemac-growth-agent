/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#fbd872',
          500: '#f5b82e',
          600: '#d49b19'
        }
      }
    },
  },
  plugins: [],
}
