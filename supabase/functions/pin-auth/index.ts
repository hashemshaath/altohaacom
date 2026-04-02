import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIN_REGEX = /^\d{6}$/;
const SEQUENTIAL = ["012345", "123456", "234567", "345678", "456789", "567890", "098765", "987654", "876543", "765432", "654321", "543210"];
const PIN_EXPIRY_DAYS = 90;
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!PIN_REGEX.test(pin)) return { valid: false, error: "PIN must be exactly 6 digits" };
  if (SEQUENTIAL.includes(pin)) return { valid: false, error: "PIN cannot be sequential" };
  if (/^(\d)\1{5}$/.test(pin)) return { valid: false, error: "PIN cannot be all the same digit" };
  return { valid: true };
}

async function logAudit(supabase: any, userId: string | null, action: string, req: Request, meta: any = {}) {
  await supabase.from("auth_audit_log").insert({
    user_id: userId,
    action_type: action,
    ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown",
    user_agent: req.headers.get("user-agent") || "unknown",
    metadata: meta,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const body = await req.json();
    const { action } = body;

    // Auth client for user identity
    const authHeader = req.headers.get("Authorization");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Get current user (for authenticated actions)
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await authClient.auth.getUser();
      userId = user?.id || null;
    }

    switch (action) {
      // ── SET PIN ──
      case "set_pin": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { pin, device_fingerprint, device_name } = body;
        const validation = validatePin(pin);
        if (!validation.valid) {
          return new Response(JSON.stringify({ error: validation.error, code: "INVALID_PIN" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!device_fingerprint) {
          return new Response(JSON.stringify({ error: "Device fingerprint required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const hashedPin = await bcrypt.hash(pin, 12);

        // Upsert PIN
        await serviceClient.from("user_pins").upsert({
          user_id: userId,
          hashed_pin: hashedPin,
          pin_created_at: new Date().toISOString(),
          failed_pin_attempts: 0,
          pin_locked_until: null,
          device_fingerprint,
          is_active: true,
        }, { onConflict: "user_id" });

        // Register trusted device
        await serviceClient.from("trusted_devices").upsert({
          user_id: userId,
          device_fingerprint,
          device_name: device_name || "Unknown Device",
          user_agent: req.headers.get("user-agent"),
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          last_used_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: "user_id,device_fingerprint" });

        await logAudit(serviceClient, userId, "pin_created", req, { device_fingerprint });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── VERIFY PIN (Login) ──
      case "verify_pin": {
        const { user_id: targetUserId, pin, device_fingerprint } = body;

        if (!targetUserId || !pin || !device_fingerprint) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get PIN record
        const { data: pinRecord } = await serviceClient
          .from("user_pins")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("is_active", true)
          .single();

        if (!pinRecord) {
          await logAudit(serviceClient, targetUserId, "pin_verify_failed", req, { reason: "no_pin_set" });
          return new Response(JSON.stringify({ error: "PIN not set", code: "NO_PIN" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check lockout
        if (pinRecord.pin_locked_until && new Date(pinRecord.pin_locked_until) > new Date()) {
          const remainingMs = new Date(pinRecord.pin_locked_until).getTime() - Date.now();
          await logAudit(serviceClient, targetUserId, "pin_verify_locked", req);
          return new Response(JSON.stringify({
            error: "PIN is locked",
            code: "PIN_LOCKED",
            locked_until: pinRecord.pin_locked_until,
            remaining_seconds: Math.ceil(remainingMs / 1000),
          }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check device trust
        const { data: trustedDevice } = await serviceClient
          .from("trusted_devices")
          .select("id")
          .eq("user_id", targetUserId)
          .eq("device_fingerprint", device_fingerprint)
          .eq("is_active", true)
          .single();

        if (!trustedDevice) {
          await logAudit(serviceClient, targetUserId, "pin_verify_untrusted_device", req, { device_fingerprint });
          return new Response(JSON.stringify({
            error: "Unrecognized device. Please login with your password or OTP first.",
            code: "UNTRUSTED_DEVICE",
          }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check PIN expiry (90 days)
        const pinAge = Date.now() - new Date(pinRecord.pin_created_at).getTime();
        if (pinAge > PIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
          await logAudit(serviceClient, targetUserId, "pin_expired", req);
          return new Response(JSON.stringify({
            error: "PIN has expired. Please set a new PIN.",
            code: "PIN_EXPIRED",
          }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify PIN
        const pinMatch = await bcrypt.compare(pin, pinRecord.hashed_pin);

        if (!pinMatch) {
          const newAttempts = (pinRecord.failed_pin_attempts || 0) + 1;
          const updateData: any = { failed_pin_attempts: newAttempts };

          if (newAttempts >= MAX_PIN_ATTEMPTS) {
            updateData.pin_locked_until = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
            await logAudit(serviceClient, targetUserId, "pin_locked", req, { attempts: newAttempts });
          }

          await serviceClient.from("user_pins").update(updateData).eq("user_id", targetUserId);

          await logAudit(serviceClient, targetUserId, "pin_verify_failed", req, {
            attempts: newAttempts,
            remaining: MAX_PIN_ATTEMPTS - newAttempts,
          });

          return new Response(JSON.stringify({
            error: "Incorrect PIN",
            code: "WRONG_PIN",
            remaining_attempts: Math.max(0, MAX_PIN_ATTEMPTS - newAttempts),
          }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // PIN is correct — reset attempts, update device
        await serviceClient.from("user_pins").update({
          failed_pin_attempts: 0,
          pin_locked_until: null,
        }).eq("user_id", targetUserId);

        await serviceClient.from("trusted_devices").update({
          last_used_at: new Date().toISOString(),
        }).eq("user_id", targetUserId).eq("device_fingerprint", device_fingerprint);

        // Get user email to generate a session
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("email")
          .eq("user_id", targetUserId)
          .single();

        await logAudit(serviceClient, targetUserId, "pin_login_success", req, { device_fingerprint });

        return new Response(JSON.stringify({
          success: true,
          email: profile?.email,
          user_id: targetUserId,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── DISABLE PIN ──
      case "disable_pin": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await serviceClient.from("user_pins").update({ is_active: false }).eq("user_id", userId);
        await logAudit(serviceClient, userId, "pin_disabled", req);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── CHECK PIN STATUS ──
      case "check_pin_status": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: pinData } = await serviceClient
          .from("user_pins")
          .select("pin_created_at, is_active, failed_pin_attempts, pin_locked_until, device_fingerprint")
          .eq("user_id", userId)
          .eq("is_active", true)
          .single();

        if (!pinData) {
          return new Response(JSON.stringify({ has_pin: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const pinAge = Date.now() - new Date(pinData.pin_created_at).getTime();
        const isExpired = pinAge > PIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const isLocked = pinData.pin_locked_until && new Date(pinData.pin_locked_until) > new Date();

        return new Response(JSON.stringify({
          has_pin: true,
          is_expired: isExpired,
          is_locked: !!isLocked,
          days_until_expiry: Math.max(0, Math.floor((PIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000 - pinAge) / (24 * 60 * 60 * 1000))),
          failed_attempts: pinData.failed_pin_attempts,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── LIST TRUSTED DEVICES ──
      case "list_devices": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: devices } = await serviceClient
          .from("trusted_devices")
          .select("id, device_fingerprint, device_name, last_used_at, created_at, is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("last_used_at", { ascending: false });

        return new Response(JSON.stringify({ devices: devices || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── REMOVE TRUSTED DEVICE ──
      case "remove_device": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { device_id } = body;
        await serviceClient.from("trusted_devices")
          .update({ is_active: false })
          .eq("id", device_id)
          .eq("user_id", userId);

        await logAudit(serviceClient, userId, "device_removed", req, { device_id });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── CHANGE PASSWORD (logged-in) ──
      case "change_password": {
        if (!userId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { current_password, new_password } = body;

        // Validate new password strength
        if (!new_password || new_password.length < 8) {
          return new Response(JSON.stringify({ error: "Password must be at least 8 characters", code: "PASSWORD_TOO_WEAK" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!/[A-Z]/.test(new_password)) {
          return new Response(JSON.stringify({ error: "Password must contain an uppercase letter", code: "PASSWORD_TOO_WEAK" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (!/\d/.test(new_password)) {
          return new Response(JSON.stringify({ error: "Password must contain a number", code: "PASSWORD_TOO_WEAK" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify current password by attempting sign-in
        const { data: profile } = await serviceClient
          .from("profiles")
          .select("email")
          .eq("user_id", userId)
          .single();

        if (!profile?.email) {
          return new Response(JSON.stringify({ error: "User email not found" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: signInError } = await serviceClient.auth.signInWithPassword({
          email: profile.email,
          password: current_password,
        });

        if (signInError) {
          await logAudit(serviceClient, userId, "password_change_failed", req, { reason: "wrong_current_password" });
          return new Response(JSON.stringify({ error: "Current password is incorrect", code: "WRONG_PASSWORD" }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update password
        const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
          password: new_password,
        });

        if (updateError) {
          return new Response(JSON.stringify({ error: "Failed to update password" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await logAudit(serviceClient, userId, "password_changed", req);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("PIN auth error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
