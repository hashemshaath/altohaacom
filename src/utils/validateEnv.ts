const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

/**
 * Validate that all required environment variables are set.
 * Called once at boot before React mounts.
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key]
  );
  if (missing.length > 0) {
    throw new Error(
      `[AlToha] Missing required environment variables:\n${missing.join("\n")}\n` +
        "Ensure your .env file is configured correctly."
    );
  }
}
