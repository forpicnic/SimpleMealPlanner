/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: "hsl(222.2, 47.4%, 11.2%)",
            foreground: "hsl(210, 40%, 98%)",
          },
          popover: {
            DEFAULT: "hsl(0 0% 100%)",
            foreground: "hsl(222.2 47.4% 11.2%)",
          },
          muted: {
            DEFAULT: "hsl(210 40% 96.1%)",
            foreground: "hsl(215.4 16.3% 46.9%)",
          },
          background: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
          // Add other color definitions here
        },
      },
    },
    plugins: [],
  }