import { handleCors } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const raw = atob(base64 + "=".repeat(pad));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidJwt(audience: string, subject: string, privateKeyBytes: Uint8Array): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };
  const encHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encHeader}.${encPayload}`;
  const key = await crypto.subtle.importKey("pkcs8", privateKeyBytes, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const sig = new Uint8Array(signatureBuffer);
  let r: Uint8Array, s: Uint8Array;
  if (sig.length === 64) { r = sig.slice(0, 32); s = sig.slice(32, 64); } else {
    const rLen = sig[3]; const rStart = 4; const rBytes = sig.slice(rStart, rStart + rLen);
    const sLen = sig[rStart + rLen + 1]; const sStart = rStart + rLen + 2; const sBytes = sig.slice(sStart, sStart + sLen);
    r = new Uint8Array(32); s = new Uint8Array(32);
    r.set(rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes, 32 - Math.min(rBytes.length, 32));
    s.set(sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes, 32 - Math.min(sBytes.length, 32));
  }
  const rawSig = new Uint8Array(64); rawSig.set(r, 0); rawSig.set(s, 32);
  return `${unsignedToken}.${bytesToBase64Url(rawSig)}`;
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) { result.set(buf, offset); offset += buf.length; }
  return result;
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, info)).slice(0, length);
}

async function encryptPayload(p256dhKey: string, authSecret: string, payload: Uint8Array): Promise<{ encrypted: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const clientPublicKeyBytes = base64UrlToBytes(p256dhKey);
  const authSecretBytes = base64UrlToBytes(authSecret);
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeys.privateKey, 256));
  const serverPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdfExtract(authSecretBytes, sharedSecret);
  const ikm = await hkdfExpand(prk, concatBuffers(authInfo, new Uint8Array([1])), 32);
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const pseudoRandomKey = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(pseudoRandomKey, concatBuffers(cekInfo, new Uint8Array([1])), 16);
  const nonce = await hkdfExpand(pseudoRandomKey, concatBuffers(nonceInfo, new Uint8Array([1])), 12);
  const paddedPayload = concatBuffers(payload, new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", contentEncryptionKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload));
  const recordSize = new ArrayBuffer(4); new DataView(recordSize).setUint32(0, 4096);
  const header = concatBuffers(salt, new Uint8Array(recordSize), new Uint8Array([65]), serverPublicKeyRaw);
  return { encrypted: concatBuffers(header, ciphertext) };
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPrivateKey) return jsonResponse({ error: "Push notifications not configured" }, 500);

    const supabase = getServiceClient();

    const { data: queueItems, error: queueError } = await supabase.from("notification_queue").select("id, user_id, payload, attempts").eq("channel", "push").eq("status", "pending").order("created_at").limit(50);
    if (queueError) throw queueError;
    if (!queueItems?.length) return jsonResponse({ processed: 0, message: "No pending push notifications" });

    const results = { sent: 0, failed: 0, removed_stale: 0, errors: [] as string[] };
    const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);
    const vapidPublicKey = "BNpKhfYGzVfr_FEBXxGefORo8gJNGMZdaQ0FGKC0SJYE-YyT_mu1HGqWAXvWrFPOdGWGKGEP9fVnJpMGx_GQWM";

    for (const item of queueItems) {
      try {
        const { data: subscriptions } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", item.user_id);
        if (!subscriptions?.length) {
          await supabase.from("notification_queue").update({ status: "failed", error_message: "No push subscriptions found", attempts: (item.attempts || 0) + 1 }).eq("id", item.id);
          results.failed++; continue;
        }

        const payload = item.payload as any;
        const pushPayload = new TextEncoder().encode(JSON.stringify({ title: payload.title || "Notification", body: payload.body || "", icon: "/icon-192.png", badge: "/icon-72.png", data: { url: payload.link || "/" } }));
        let anySent = false;

        for (const sub of subscriptions) {
          try {
            const endpointUrl = new URL(sub.endpoint);
            const jwt = await createVapidJwt(`${endpointUrl.protocol}//${endpointUrl.host}`, "mailto:support@altoha.com", privateKeyBytes);
            const { encrypted } = await encryptPayload(sub.p256dh, sub.auth, pushPayload);
            const response = await fetch(sub.endpoint, {
              method: "POST", headers: { "Content-Type": "application/octet-stream", "Content-Encoding": "aes128gcm", "TTL": "86400", "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}` }, body: encrypted,
            });
            if (response.status === 201 || response.status === 200) { anySent = true; }
            else if (response.status === 404 || response.status === 410) { await supabase.from("push_subscriptions").delete().eq("id", sub.id); results.removed_stale++; }
            else { console.error(`Push failed: ${response.status}`); try { await response.text(); } catch {} }
          } catch (subErr: unknown) { console.error(`Push error for sub ${sub.id}:`, subErr instanceof Error ? subErr.message : String(subErr)); }
        }

        await supabase.from("notification_queue").update(anySent ? { status: "sent", sent_at: new Date().toISOString(), attempts: (item.attempts || 0) + 1 } : { status: "failed", error_message: "All push endpoints failed", attempts: (item.attempts || 0) + 1 }).eq("id", item.id);
        if (anySent) results.sent++; else results.failed++;
      } catch (itemErr: unknown) {
        await supabase.from("notification_queue").update({ status: "failed", error_message: itemErr instanceof Error ? itemErr.message : String(itemErr)?.substring(0, 200), attempts: (item.attempts || 0) + 1 }).eq("id", item.id);
        results.failed++;
      }
    }

    console.log("Push queue processed:", results);
    return jsonResponse({ success: true, ...results });
  } catch (error: unknown) {
    console.error("Process push queue error:", error);
    return errorResponse(error);
  }
});
