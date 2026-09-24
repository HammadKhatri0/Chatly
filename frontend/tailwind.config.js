/** @type {import('tailwindcss').Config} */

/** Neutrals and surfaces resolve through CSS variables so one `dark` class flips the whole theme. */
const themed = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
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
        // Neutral ramp: 50 is the page background, 900 the strongest text.
        ink: {
          50: themed('--ink-50'),
          100: themed('--ink-100'),
          400: themed('--ink-400'),
          600: themed('--ink-600'),
          800: themed('--ink-800'),
          900: themed('--ink-900'),
        },
        // Raised surfaces (cards, sidebar, bubbles) sit above the page background.
        panel: themed('--panel'),
      },
      boxShadow: {
        card: '0 10px 30px -12px rgb(var(--shadow) / 0.45)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in 0.18s ease-out' },
    },
  },
  plugins: [],
};
