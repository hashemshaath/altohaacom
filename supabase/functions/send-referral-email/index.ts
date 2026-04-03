import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ReferralEmailPayload {
  to: string;
  referrerName: string;
  referralLink: string;
  referralCode: string;
  language?: "en" | "ar";
}

function buildEmailHtml(payload: ReferralEmailPayload): string {
  const { referrerName, referralLink, referralCode, language = "en" } = payload;
  const isAr = language === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const title = isAr ? `${referrerName} يدعوك للانضمام إلى ألطهاة!` : `${referrerName} invites you to join Altoha!`;
  const subtitle = isAr ? "المنصة الأولى للطهاة المحترفين في العالم العربي" : "The #1 platform for professional chefs in the Arab world";
  const bodyText = isAr ? `لقد تمت دعوتك من قبل <strong>${referrerName}</strong> للانضمام إلى مجتمع ألطهاة. سجّل الآن واحصل على <strong>25 نقطة مكافأة</strong> فوراً!` : `You've been invited by <strong>${referrerName}</strong> to join the Altoha community. Sign up now and receive <strong>25 bonus points</strong> instantly!`;
  const benefits = isAr ? ["🏆 شارك في مسابقات الطهي الدولية", "📜 احصل على شهادات معتمدة", "👨‍🍳 تواصل مع طهاة محترفين", "🎓 دورات ماستركلاس حصرية"] : ["🏆 Participate in international culinary competitions", "📜 Earn certified credentials", "👨‍🍳 Connect with professional chefs", "🎓 Exclusive masterclass courses"];
  const ctaText = isAr ? "سجّل الآن" : "Sign Up Now";
  const codeLabel = isAr ? "رمز الدعوة الخاص بك" : "Your invitation code";

  return `<!DOCTYPE html><html lang="${language}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f1ee;font-family:'Segoe UI',Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:24px;"><div style="text-align:center;padding:32px 20px;background:linear-gradient(135deg,#8B4513,#D2691E);border-radius:16px 16px 0 0;"><h1 style="color:#fff;margin:0;font-size:28px;">Altoha</h1><p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${subtitle}</p></div><div style="background:#fff;padding:32px 28px;border-radius:0 0 16px 16px;border:1px solid #e8e0d8;border-top:none;"><h2 style="color:#333;margin:0 0 16px;font-size:20px;">${title}</h2><p style="color:#555;line-height:1.7;font-size:15px;margin:0 0 24px;">${bodyText}</p><div style="background:#faf8f5;border-radius:12px;padding:20px;margin:0 0 24px;">${benefits.map(b => `<p style="margin:8px 0;color:#444;font-size:14px;">${b}</p>`).join("")}</div><div style="text-align:center;margin:28px 0;"><a href="${referralLink}" style="display:inline-block;background:#8B4513;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;">${ctaText}</a></div><div style="text-align:center;margin:20px 0 0;"><p style="color:#888;font-size:12px;margin:0 0 6px;">${codeLabel}</p><div style="display:inline-block;background:#f4f1ee;border:2px dashed #D2691E;border-radius:8px;padding:8px 24px;"><span style="font-family:monospace;font-size:18px;font-weight:700;color:#8B4513;letter-spacing:3px;">${referralCode}</span></div></div></div></div></body></html>`;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (token !== supabaseKey) {
      const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return jsonResponse({ error: "RESEND_API_KEY not configured" }, 500);

    const resend = new Resend(resendApiKey);
    const payload: ReferralEmailPayload = await req.json();
    if (!payload.to || !payload.referralLink) return jsonResponse({ error: "to and referralLink are required" }, 400);

    const isAr = payload.language === "ar";
    const subject = isAr ? `${payload.referrerName} يدعوك للانضمام إلى ألطهاة!` : `${payload.referrerName} invites you to join Altoha!`;

    const emailResult = await resend.emails.send({
      from: "Altoha <noreply@altoha.com>", to: [payload.to], subject, html: buildEmailHtml(payload),
    });

    console.log("Referral email sent:", { to: payload.to });
    return jsonResponse({ success: true, emailId: emailResult?.data?.id });
  } catch (error) {
    console.error("Send referral email error:", error);
    return errorResponse(error);
  }
});
