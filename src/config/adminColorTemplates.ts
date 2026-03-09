/**
 * 3 Admin Color Style Templates — each has 10 colors covering all UI elements.
 * Colors are HSL strings (without hsl() wrapper) for direct CSS variable use.
 */

export interface AdminColorTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  colors: {
    primary: string;        // 1. Main brand / buttons
    accent: string;         // 2. Secondary accent / highlights
    background: string;     // 3. Page background
    card: string;           // 4. Card / panel surface
    foreground: string;     // 5. Primary text
    muted: string;          // 6. Muted surfaces
    mutedForeground: string;// 7. Muted text / captions
    border: string;         // 8. Borders & inputs
    success: string;        // 9. Success / positive
    destructive: string;    // 10. Error / destructive
  };
  darkColors: {
    primary: string;
    accent: string;
    background: string;
    card: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    success: string;
    destructive: string;
  };
}

export const ADMIN_COLOR_TEMPLATES: AdminColorTemplate[] = [
  {
    id: "azure-professional",
    nameEn: "Azure Professional",
    nameAr: "الأزرق الاحترافي",
    descEn: "Clean Microsoft-style blue with crisp neutrals — modern corporate feel",
    descAr: "أزرق نظيف بأسلوب مايكروسوفت مع رماديات صافية — شعور مؤسسي حديث",
    colors: {
      primary: "206 100% 42%",        // #0078D4 - Microsoft Blue
      accent: "174 62% 38%",          // Teal accent
      background: "210 17% 95%",      // Light gray bg
      card: "0 0% 100%",              // White cards
      foreground: "210 24% 16%",      // Dark text
      muted: "210 14% 93%",           // Muted surface
      mutedForeground: "210 11% 45%", // Muted text
      border: "210 14% 89%",          // Light border
      success: "142 64% 40%",         // Green
      destructive: "0 80% 56%",       // Red
    },
    darkColors: {
      primary: "206 90% 54%",
      accent: "174 50% 46%",
      background: "220 18% 10%",
      card: "220 16% 14%",
      foreground: "210 16% 93%",
      muted: "220 12% 17%",
      mutedForeground: "210 10% 52%",
      border: "220 12% 22%",
      success: "142 55% 48%",
      destructive: "0 78% 58%",
    },
  },
  {
    id: "emerald-nature",
    nameEn: "Emerald Nature",
    nameAr: "الزمرد الطبيعي",
    descEn: "Fresh emerald greens with warm stone tones — organic and calming",
    descAr: "أخضر زمردي منعش مع درجات حجرية دافئة — طبيعي ومريح",
    colors: {
      primary: "152 58% 36%",         // Emerald green
      accent: "28 65% 48%",           // Warm amber
      background: "140 12% 96%",      // Soft mint bg
      card: "120 8% 98%",             // Off-white with green tint
      foreground: "150 30% 12%",      // Dark green-black
      muted: "140 8% 92%",            // Sage mist
      mutedForeground: "150 10% 44%", // Olive gray
      border: "140 10% 86%",          // Soft sage border
      success: "158 64% 42%",         // Bright green
      destructive: "4 76% 52%",       // Coral red
    },
    darkColors: {
      primary: "152 50% 46%",
      accent: "28 58% 54%",
      background: "150 22% 7%",
      card: "148 18% 11%",
      foreground: "140 14% 93%",
      muted: "150 14% 14%",
      mutedForeground: "140 8% 50%",
      border: "150 12% 19%",
      success: "158 55% 50%",
      destructive: "4 70% 58%",
    },
  },
  {
    id: "royal-violet",
    nameEn: "Royal Violet",
    nameAr: "البنفسجي الملكي",
    descEn: "Deep violet with rose gold accents — premium and distinctive",
    descAr: "بنفسجي عميق مع لمسات ذهبية وردية — فاخر ومميز",
    colors: {
      primary: "262 60% 48%",         // Royal violet
      accent: "340 52% 52%",          // Rose pink
      background: "260 14% 96%",      // Lavender mist bg
      card: "270 10% 99%",            // Near-white with purple tint
      foreground: "260 28% 14%",      // Deep purple-black
      muted: "260 10% 92%",           // Light lavender
      mutedForeground: "260 8% 44%",  // Muted purple gray
      border: "260 12% 86%",          // Soft purple border
      success: "160 58% 40%",         // Mint green
      destructive: "0 72% 54%",       // Classic red
    },
    darkColors: {
      primary: "262 52% 58%",
      accent: "340 46% 58%",
      background: "260 20% 8%",
      card: "258 16% 12%",
      foreground: "260 12% 93%",
      muted: "260 14% 15%",
      mutedForeground: "260 8% 50%",
      border: "260 12% 20%",
      success: "160 50% 48%",
      destructive: "0 66% 58%",
    },
  },
];

export const ADMIN_COLOR_STORAGE_KEY = "altoha_admin_color_template";

/**
 * Apply an admin color template to the document root
 */
export function applyAdminColorTemplate(templateId: string | null) {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  if (!templateId) {
    // Remove template — let normal theme take over
    localStorage.removeItem(ADMIN_COLOR_STORAGE_KEY);
    window.dispatchEvent(new Event("theme-change"));
    return;
  }

  const template = ADMIN_COLOR_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;

  const colors = isDark ? template.darkColors : template.colors;

  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  root.style.setProperty("--primary-foreground", isDark ? "260 20% 4%" : "0 0% 100%");
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--card-foreground", colors.foreground);
  root.style.setProperty("--foreground", colors.foreground);
  root.style.setProperty("--popover", colors.card);
  root.style.setProperty("--popover-foreground", colors.foreground);
  root.style.setProperty("--secondary", colors.muted);
  root.style.setProperty("--secondary-foreground", colors.foreground);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--muted-foreground", colors.mutedForeground);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--input", colors.border);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--destructive", colors.destructive);

  // Sidebar inherits
  root.style.setProperty("--sidebar-background", colors.card);
  root.style.setProperty("--sidebar-foreground", colors.foreground);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-primary-foreground", isDark ? "260 20% 4%" : "0 0% 100%");
  root.style.setProperty("--sidebar-accent", colors.muted);
  root.style.setProperty("--sidebar-accent-foreground", colors.foreground);
  root.style.setProperty("--sidebar-border", colors.border);
  root.style.setProperty("--sidebar-ring", colors.primary);

  localStorage.setItem(ADMIN_COLOR_STORAGE_KEY, templateId);
}
