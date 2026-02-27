// Shared theme preset definitions used by both admin panel and runtime application
// Designed specifically for the hospitality, culinary & hotel industry
// Each preset: 2 primary tones + 5 coordinated secondary/accent/surface tones

export const THEME_PRESETS = [
  {
    id: "gold",
    nameEn: "Maison Dorée",
    nameAr: "البيت الذهبي",
    descEn: "Warm gold & deep espresso — luxury hotel elegance with culinary warmth",
    descAr: "ذهبي دافئ وبني إسبريسو — أناقة الفنادق الفاخرة مع دفء المطابخ",
    light: {
      // Primary 1: Rich Champagne Gold
      "--primary": "40 72% 50%",
      "--primary-foreground": "40 20% 99%",
      // Primary 2: Deep Espresso Brown
      "--accent": "25 55% 22%",
      "--accent-foreground": "40 20% 97%",
      // Secondary 1: Warm Linen
      "--background": "42 35% 97%",
      "--foreground": "25 45% 8%",
      // Secondary 2: Cream Parchment
      "--card": "40 30% 95%",
      "--card-foreground": "25 45% 8%",
      // Secondary 3: Soft Wheat
      "--secondary": "38 22% 91%",
      "--secondary-foreground": "25 35% 14%",
      // Secondary 4: Warm Stone
      "--muted": "36 14% 92%",
      "--muted-foreground": "25 18% 42%",
      // Secondary 5: Antique Bisque border
      "--border": "38 20% 83%",
      "--input": "38 20% 83%",
      "--ring": "40 72% 50%",
    },
    dark: {
      "--primary": "40 75% 56%",
      "--primary-foreground": "25 35% 4%",
      "--accent": "30 50% 38%",
      "--accent-foreground": "25 20% 96%",
      "--background": "22 30% 6%",
      "--foreground": "40 18% 93%",
      "--card": "24 26% 10%",
      "--card-foreground": "40 18% 93%",
      "--secondary": "24 20% 14%",
      "--secondary-foreground": "40 16% 90%",
      "--muted": "24 16% 12%",
      "--muted-foreground": "36 14% 52%",
      "--border": "24 18% 17%",
      "--input": "24 18% 17%",
      "--ring": "40 75% 56%",
    },
    preview: [
      "hsl(40,72%,50%)",   // Champagne Gold
      "hsl(25,55%,22%)",   // Espresso
      "hsl(42,35%,97%)",   // Linen
      "hsl(38,22%,91%)",   // Wheat
      "hsl(36,14%,92%)",   // Stone
    ],
  },
  {
    id: "bistro",
    nameEn: "Le Bistro",
    nameAr: "البيسترو",
    descEn: "Burgundy wine & warm copper — classic French kitchen sophistication",
    descAr: "نبيذ بورجوندي ونحاسي دافئ — رقي المطبخ الفرنسي الكلاسيكي",
    light: {
      // Primary 1: Rich Burgundy
      "--primary": "350 58% 38%",
      "--primary-foreground": "350 15% 98%",
      // Primary 2: Aged Copper
      "--accent": "18 52% 34%",
      "--accent-foreground": "18 15% 97%",
      // Secondary 1: Soft Ecru
      "--background": "30 28% 97%",
      "--foreground": "350 30% 10%",
      // Secondary 2: Warm Ivory
      "--card": "28 24% 95%",
      "--card-foreground": "350 30% 10%",
      // Secondary 3: Blush Linen
      "--secondary": "350 14% 92%",
      "--secondary-foreground": "350 25% 15%",
      // Secondary 4: Dusty Rose surface
      "--muted": "348 10% 93%",
      "--muted-foreground": "350 12% 42%",
      // Secondary 5: Warm Mauve border
      "--border": "348 14% 84%",
      "--input": "348 14% 84%",
      "--ring": "350 58% 38%",
    },
    dark: {
      "--primary": "350 52% 52%",
      "--primary-foreground": "350 20% 4%",
      "--accent": "18 45% 44%",
      "--accent-foreground": "18 15% 96%",
      "--background": "350 22% 6%",
      "--foreground": "30 16% 93%",
      "--card": "348 20% 10%",
      "--card-foreground": "30 16% 93%",
      "--secondary": "350 16% 14%",
      "--secondary-foreground": "30 14% 90%",
      "--muted": "350 14% 12%",
      "--muted-foreground": "348 12% 50%",
      "--border": "350 14% 17%",
      "--input": "350 14% 17%",
      "--ring": "350 52% 52%",
    },
    preview: [
      "hsl(350,58%,38%)", // Burgundy
      "hsl(18,52%,34%)",  // Copper
      "hsl(30,28%,97%)",  // Ecru
      "hsl(350,14%,92%)", // Blush
      "hsl(348,10%,93%)", // Dusty Rose
    ],
  },
  {
    id: "terroir",
    nameEn: "Terroir",
    nameAr: "تيروار",
    descEn: "Olive grove & terracotta — Mediterranean farm-to-table warmth",
    descAr: "أخضر زيتوني وطيني — دفء البحر المتوسط من المزرعة للمائدة",
    light: {
      // Primary 1: Deep Olive
      "--primary": "90 38% 32%",
      "--primary-foreground": "90 15% 98%",
      // Primary 2: Warm Terracotta
      "--accent": "16 48% 40%",
      "--accent-foreground": "16 15% 97%",
      // Secondary 1: Natural Parchment
      "--background": "45 25% 97%",
      "--foreground": "90 25% 10%",
      // Secondary 2: Sandy Cream
      "--card": "42 22% 95%",
      "--card-foreground": "90 25% 10%",
      // Secondary 3: Sage Mist
      "--secondary": "100 12% 91%",
      "--secondary-foreground": "90 20% 15%",
      // Secondary 4: Dried Herb
      "--muted": "80 8% 92%",
      "--muted-foreground": "90 10% 42%",
      // Secondary 5: Clay border
      "--border": "40 16% 83%",
      "--input": "40 16% 83%",
      "--ring": "90 38% 32%",
    },
    dark: {
      "--primary": "90 35% 48%",
      "--primary-foreground": "90 20% 4%",
      "--accent": "16 42% 48%",
      "--accent-foreground": "16 15% 96%",
      "--background": "80 20% 6%",
      "--foreground": "45 16% 93%",
      "--card": "80 18% 10%",
      "--card-foreground": "45 16% 93%",
      "--secondary": "80 14% 14%",
      "--secondary-foreground": "45 14% 90%",
      "--muted": "80 12% 12%",
      "--muted-foreground": "80 10% 50%",
      "--border": "80 14% 17%",
      "--input": "80 14% 17%",
      "--ring": "90 35% 48%",
    },
    preview: [
      "hsl(90,38%,32%)",  // Olive
      "hsl(16,48%,40%)",  // Terracotta
      "hsl(45,25%,97%)",  // Parchment
      "hsl(100,12%,91%)", // Sage
      "hsl(80,8%,92%)",   // Herb
    ],
  },
  {
    id: "riviera",
    nameEn: "Riviera",
    nameAr: "الريفييرا",
    descEn: "Aegean teal & sandy pearl — coastal resort luxury and freshness",
    descAr: "أزرق بحري ولؤلؤي رملي — فخامة المنتجعات الساحلية",
    light: {
      // Primary 1: Deep Teal
      "--primary": "186 52% 36%",
      "--primary-foreground": "186 15% 98%",
      // Primary 2: Nautical Navy
      "--accent": "210 42% 28%",
      "--accent-foreground": "210 15% 97%",
      // Secondary 1: Pearl White
      "--background": "195 22% 97%",
      "--foreground": "210 35% 10%",
      // Secondary 2: Sea Foam
      "--card": "192 18% 95%",
      "--card-foreground": "210 35% 10%",
      // Secondary 3: Mist Blue
      "--secondary": "195 14% 91%",
      "--secondary-foreground": "210 28% 15%",
      // Secondary 4: Driftwood
      "--muted": "190 8% 92%",
      "--muted-foreground": "200 12% 42%",
      // Secondary 5: Shore Sand border
      "--border": "195 14% 84%",
      "--input": "195 14% 84%",
      "--ring": "186 52% 36%",
    },
    dark: {
      "--primary": "186 48% 48%",
      "--primary-foreground": "210 25% 4%",
      "--accent": "210 38% 40%",
      "--accent-foreground": "210 15% 96%",
      "--background": "210 25% 6%",
      "--foreground": "195 14% 93%",
      "--card": "210 22% 10%",
      "--card-foreground": "195 14% 93%",
      "--secondary": "210 18% 14%",
      "--secondary-foreground": "195 12% 90%",
      "--muted": "210 16% 12%",
      "--muted-foreground": "195 10% 50%",
      "--border": "210 16% 17%",
      "--input": "210 16% 17%",
      "--ring": "186 48% 48%",
    },
    preview: [
      "hsl(186,52%,36%)", // Teal
      "hsl(210,42%,28%)", // Navy
      "hsl(195,22%,97%)", // Pearl
      "hsl(195,14%,91%)", // Mist
      "hsl(190,8%,92%)",  // Driftwood
    ],
  },
  {
    id: "noir",
    nameEn: "Chef Noir",
    nameAr: "الشيف الأسود",
    descEn: "Charcoal & brushed silver — Michelin-star minimalism and precision",
    descAr: "فحمي وفضي — بساطة نجوم ميشلان والدقة",
    light: {
      // Primary 1: Deep Graphite
      "--primary": "220 14% 28%",
      "--primary-foreground": "220 8% 98%",
      // Primary 2: Brushed Silver
      "--accent": "220 8% 48%",
      "--accent-foreground": "220 8% 98%",
      // Secondary 1: Ivory Linen
      "--background": "40 12% 97%",
      "--foreground": "220 20% 8%",
      // Secondary 2: Warm White
      "--card": "38 10% 95%",
      "--card-foreground": "220 20% 8%",
      // Secondary 3: Ash
      "--secondary": "220 6% 92%",
      "--secondary-foreground": "220 14% 16%",
      // Secondary 4: Smoke
      "--muted": "220 5% 93%",
      "--muted-foreground": "220 6% 42%",
      // Secondary 5: Pewter border
      "--border": "220 6% 84%",
      "--input": "220 6% 84%",
      "--ring": "220 14% 28%",
    },
    dark: {
      "--primary": "220 10% 65%",
      "--primary-foreground": "220 12% 5%",
      "--accent": "220 6% 50%",
      "--accent-foreground": "220 8% 96%",
      "--background": "220 14% 5%",
      "--foreground": "220 6% 93%",
      "--card": "220 12% 9%",
      "--card-foreground": "220 6% 93%",
      "--secondary": "220 10% 13%",
      "--secondary-foreground": "220 6% 90%",
      "--muted": "220 10% 11%",
      "--muted-foreground": "220 6% 50%",
      "--border": "220 10% 16%",
      "--input": "220 10% 16%",
      "--ring": "220 10% 65%",
    },
    preview: [
      "hsl(220,14%,28%)", // Graphite
      "hsl(220,8%,48%)",  // Silver
      "hsl(40,12%,97%)",  // Ivory
      "hsl(220,6%,92%)",  // Ash
      "hsl(220,5%,93%)",  // Smoke
    ],
  },
  {
    id: "saffron",
    nameEn: "Saffron Souk",
    nameAr: "سوق الزعفران",
    descEn: "Saffron orange & royal plum — Arabian hospitality richness",
    descAr: "زعفراني وبنفسجي ملكي — ثراء الضيافة العربية",
    light: {
      // Primary 1: Warm Saffron
      "--primary": "28 82% 52%",
      "--primary-foreground": "28 20% 99%",
      // Primary 2: Royal Plum
      "--accent": "280 35% 32%",
      "--accent-foreground": "280 15% 97%",
      // Secondary 1: Desert Sand
      "--background": "35 28% 97%",
      "--foreground": "280 25% 10%",
      // Secondary 2: Warm Cashew
      "--card": "32 24% 95%",
      "--card-foreground": "280 25% 10%",
      // Secondary 3: Amber Glow
      "--secondary": "32 18% 91%",
      "--secondary-foreground": "280 20% 15%",
      // Secondary 4: Sandstone
      "--muted": "30 12% 92%",
      "--muted-foreground": "28 14% 42%",
      // Secondary 5: Date Palm border
      "--border": "30 16% 83%",
      "--input": "30 16% 83%",
      "--ring": "28 82% 52%",
    },
    dark: {
      "--primary": "28 78% 56%",
      "--primary-foreground": "28 30% 4%",
      "--accent": "280 30% 45%",
      "--accent-foreground": "280 15% 96%",
      "--background": "280 18% 6%",
      "--foreground": "35 16% 93%",
      "--card": "280 16% 10%",
      "--card-foreground": "35 16% 93%",
      "--secondary": "280 14% 14%",
      "--secondary-foreground": "35 14% 90%",
      "--muted": "280 12% 12%",
      "--muted-foreground": "28 12% 50%",
      "--border": "280 14% 17%",
      "--input": "280 14% 17%",
      "--ring": "28 78% 56%",
    },
    preview: [
      "hsl(28,82%,52%)",  // Saffron
      "hsl(280,35%,32%)", // Plum
      "hsl(35,28%,97%)",  // Desert Sand
      "hsl(32,18%,91%)",  // Amber
      "hsl(30,12%,92%)",  // Sandstone
    ],
  },
] as const;

