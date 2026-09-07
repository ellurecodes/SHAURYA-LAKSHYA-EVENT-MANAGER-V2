/** @type {import('tailwindcss').Config} */
export default {
  // In Tailwind v4, you usually don't need 'content' as it is auto-detected,
  // but you can keep it if you want to be explicit.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#3b82f6',
      }
    },
  },
  plugins: [],
}