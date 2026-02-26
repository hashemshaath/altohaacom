/**
 * Returns the appropriate display name based on the current language.
 * Priority: display_name > full_name, with Arabic variants preferred when isAr=true.
 *
 * @param profile - Object containing name fields from the profiles table.
 * @param isAr - Whether the UI is in Arabic mode.
 * @param fallback - Fallback string if no name is found. Defaults to "".
 */
export function getDisplayName(
  profile: {
    display_name?: string | null;
    display_name_ar?: string | null;
    full_name?: string | null;
    full_name_ar?: string | null;
    username?: string | null;
  } | null | undefined,
  isAr: boolean,
  fallback = ""
): string {
  if (!profile) return fallback;

  if (isAr) {
    return (
      profile.display_name_ar ||
      profile.full_name_ar ||
      profile.display_name ||
      profile.full_name ||
      profile.username ||
      fallback
    );
  }

  return (
    profile.display_name ||
    profile.full_name ||
    profile.display_name_ar ||
    profile.full_name_ar ||
    profile.username ||
    fallback
  );
}

/**
 * Returns the first character of the display name for use in avatar fallbacks.
 */
export function getDisplayInitial(
  profile: Parameters<typeof getDisplayName>[0],
  isAr: boolean
): string {
  const name = getDisplayName(profile, isAr);
  return name ? name[0].toUpperCase() : "U";
}
