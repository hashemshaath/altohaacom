import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";

const REPORT_REASONS = [
  { value: "spam", en: "Spam or misleading", ar: "محتوى مزعج أو مضلل" },
  { value: "harassment", en: "Harassment or bullying", ar: "تحرش أو تنمر" },
  { value: "hate_speech", en: "Hate speech or offensive", ar: "خطاب كراهية أو مسيء" },
  { value: "violence", en: "Violence or threats", ar: "عنف أو تهديدات" },
  { value: "political", en: "Political content", ar: "محتوى سياسي" },
  { value: "inappropriate", en: "Inappropriate or adult content", ar: "محتوى غير لائق" },
  { value: "copyright", en: "Copyright violation", ar: "انتهاك حقوق الملكية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

interface ReportDialogProps {
  postId: string;
  onClose: () => void;
}

export const ReportDialog = memo(function ReportDialog({ postId, onClose }: ReportDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase.from("post_reports").insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
      reason_detail: detail.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم إرسال البلاغ" : "Report submitted", description: isAr ? "سنراجع المحتوى قريباً" : "We'll review this content soon" });
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {isAr ? "الإبلاغ عن منشور" : "Report Post"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isAr ? "اختر سبب الإبلاغ:" : "Select a reason for reporting:"}
          </p>

          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <div key={r.value} className="flex items-center gap-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="text-sm cursor-pointer">
                  {isAr ? r.ar : r.en}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason && (
            <Textarea
              placeholder={isAr ? "أضف تفاصيل إضافية (اختياري)..." : "Add more details (optional)..."}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : null}
            {isAr ? "إبلاغ" : "Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
