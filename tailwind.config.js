/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.7)',
          'light-border': 'rgba(255, 255, 255, 0.3)',
          dark: 'rgba(28, 28, 30, 0.7)',
          'dark-border': 'rgba(255, 255, 255, 0.1)',
        }
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '12px',
        lg: '24px',
      }
    },
  },
  plugins: [],
}