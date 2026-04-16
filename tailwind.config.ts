import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        switchThumbOff: "hsl(var(--switch-thumb-off))",
        switchThumbOn: "hsl(var(--switch-thumb-on))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "semantic-info": {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
        },
        "semantic-success": {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
        "semantic-warning": {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
        },
        "semantic-error": {
          DEFAULT: "var(--color-error)",
          bg: "var(--color-error-bg)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        brand: {
          primary: '#C05B2E',
          hover: '#A34D24',
          secondary: '#2D5016',
          'secondary-light': '#4A7C35',
          burgundy: '#8B1A1A',
          'burgundy-light': '#F5E6E6',
        },
        surface: {
          page: '#F5F0E8',
          card: '#FEFCF8',
          elevated: '#FFFFFF',
          overlay: 'rgba(28,28,26,0.6)',
        },
        text: {
          primary: '#1C1C1A',
          secondary: '#6B6560',
          muted: '#9E9890',
          inverse: '#FEFCF8',
        },
        'border-custom': {
          default: 'rgba(28,28,26,0.1)',
          strong: 'rgba(28,28,26,0.2)',
          focus: '#C05B2E',
        },
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.015em' }],
        'h2': ['1.75rem', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'label': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        "150": "150ms",
        "280": "280ms",
        "350": "350ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "1200": "1200ms",
        "2000": "2000ms",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      fontFamily: {
        sans: ["IBM Plex Arabic", "IBM Plex Sans", "system-ui", "sans-serif"],
        serif: ["IBM Plex Arabic", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "marquee-rtl": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(50%)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        "marquee-rtl": "marquee-rtl 30s linear infinite",
        "ken-burns": "ken-burns 8s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwindcss-rtl")],
} satisfies Config;
