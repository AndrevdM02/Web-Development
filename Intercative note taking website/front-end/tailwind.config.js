/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    theme: {
      extends: {
           keyframes: {
            "fade-left": {
              "0%": {
                opacity: "0",
                transform: "translateX(2rem)"
              },
              "100%": {
                opacity: "1",
                transform: "translateX(0)"
              }
            }
          },
          animation: {
            "fade-left": "fade-left 0.2s ease"
          }
        }
    },
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}