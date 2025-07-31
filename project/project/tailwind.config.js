/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF7F5',
          100: '#FFEDE8',
          200: '#FFDBD1',
          300: '#FFC3B3',
          400: '#FF9B85',
          500: '#FF724C',
          600: '#E55A34',
          700: '#CC4A26',
          800: '#B33D1C',
          900: '#993315',
        },
        accent: {
          50: '#FFFCF5',
          100: '#FFF8E8',
          200: '#FFF0D1',
          300: '#FFE3B3',
          400: '#FFCF85',
          500: '#FDBF50',
          600: '#E5A838',
          700: '#CC9426',
          800: '#B3801C',
          900: '#996D15',
        },
        dark: {
          50: '#F4F4F8',
          100: '#E8E9F0',
          200: '#D1D3E1',
          300: '#A5A9C7',
          400: '#7A80AD',
          500: '#2A2C41',
          600: '#25273A',
          700: '#202233',
        }
      },
      fontFamily: {
        'inter': ['Inter'],
      }
    },
  },
  plugins: [],
}