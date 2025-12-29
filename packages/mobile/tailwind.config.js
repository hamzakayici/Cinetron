/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000', // True Black
        surface: '#0a0a0a',   // Cinematic Surface
        primary: {
          DEFAULT: '#8b5cf6', // Neon Violet
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        netflix: {
          red: '#E50914',
          black: '#141414'
        }
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        bold: ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
