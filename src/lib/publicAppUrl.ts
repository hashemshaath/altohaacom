const FALLBACK_PUBLISHED_ORIGIN = "https://altohaacom.lovable.app";

function isPreviewHost(hostname: string) {
  return hostname.endsWith(".lovableproject.com") || hostname.includes("id-preview--");
}

export function getPublicAppOrigin() {
  if (typeof window === "undefined") return FALLBACK_PUBLISHED_ORIGIN;

  const { origin, hostname } = window.location;
  return isPreviewHost(hostname) ? FALLBACK_PUBLISHED_ORIGIN : origin;
}

export function buildPublicUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicAppOrigin()}${normalizedPath}`;
}

export function buildSocialLinksPath(username: string) {
  return `/bio/${username}`;
}

export function buildSocialLinksUrl(username: string) {
  return buildPublicUrl(buildSocialLinksPath(username));
}

