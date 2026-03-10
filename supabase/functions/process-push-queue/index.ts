import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Convert VAPID key from URL-safe base64 to raw bytes
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const raw = atob(base64 + "=".repeat(pad));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create a JWT for VAPID authentication
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBytes: Uint8Array
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const encHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encHeader}.${encPayload}`;

  // Import the private key for ES256 signing
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const sig = new Uint8Array(signatureBuffer);
  let r: Uint8Array, s: Uint8Array;

  if (sig.length === 64) {
    r = sig.slice(0, 32);
    s = sig.slice(32, 64);
  } else {
    // DER format: extract r and s
    const rLen = sig[3];
    const rStart = 4;
    const rBytes = sig.slice(rStart, rStart + rLen);
    const sLen = sig[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    const sBytes = sig.slice(sStart, sStart + sLen);

    r = new Uint8Array(32);
    s = new Uint8Array(32);
    r.set(rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes, 32 - Math.min(rBytes.length, 32));
    s.set(sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes, 32 - Math.min(sBytes.length, 32));
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${bytesToBase64Url(rawSig)}`;
}

// Encrypt push payload using WebPush (RFC 8291)
async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payload: Uint8Array
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const clientPublicKeyBytes = base64UrlToBytes(p256dhKey);
  const authSecretBytes = base64UrlToBytes(authSecret);

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      serverKeys.privateKey,
      256
    )
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // HKDF-based key derivation (simplified aes128gcm)
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prk = await hkdfExtract(authSecretBytes, sharedSecret);

  const ikm = await hkdfExpand(prk, concatBuffers(authInfo, new Uint8Array([1])), 32);

  const keyInfoBuf = concatBuffers(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
    new Uint8Array([0]),
    clientPublicKeyBytes,
    new Uint8Array([0, 65]),
    serverPublicKeyRaw
  );

  const cekInfo = concatBuffers(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0"),
  );
  const nonceInfo = concatBuffers(
    new TextEncoder().encode("Content-Encoding: nonce\0"),
  );

  const pseudoRandomKey = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = (await hkdfExpand(pseudoRandomKey, concatBuffers(cekInfo, new Uint8Array([1])), 16));
  const nonce = (await hkdfExpand(pseudoRandomKey, concatBuffers(nonceInfo, new Uint8Array([1])), 12));

  // Pad and encrypt
  const paddedPayload = concatBuffers(payload, new Uint8Array([2])); // delimiter

  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      paddedPayload
    )
  );

  // Build aes128gcm record
  const recordSize = new ArrayBuffer(4);
  new DataView(recordSize).setUint32(0, 4096);

  const header = concatBuffers(
    salt,
    new Uint8Array(recordSize),
    new Uint8Array([65]),
    serverPublicKeyRaw
  );

  return {
    encrypted: concatBuffers(header, ciphertext),
    salt,
    serverPublicKey: serverPublicKeyRaw,
  };
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", key, info));
  return result.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPrivateKey) {
      console.error("VAPID_PRIVATE_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending push queue items
    const { data: queueItems, error: queueError } = await supabase
      .from("notification_queue")
      .select("id, user_id, payload, attempts")
      .eq("channel", "push")
      .eq("status", "pending")
      .order("created_at")
      .limit(50);

    if (queueError) {
      console.error("Failed to fetch queue:", queueError);
      return new Response(
        JSON.stringify({ error: queueError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending push notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = { sent: 0, failed: 0, removed_stale: 0, errors: [] as string[] };
    const vapidSubject = "mailto:support@altoha.com";
    const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);

    for (const item of queueItems) {
      try {
        // Get all push subscriptions for this user
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("user_id", item.user_id);

        if (!subscriptions || subscriptions.length === 0) {
          // No subscriptions — mark as failed
          await supabase.from("notification_queue").update({
            status: "failed",
            error_message: "No push subscriptions found",
            attempts: (item.attempts || 0) + 1,
          }).eq("id", item.id);
          results.failed++;
          continue;
        }

        const payload = item.payload as any;
        const pushPayload = JSON.stringify({
          title: payload.title || "Notification",
          body: payload.body || "",
          icon: "/icon-192.png",
          badge: "/icon-72.png",
          data: { url: payload.link || "/" },
        });

        const payloadBytes = new TextEncoder().encode(pushPayload);
        let anySent = false;

        for (const sub of subscriptions) {
          try {
            const endpointUrl = new URL(sub.endpoint);
            const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

            // Create VAPID JWT
            const jwt = await createVapidJwt(audience, vapidSubject, privateKeyBytes);

            // Encrypt the payload
            const { encrypted } = await encryptPayload(sub.p256dh, sub.auth, payloadBytes);

            // VAPID public key for the Authorization header
            const vapidPublicKey = "BNpKhfYGzVfr_FEBXxGefORo8gJNGMZdaQ0FGKC0SJYE-YyT_mu1HGqWAXvWrFPOdGWGKGEP9fVnJpMGx_GQWM";

            // Send the push message
            const response = await fetch(sub.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/octet-stream",
                "Content-Encoding": "aes128gcm",
                "TTL": "86400",
                "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
              },
              body: encrypted,
            });

            if (response.status === 201 || response.status === 200) {
              anySent = true;
            } else if (response.status === 404 || response.status === 410) {
              // Subscription expired — remove it
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
              results.removed_stale++;
            } else {
              const respText = await response.text();
              console.error(`Push failed for endpoint ${sub.endpoint}: ${response.status} ${respText}`);
            }

            // Consume response body to prevent resource leaks
            if (response.status !== 201 && response.status !== 200 && response.status !== 404 && response.status !== 410) {
              try { await response.text(); } catch {}
            }
          } catch (subErr: any) {
            console.error(`Push error for subscription ${sub.id}:`, subErr.message);
          }
        }

        if (anySent) {
          await supabase.from("notification_queue").update({
            status: "sent",
            sent_at: new Date().toISOString(),
            attempts: (item.attempts || 0) + 1,
          }).eq("id", item.id);
          results.sent++;
        } else {
          await supabase.from("notification_queue").update({
            status: "failed",
            error_message: "All push endpoints failed",
            attempts: (item.attempts || 0) + 1,
          }).eq("id", item.id);
          results.failed++;
        }
      } catch (itemErr: any) {
        console.error(`Failed to process queue item ${item.id}:`, itemErr.message);
        await supabase.from("notification_queue").update({
          status: "failed",
          error_message: itemErr.message?.substring(0, 200),
          attempts: (item.attempts || 0) + 1,
        }).eq("id", item.id);
        results.failed++;
        results.errors.push(itemErr.message);
      }
    }

    console.log("Push queue processed:", results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Process push queue error:", error);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
