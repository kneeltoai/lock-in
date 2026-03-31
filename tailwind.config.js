/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        background: "#0a0a0a",
        surface: "#1a1a1a",
        border: "#2a2a2a",
      },
    },
  },
  plugins: [],
};
