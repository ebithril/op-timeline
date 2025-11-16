export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'one-piece': {
          // Official One Piece Series Color Palette (SchemeColor.com)
          'red': '#D70000',           // Rosso Corsa - primary accent
          'yellow': '#FFCE00',        // Tangerine Yellow - highlights
          'blue': '#2E63A4',          // Lapis Lazuli - primary brand
          'blue-light': '#60BFF5',    // Maya Blue - accents
          'brown': '#AF6528',         // Dirty Brown - secondary
          'black': '#000000',         // Black - text
        },
      },
    },
  },
  plugins: [],
}
