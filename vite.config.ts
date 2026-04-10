import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
    ],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["altoha-logo.png"],
      manifest: {
        name: "Altoha - Culinary Community",
        short_name: "Altoha",
        description: "The premier culinary community platform for chefs, judges, and food enthusiasts",
        theme_color: "#8B4513",
        background_color: "#FFF8F0",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        id: "/",
        dir: "ltr" as const,
        lang: "en",
        prefer_related_applications: false,
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/og-image.png",
            sizes: "1200x630",
            type: "image/png",
            form_factor: "wide",
            label: "Altoha homepage — culinary competitions and community",
          },
        ],
        shortcuts: [
          {
            name: "Competitions",
            short_name: "Compete",
            description: "Browse culinary competitions",
            url: "/competitions",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Community",
            short_name: "Community",
            description: "Join the culinary community",
            url: "/community",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Dashboard",
            short_name: "My Space",
            description: "Your personal dashboard",
            url: "/dashboard",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Exhibitions",
            short_name: "Events",
            description: "Explore food events and exhibitions",
            url: "/exhibitions",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
        categories: ["food", "social", "education", "lifestyle"],
        edge_side_panel: {
          preferred_width: 400,
        },
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300,
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|svg|gif|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(woff|woff2|ttf|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache tracking library scripts (gtag, fbevents, etc.)
            urlPattern: /^https:\/\/(www\.googletagmanager\.com|connect\.facebook\.net|analytics\.tiktok\.com|sc-static\.net|snap\.licdn\.com|static\.hotjar\.com)\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "tracking-scripts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache CSS/JS assets with long expiry
            urlPattern: /\.(css|js)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: "lightningcss",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    modulePreload: {
      polyfill: true,
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.debug", "console.info"],
        passes: 2,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        manualChunks(id) {
          // ── Vendor: React core ──
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // ── Vendor: Supabase ──
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
          // ── Vendor: React Query ──
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "vendor-query";
          }
          // ── Vendor: Lucide icons ──
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // ── Vendor: All Radix UI + cmdk (shared primitives prevent splitting) ──
          if (id.includes("@radix-ui/") || id.includes("node_modules/cmdk")) {
            return "vendor-ui";
          }
          // ── Vendor: Charts (admin/analytics only) ──
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // ── Vendor: Forms ──
          if (id.includes("node_modules/react-hook-form") || id.includes("node_modules/@hookform/") || id.includes("node_modules/zod")) {
            return "vendor-form";
          }
          // ── Vendor: Utilities (CSS-in-JS helpers) ──
          if (id.includes("node_modules/class-variance-authority") || id.includes("node_modules/clsx") || id.includes("node_modules/tailwind-merge")) {
            return "vendor-css-utils";
          }
          // ── Vendor: Theme/toast ──
          if (id.includes("node_modules/next-themes") || id.includes("node_modules/sonner")) {
            return "vendor-ui-misc";
          }
          // ── Heavy vendors: lazy-only ──
          if (id.includes("node_modules/recharts")) return "vendor-charts";
          if (id.includes("node_modules/react-markdown")) return "vendor-markdown";
          if (id.includes("node_modules/date-fns")) return "vendor-dates";
          if (id.includes("node_modules/qrcode.react")) return "vendor-qr";
          if (id.includes("node_modules/pdfjs-dist")) return "vendor-pdf";
          if (id.includes("node_modules/mammoth")) return "vendor-docparse";
          if (id.includes("node_modules/html2canvas")) return "vendor-canvas";
          if (id.includes("node_modules/@dnd-kit")) return "vendor-dnd";
          if (id.includes("node_modules/embla-carousel")) return "vendor-embla";
          if (id.includes("node_modules/react-resizable-panels")) return "vendor-panels";
          if (id.includes("node_modules/react-day-picker")) return "vendor-datepicker";
          // cmdk is already in vendor-ui-core above
          if (id.includes("node_modules/vaul")) return "vendor-drawer";
          if (id.includes("node_modules/input-otp")) return "vendor-otp";
          if (id.includes("node_modules/dompurify")) return "vendor-sanitize";
        },
      },
    },
  },
}));
