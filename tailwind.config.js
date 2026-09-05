/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light Field Mode Palette
        field: {
          base: '#FBF8F1',
          card: '#F3EEE1',
          surface: '#F3EEE1',
          cardAlt: '#EAE3D2',
          border: '#DCD3BF',
          text: '#1A1A1A',
          textMuted: '#5A5243',
        },
        // Deep Forest Green Accent (Success, Primary Actions)
        brand: {
          50: '#edf7f0',
          100: '#d6eddc',
          200: '#b0dec0',
          300: '#7ec69d',
          400: '#4da878',
          500: '#2c8b58',
          600: '#1F5D3B', // Primary accent
          700: '#194a30',
          800: '#153c28',
          900: '#123222',
          950: '#0a1d13',
        },
        // Earthy Terracotta/Amber (Secondary Accent, Warnings)
        earth: {
          50: '#fdf8f4',
          100: '#f9ece3',
          200: '#f3d6c4',
          300: '#e9b699',
          400: '#db8e68',
          500: '#C2703D', // Secondary accent
          600: '#a8572e',
          700: '#874325',
          800: '#6f3822',
          900: '#5c301e',
          950: '#381c10',
        },
        // High-Contrast Red Danger Scale
        danger: {
          50: '#FDECEA',
          100: '#fbd2ce',
          200: '#f7a9a1',
          300: '#f07468',
          400: '#e54536',
          500: '#d93829',
          600: '#B3261E', // High-contrast danger
          700: '#8f1e17',
          800: '#751812',
          900: '#641410',
          950: '#3b0906',
        },
        silage: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
          700: '#a16207',
          800: '#854d0e',
        },
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
};
