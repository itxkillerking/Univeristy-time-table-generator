export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a', // Blue 900 - Example university color
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f97316', // Orange 500 - Example contrast
          foreground: '#ffffff',
        },
        kng: {
          DEFAULT: '#0f172a', // Slate 900
          foreground: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
