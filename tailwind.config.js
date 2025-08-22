/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'maroon': {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d4d4',
          300: '#f4b4b4',
          400: '#ec8888',
          500: '#e05e5e',
          600: '#cb4040',
          700: '#a73030',
          800: '#8b2635',
          900: '#710100',
        },
        'cream': {
          50: '#fefefe',
          100: '#fdf2e0',
          200: '#fbeccc',
          300: '#f7dfa3',
          400: '#f3cc70',
          500: '#eeb444',
          600: '#dc9429',
          700: '#b8731f',
          800: '#965a1f',
          900: '#7a4a1f',
        }
      },
    },
  },
  plugins: [],
}