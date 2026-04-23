/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        primary: "#0052FF",
        "primary-light": "#E8EEFF",
        danger: "#EF4444",
        warning: "#F59E0B",
        safe: "#10B981",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
        "text-tertiary": "#9CA3AF",
      },
    },
  },
  plugins: [],
};
