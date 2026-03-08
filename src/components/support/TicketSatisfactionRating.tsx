import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketSatisfactionRatingProps {
  ticketId: string;
  ticketStatus: string;
  existingRating?: number | null;
}

export const TicketSatisfactionRating = memo(function TicketSatisfactionRating({ ticketId, ticketStatus, existingRating }: TicketSatisfactionRatingProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [rating, setRating] = useState(existingRating || 0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(!!existingRating);
  const [submitting, setSubmitting] = useState(false);

  // Only show for resolved/closed tickets
  if (ticketStatus !== "resolved" && ticketStatus !== "closed") return null;
  
  if (submitted) {
    return (
      <Card className="border-chart-5/30 bg-chart-5/5">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-chart-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{isAr ? "شكراً لتقييمك!" : "Thank you for your feedback!"}</p>
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={cn("h-3.5 w-3.5", s <= rating ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30")} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await supabase.from("support_tickets").update({
        satisfaction_rating: rating,
        satisfaction_feedback: feedback || null,
      } as any).eq("id", ticketId);
      setSubmitted(true);
      toast.success(isAr ? "تم إرسال التقييم بنجاح" : "Rating submitted successfully");
    } catch {
      toast.error(isAr ? "فشل الإرسال" : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4 space-y-3">
        <p className="text-sm font-medium">{isAr ? "كيف تقيّم تجربة الدعم؟" : "How was your support experience?"}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              className="p-1 transition-transform hover:scale-110 active:scale-95 touch-manipulation"
            >
              <Star className={cn(
                "h-6 w-6 transition-colors",
                s <= (hovered || rating) ? "fill-chart-4 text-chart-4" : "text-muted-foreground/30"
              )} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <>
            <Textarea
              placeholder={isAr ? "ملاحظات إضافية (اختياري)..." : "Additional feedback (optional)..."}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {submitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال التقييم" : "Submit Rating")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
