/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f17',
        surface: '#1a1a2e',
        'surface-2': '#16213e',
        border: '#2e2e4e',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b8',
        accent: '#f97316',
        'accent-hover': '#ea6c0a',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}