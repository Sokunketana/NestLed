/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17201d',
        cream: '#f7f5ef',
        pine: '#174c3c',
        sage: '#dce7df',
        coral: '#e9785d',
      },
      boxShadow: { soft: '0 14px 40px rgba(30, 48, 41, 0.08)' },
    },
  },
  plugins: [],
}
