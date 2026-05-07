import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        foreground: "#f8fafc",
        muted: "#94a3b8",
        card: "#111827",
        border: "#1f2937",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444"
      }
    }
  },
  plugins: []
};

export default config;
