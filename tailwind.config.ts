import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          darkest: "#050609",
          dark: "#0a0d16",
          surface: "#101626",
          card: "#151c31",
          border: "#202b44",
          "border-bright": "#33456c",
          red: "#ff204e",
          "red-hover": "#ff436b",
          cyan: "#00f0ff",
          "cyan-hover": "#33f3ff",
          gold: "#f59e0b",
          "gold-hover": "#fbbf24",
          purple: "#8b5cf6",
          green: "#10b981",
          muted: "#8493b0",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "Courier New", "monospace"],
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-red": "0 0 15px rgba(255, 32, 78, 0.5), 0 0 30px rgba(255, 32, 78, 0.2)",
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.5), 0 0 30px rgba(0, 240, 255, 0.2)",
        "neon-gold": "0 0 15px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.2)",
        "neon-purple": "0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.2)",
        "cyber-card": "0 10px 30px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "cyber-dots": "radial-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 0)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 12px rgba(255, 32, 78, 0.6))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 4px rgba(255, 32, 78, 0.3))" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

