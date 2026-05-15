import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#667085",
        line: "#E6EAF2",
        studio: {
          50: "#F5F7FF",
          100: "#EAF0FF",
          500: "#4F6BFF",
          600: "#3C54E8",
          700: "#2739B7"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.10)",
        card: "0 14px 40px rgba(30, 41, 59, 0.08)"
      },
      backgroundImage: {
        "studio-glow":
          "radial-gradient(circle at 18% 8%, rgba(79,107,255,0.16), transparent 28%), radial-gradient(circle at 86% 0%, rgba(153,86,255,0.14), transparent 26%), linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 42%, #F6F8FC 100%)",
        "button-gradient": "linear-gradient(135deg, #4F6BFF 0%, #8B5CF6 100%)"
      }
    }
  },
  plugins: []
};

export default config;
