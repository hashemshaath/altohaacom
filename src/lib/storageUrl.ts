/**
 * Utility for generating signed URLs for private storage buckets.
 * company-media and exhibition-files are private buckets.
 */
import { supabase } from "@/integrations/supabase/client";

const PRIVATE_BUCKETS = new Set(["company-media", "exhibition-files"]);
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

/**
 * Get a URL for a storage file. Uses signed URLs for private buckets,
 * public URLs for public buckets.
 */
export async function getStorageUrl(
  bucket: string,
  path: string
): Promise<string | null> {
  if (PRIVATE_BUCKETS.has(bucket)) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);
    if (error) {
      console.error(`[Storage] Signed URL error for ${bucket}/${path}:`, error.message);
      return null;
    }
    return data.signedUrl;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file and return its signed/public URL.
 */
export async function uploadAndGetUrl(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
): Promise<{ url: string; error: Error | null }> {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);

  if (uploadError) {
    return { url: "", error: uploadError };
  }

  const url = await getStorageUrl(bucket, path);
  if (!url) {
    return { url: "", error: new Error("Failed to generate URL") };
  }
  return { url, error: null };
}
