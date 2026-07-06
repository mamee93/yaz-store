import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        oud: {
          brown: "rgb(var(--color-oud-brown) / <alpha-value>)",
          coffee: "rgb(var(--color-oud-coffee) / <alpha-value>)",
          gold: "rgb(var(--color-oud-gold) / <alpha-value>)",
          "gold-soft": "rgb(var(--color-oud-gold-soft) / <alpha-value>)",
          beige: "rgb(var(--color-oud-beige) / <alpha-value>)",
          sand: "rgb(var(--color-oud-sand) / <alpha-value>)",
          ivory: "rgb(var(--color-oud-ivory) / <alpha-value>)",
          pearl: "rgb(var(--color-oud-pearl) / <alpha-value>)",
          ink: "rgb(var(--color-oud-ink) / <alpha-value>)",
          muted: "rgb(var(--color-oud-muted) / <alpha-value>)",
          line: "rgb(var(--color-oud-line) / <alpha-value>)",
          danger: "rgb(var(--color-oud-danger) / <alpha-value>)",
          success: "rgb(var(--color-oud-success) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["var(--font-arabic-sans)", "Tahoma", "Arial", "sans-serif"],
        display: ["var(--font-arabic-display)", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        gold: "var(--shadow-gold)"
      },
      borderRadius: {
        oud: "0.5rem"
      }
    }
  },
  plugins: []
};

export default config;
