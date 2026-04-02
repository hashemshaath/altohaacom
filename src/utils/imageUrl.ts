const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Build an optimised image URL, applying Supabase Storage transforms when possible.
 */
export function getImageUrl(
  path: string | null | undefined,
  options: { width?: number; height?: number; quality?: number; format?: "webp" | "avif" } = {}
): string {
  if (!path) return "/placeholder.svg";
  // External non-Supabase images — return as-is
  if (path.startsWith("http") && !path.includes("supabase")) return path;

  const { width = 800, height, quality = 80, format = "webp" } = options;
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("format", format);

  const baseUrl = path.startsWith("http")
    ? path
    : `${SUPABASE_URL}/storage/v1/object/public/${path}`;

  return `${baseUrl}?${params.toString()}`;
}

/** Preset image sizes for common UI components */
export const imagePresets = {
  avatar:    (p: string) => getImageUrl(p, { width: 96,   height: 96,   quality: 85 }),
  avatarLg:  (p: string) => getImageUrl(p, { width: 200,  height: 200,  quality: 85 }),
  card:      (p: string) => getImageUrl(p, { width: 400,  height: 250,  quality: 80 }),
  cardLg:    (p: string) => getImageUrl(p, { width: 800,  height: 450,  quality: 80 }),
  hero:      (p: string) => getImageUrl(p, { width: 1440, height: 600,  quality: 85 }),
  thumbnail: (p: string) => getImageUrl(p, { width: 150,  height: 150,  quality: 75 }),
  banner:    (p: string) => getImageUrl(p, { width: 1200, height: 400,  quality: 80 }),
  og:        (p: string) => getImageUrl(p, { width: 1200, height: 630,  quality: 85 }),
} as const;
