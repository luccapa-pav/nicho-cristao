import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── Paleta "Luz Divina" ──────────────────────────
        divine: {
          50:  "#fffdf5",
          100: "#fffaeb",
          200: "#fff3c4",
          300: "#ffe68a",
          400: "#ffd04d",
          500: "#ffbb1a",   // dourado principal
          600: "#f0a000",
          700: "#c07d00",
          800: "#8a5a00",
          900: "#5c3c00",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F0D060",
          dark: "#A08020",
        },
        heaven: {
          DEFAULT: "#F0F8FF",   // azul-céu muito claro
          soft:    "#E8F4FD",
          glow:    "#D6ECFC",
        },
        // Sistema de UI
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans:  ["var(--font-lora)", "Georgia", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        divine:    "0 1px 3px rgba(0,0,0,0.04), 0 16px 48px rgba(212,175,55,0.10)",
        "divine-lg": "0 0 60px rgba(212, 175, 55, 0.2), 0 8px 40px rgba(0,0,0,0.08)",
        card:      "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(212,175,55,0.06)",
        glow:      "0 0 20px rgba(212, 175, 55, 0.4)",
      },
      backgroundImage: {
        "divine-radial":
          "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)",
        "divine-card":
          "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,251,235,0.9) 100%)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)",
        "heaven-gradient":
          "linear-gradient(180deg, #FFFDF5 0%, #F0F8FF 50%, #FFFDF5 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-scale": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(212,175,55,0.3)" },
          "50%":      { boxShadow: "0 0 28px rgba(212,175,55,0.7)" },
        },
        "light-burst": {
          "0%":   { opacity: "0", transform: "scale(0.5)" },
          "60%":  { opacity: "1", transform: "scale(1.2)" },
          "100%": { opacity: "0", transform: "scale(1.8)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "flame": {
          "0%, 100%": { transform: "scaleY(1) rotate(-2deg)" },
          "25%":      { transform: "scaleY(1.05) rotate(2deg)" },
          "75%":      { transform: "scaleY(0.95) rotate(-1deg)" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.5s ease-out forwards",
        "fade-in-scale": "fade-in-scale 0.4s ease-out forwards",
        shimmer:         "shimmer 2.5s linear infinite",
        "pulse-gold":    "pulse-gold 2s ease-in-out infinite",
        "light-burst":   "light-burst 0.6s ease-out forwards",
        float:           "float 3s ease-in-out infinite",
        flame:           "flame 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