export type ThemePresetId = typeof THEME_PRESETS[number]["id"];

export const FONT_OPTIONS = [
  { id: "dm-sans", nameEn: "DM Sans", nameAr: "DM Sans", family: "'DM Sans', 'Noto Sans Arabic', ui-sans-serif, system-ui, sans-serif" },
  { id: "inter", nameEn: "Inter", nameAr: "Inter", family: "'Inter', 'Noto Sans Arabic', ui-sans-serif, system-ui, sans-serif" },
  { id: "poppins", nameEn: "Poppins", nameAr: "Poppins", family: "'Poppins', 'Noto Sans Arabic', ui-sans-serif, system-ui, sans-serif" },
  { id: "cairo", nameEn: "Cairo", nameAr: "القاهرة", family: "'Cairo', 'Noto Sans Arabic', ui-sans-serif, system-ui, sans-serif" },
  { id: "tajawal", nameEn: "Tajawal", nameAr: "تجوال", family: "'Tajawal', 'Noto Sans Arabic', ui-sans-serif, system-ui, sans-serif" },
] as const;

export const HEADING_FONT_OPTIONS = [
  { id: "dm-serif", nameEn: "DM Serif Display", nameAr: "DM Serif Display", family: "'DM Serif Display', ui-serif, Georgia, serif" },
  { id: "playfair", nameEn: "Playfair Display", nameAr: "Playfair Display", family: "'Playfair Display', ui-serif, Georgia, serif" },
  { id: "lora", nameEn: "Lora", nameAr: "Lora", family: "'Lora', ui-serif, Georgia, serif" },
  { id: "same-as-body", nameEn: "Same as Body", nameAr: "نفس خط النص", family: "inherit" },
] as const;
