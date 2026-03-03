/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#04507f",
        secondary: "#B19567",
        grey: "#F3F3F3",
        text_grey: "#5F5F5F",
      },
    },
  },
  plugins: [],
};
