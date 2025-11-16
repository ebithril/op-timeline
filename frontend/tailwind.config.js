export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'one-piece': {
          // Main brand colors inspired by One Piece
          'primary': '#D70000',        // Rosso Corsa red (Luffy's vest)
          'secondary': '#FFCE00',      // Tangerine yellow (treasure/gold)
          'ocean': '#2E63A4',          // Lapis Lazuli blue (ocean/sky)
          'ocean-light': '#60BFF5',    // Maya blue (lighter ocean)

          // Old map/parchment backgrounds
          'parchment-light': '#F1E9D2',  // Light aged paper
          'parchment': '#F2DCA7',        // Medium champagne parchment
          'parchment-medium': '#D1BE9D', // Dark vanilla (for cards)
          'parchment-dark': '#B9A37E',   // Pale taupe (borders)

          // Accent colors
          'wood': '#AF6528',             // Dirty brown (ship wood)
          'ink': '#3B727C',              // Ming teal (map borders/ink)
          'treasure': '#64513B',         // Quincy brown (treasure chest)
          'dark': '#2C1810',             // Very dark brown (text on parchment)
        },
      },
    },
  },
  plugins: [],
}
