/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f0ff',
          100: '#e7e3ff',
          200: '#d2caff',
          300: '#b3a5ff',
          400: '#9277ff',
          500: '#7551fb',
          600: '#6435f0',
          700: '#5527d3',
          800: '#4722ab',
          900: '#3c218a',
        },
        ink: {
          50: '#f6f7fb',
          100: '#eceef6',
          400: '#8b90a7',
          600: '#4f546b',
          800: '#252a3d',
          900: '#171a29',
        },
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(43, 25, 119, 0.18)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 0.18s ease-out' },
    },
  },
  plugins: [],
};
