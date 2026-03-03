/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F0F11',
          card: '#1C1C1E',
          input: '#2C2C2E',
        },
        accent: {
          blue: '#2F80ED',
          green: '#27AE60',
          red: '#EB5757',
          orange: '#F2994A'
        }
      }
    },
  },
  plugins: [],
}