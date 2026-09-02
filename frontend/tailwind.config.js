/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c2a28',
        'ink-soft': '#6d7974',
        cream: '#f5f2eb',
        surface: '#fffdf9',
        line: '#e5dfd4',
        deep: '#123f38',
        pine: '#145247',
        sage: '#dcebe3',
        mint: '#edf6f1',
        coral: '#d96f55',
        gold: '#d8a52b',
      },
      boxShadow: {
        soft: '0 12px 34px rgba(31, 49, 43, 0.07)',
        card: '0 2px 0 rgba(31, 49, 43, 0.03), 0 12px 28px rgba(31, 49, 43, 0.055)',
      },
    },
  },
  plugins: [],
}
