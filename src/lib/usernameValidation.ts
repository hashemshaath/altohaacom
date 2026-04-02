// Username validation rules and reserved words

export const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

const RESERVED_USERNAMES = new Set([
  // System reserved
  "admin", "root", "system", "support", "api", "backend", "server",
  "dashboard", "auth", "login", "register", "signup", "signin",
  "logout", "settings", "profile", "account", "help", "about",
  "contact", "privacy", "terms", "tos", "sitemap", "robots",
  "favicon", "static", "assets", "public", "private", "www",
  "mail", "ftp", "ssh", "cdn", "status", "health", "ping",
  // Brand reserved
  "tabaq", "tabaqapp", "tabaqadmin", "altoha", "altohaapp",
  "altohaadmin", "official", "team", "staff",
  // Generic / abusable
  "test", "user", "guest", "null", "undefined", "anonymous",
  "unknown", "nobody", "everyone", "all", "none", "default",
  // Security sensitive
  "owner", "superadmin", "moderator", "dev", "internal",
  "administrator", "sysadmin", "webmaster", "postmaster",
  "hostmaster", "abuse",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export function validateUsername(username: string): { valid: boolean; error?: string; errorAr?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters", errorAr: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" };
  }
  if (username.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less", errorAr: "اسم المستخدم يجب أن يكون 30 حرفاً أو أقل" };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: "Only letters, numbers, underscore and hyphen allowed", errorAr: "يُسمح فقط بالأحرف والأرقام والشرطة السفلية والواصلة" };
  }
  if (isReservedUsername(username)) {
    return { valid: false, error: "This username is not allowed", errorAr: "اسم المستخدم هذا غير مسموح به" };
  }
  return { valid: true };
}

/** Detect input type for login: email, phone, or username */
export function detectLoginInputType(input: string): "email" | "phone" | "username" {
  if (input.includes("@")) return "email";
  if (/^\+?\d{7,15}$/.test(input.replace(/\s/g, ""))) return "phone";
  return "username";
}
