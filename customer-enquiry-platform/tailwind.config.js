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
        background: '#FEFEFA',
        surface: '#85B09A',
        'surface-2': '#ACE1AF',
        border: '#52796f',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b8',
        accent: '#2f3e46',
        'accent-hover': '#ea6c0a',
        success: '#032c12ff',
        error: '#ef4444',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
}