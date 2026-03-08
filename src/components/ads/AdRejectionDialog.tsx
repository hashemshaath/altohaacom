import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle } from "lucide-react";

interface AdRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  title?: string;
  isPending?: boolean;
}

const REJECTION_REASONS = [
  { en: "Does not meet content guidelines", ar: "لا يتوافق مع إرشادات المحتوى" },
  { en: "Inappropriate or offensive content", ar: "محتوى غير لائق أو مسيء" },
  { en: "Low quality creative assets", ar: "مواد إبداعية منخفضة الجودة" },
  { en: "Misleading or false claims", ar: "ادعاءات مضللة أو كاذبة" },
  { en: "Budget or pricing concerns", ar: "مخاوف تتعلق بالميزانية أو التسعير" },
  { en: "Targeting restrictions violated", ar: "انتهاك قيود الاستهداف" },
  { en: "Duplicate or spam content", ar: "محتوى مكرر أو بريد عشوائي" },
  { en: "Other (specify below)", ar: "سبب آخر (حدد أدناه)" },
];

export const AdRejectionDialog = memo(function AdRejectionDialog({ open, onOpenChange, onConfirm, title, isPending }: AdRejectionDialogProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const reason = selectedReason === "Other (specify below)" || selectedReason === "سبب آخر (حدد أدناه)"
      ? customReason || selectedReason
      : selectedReason;
    if (!reason) return;
    onConfirm(reason);
    setSelectedReason("");
    setCustomReason("");
  };

  const isOther = selectedReason === "Other (specify below)" || selectedReason === "سبب آخر (حدد أدناه)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            {title || (isAr ? "رفض" : "Reject")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">{isAr ? "سبب الرفض" : "Rejection Reason"}</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر السبب..." : "Select reason..."} />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map(r => (
                  <SelectItem key={r.en} value={isAr ? r.ar : r.en}>
                    {isAr ? r.ar : r.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isOther && (
            <div>
              <Label className="text-sm">{isAr ? "تفاصيل إضافية" : "Additional Details"}</Label>
              <Textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder={isAr ? "اكتب سبب الرفض..." : "Enter rejection reason..."}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!selectedReason || isPending}>
            {isAr ? "تأكيد الرفض" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
