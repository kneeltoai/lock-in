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
        primary: "#D63A24",
        background: "#F5F1EB",
        surface: "#ffffff",
        border: "#EDE8E0",
        complete: "#4A9B6F",
        minibg: "#1A1A2E",
      },
    },
  },
  plugins: [],
};
