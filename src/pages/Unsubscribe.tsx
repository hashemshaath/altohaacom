import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertCircle, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw handleSupabaseError(error);
      if (data?.success) {
        setStatus("done");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verifying…</p>
          </>
        )}

        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe from emails</h1>
            <p className="text-muted-foreground">
              You will no longer receive app emails from Altoha. Auth emails (password resets, etc.) are not affected.
            </p>
            <p className="text-muted-foreground" dir="rtl">
              لن تتلقى بعد الآن رسائل بريد إلكتروني من ألطهاة. رسائل المصادقة لن تتأثر.
            </p>
            <Button onClick={handleConfirm} variant="destructive" size="lg">
              Confirm Unsubscribe / تأكيد إلغاء الاشتراك
            </Button>
          </>
        )}

        {status === "confirming" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Processing…</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">
              You have been successfully unsubscribed from Altoha emails.
            </p>
            <p className="text-muted-foreground" dir="rtl">
              تم إلغاء اشتراكك بنجاح من رسائل ألطهاة.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Already unsubscribed</h1>
            <p className="text-muted-foreground">
              You were already unsubscribed from these emails.
            </p>
            <p className="text-muted-foreground" dir="rtl">
              لقد تم إلغاء اشتراكك مسبقاً.
            </p>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              {status === "invalid" ? "Invalid link" : "Something went wrong"}
            </h1>
            <p className="text-muted-foreground">
              {status === "invalid"
                ? "This unsubscribe link is invalid or has expired."
                : "Please try again later."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
