import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 2592000; // 30 days in seconds

/**
 * Upload a file to message-attachments and return a signed URL.
 * The bucket is private, so we use createSignedUrl instead of getPublicUrl.
 */
export async function uploadMessageAttachment(
  filePath: string,
  file: File | Blob
): Promise<string> {
  const { error } = await supabase.storage
    .from("message-attachments")
    .upload(filePath, file);
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from("message-attachments")
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
  if (signError || !data?.signedUrl) throw signError || new Error("Failed to create signed URL");

  return data.signedUrl;
}

/**
 * Given a stored attachment URL, return a usable URL.
 * - If it's already a signed URL (contains "token="), return as-is.
 * - If it's an old public URL, extract the path and generate a signed URL.
 */
export async function resolveAttachmentUrl(url: string): Promise<string> {
  // Already a signed URL
  if (url.includes("token=")) return url;

  // Try to extract path from old public URL pattern:
  // .../storage/v1/object/public/message-attachments/path/to/file
  const publicMatch = url.match(/\/storage\/v1\/object\/public\/message-attachments\/(.+)$/);
  if (publicMatch) {
    const path = decodeURIComponent(publicMatch[1]);
    const { data, error } = await supabase.storage
      .from("message-attachments")
      .createSignedUrl(path, SIGNED_URL_EXPIRY);
    if (data?.signedUrl) return data.signedUrl;
  }

  // Fallback: return original URL (may not work if bucket is now private)
  return url;
}

/**
 * Batch resolve attachment URLs for efficiency.
 */
export async function resolveAttachmentUrls(urls: string[]): Promise<string[]> {
  // Separate old public URLs that need re-signing from already-signed ones
  const needsSigning: { index: number; path: string }[] = [];
  const results = [...urls];

  for (let i = 0; i < urls.length; i++) {
    if (!urls[i].includes("token=")) {
      const publicMatch = urls[i].match(/\/storage\/v1\/object\/public\/message-attachments\/(.+)$/);
      if (publicMatch) {
        needsSigning.push({ index: i, path: decodeURIComponent(publicMatch[1]) });
      }
    }
  }

  if (needsSigning.length > 0) {
    const paths = needsSigning.map((n) => n.path);
    const { data, error } = await supabase.storage
      .from("message-attachments")
      .createSignedUrls(paths, SIGNED_URL_EXPIRY);
    if (data) {
      data.forEach((item, idx) => {
        if (item.signedUrl) {
          results[needsSigning[idx].index] = item.signedUrl;
        }
      });
    }
  }

  return results;
}
