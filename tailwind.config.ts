import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["var(--font-pixel)", "'Press Start 2P'", "'Silkscreen'", "monospace"],
        sans: ["var(--font-sans)", "Inter", "'Noto Sans TC'", "sans-serif"],
      },
      colors: {
        slate: {
          150: "#e9edf3",
        },
      },
      boxShadow: {
        "arcade-card": "0 0 0 3px #0f172a, 0 0 0 6px #38bdf8, 0 10px 25px -5px rgba(0, 0, 0, 0.7)",
        "arcade-win": "0 0 0 3px #0f172a, 0 0 0 6px #f59e0b, 0 10px 25px -5px rgba(245, 158, 11, 0.4)",
        "arcade-loss": "0 0 0 3px #0f172a, 0 0 0 6px #f43f5e, 0 10px 25px -5px rgba(244, 63, 94, 0.4)",
        "saas-card": "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
