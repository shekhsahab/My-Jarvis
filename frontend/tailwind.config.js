/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jarvis: {
          900: '#050b16',
          800: '#0c1727',
          700: '#12253f',
          500: '#7aa7ff',
          300: '#dfeeff',
        },
      },
      boxShadow: {
        panel: '0 20px 60px rgba(8, 15, 27, 0.7)',
      },
    },
  },
  plugins: [],
};
