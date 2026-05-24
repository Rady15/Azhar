/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        },
        mint: {
          50: '#f5fdf9',
          100: '#e6f9f0',
          200: '#c9f2dc',
          300: '#9ee6c4',
          400: '#6dd5a8',
          500: '#42bc8d',
          600: '#2f9a72',
          700: '#287b5d',
          800: '#24624c',
          900: '#1f513f',
        },
      },
      fontFamily: {
        sans:    ['Zain', 'system-ui', 'sans-serif'],
        arabic:  ['Zain', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
