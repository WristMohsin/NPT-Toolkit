/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0D12',
          900: '#0E1218',
          850: '#121722',
          800: '#161C29',
          700: '#1E2637',
          600: '#2A3448',
          500: '#3D495F',
          400: '#5C6B85',
          300: '#8792A8',
          200: '#B7BFCF',
          100: '#E4E8EF',
        },
        signal: {
          crit: '#E5484D',
          high: '#F2994A',
          med: '#E9B949',
          low: '#4C9AFF',
          info: '#8792A8',
          ok: '#3DD68C',
          accent: '#7B6EF6',
        },
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
      },
    },
  },
  plugins: [],
}

