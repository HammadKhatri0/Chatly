/** @type {import('tailwindcss').Config} */

/** Neutrals and surfaces resolve through CSS variables so one `dark` class flips the whole theme. */
const themed = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
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
        // Second hue in every gradient — keeps the purple from reading as one flat wash.
        accent: {
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
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
        // One step brighter than `panel`, for controls that sit on top of a card.
        raised: themed('--raised'),
        line: themed('--line'),
      },
      boxShadow: {
        card: '0 10px 30px -12px rgb(var(--shadow) / 0.45)',
        // Layered shadows read as real elevation; a single blur reads as a smudge.
        soft: '0 1px 2px rgb(var(--shadow) / 0.06), 0 4px 12px -4px rgb(var(--shadow) / 0.10)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.06), 0 16px 32px -12px rgb(var(--shadow) / 0.28)',
        float: '0 8px 16px -8px rgb(var(--shadow) / 0.20), 0 28px 56px -20px rgb(var(--shadow) / 0.35)',
        glow: '0 8px 24px -8px rgb(117 81 251 / 0.55)',
        'glow-lg': '0 12px 40px -10px rgb(117 81 251 / 0.65)',
        // Faint top highlight, the trick that makes a dark surface look lit.
        bevel: 'inset 0 1px 0 0 rgb(255 255 255 / 0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8b6bff 0%, #6435f0 50%, #4722ab 100%)',
        'brand-sheen': 'linear-gradient(120deg, transparent 20%, rgb(255 255 255 / 0.35) 50%, transparent 80%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: 0.7 },
          '70%, 100%': { transform: 'scale(1.9)', opacity: 0 },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(3%, -4%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%, 3%, 0) scale(0.96)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        drift: 'drift 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
