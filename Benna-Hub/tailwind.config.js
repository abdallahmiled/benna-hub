/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'benna-gold': '#C5A059',
        'benna-dark': '#1A1A1A',
      },
    },
  },
  plugins: [],
  animation: {
  'spin-slow': 'spin 10s linear infinite',
},
}