/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6fa',
          100: '#e9edf5',
          200: '#c8d2e5',
          300: '#a7b8d6',
          400: '#6483b7',
          500: '#224f99',
          600: '#1f478a',
          700: '#1a3b73',
          800: '#152f5c',
          900: '#0b1f4b',
        },
        saffron: {
          50: '#fffcf5',
          100: '#fffaeb',
          200: '#fff0cc',
          300: '#ffe5ad',
          400: '#ffd070',
          500: '#ffbc33',
          600: '#e6a92e',
          700: '#bfa024',
          800: '#99801c',
          900: '#FF671F',
        },
        green: {
          50: '#f6fbf8',
          100: '#edf6f2',
          200: '#d2ede4',
          300: '#b7e4d7',
          400: '#81d1bd',
          500: '#4cbd9e',
          600: '#45ab8e',
          700: '#3a8e76',
          800: '#2e725e',
          900: '#138A36',
        }
      }
    },
  },
  plugins: [],
}
