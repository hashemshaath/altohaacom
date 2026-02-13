import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckSquare, Send } from "lucide-react";

interface ApprovalTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (data: { title: string; description: string }) => void;
  isPending: boolean;
}

export function ApprovalTemplateDialog({ open, onOpenChange, onSend, isPending }: ApprovalTemplateDialogProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const templates = [
    { title: isAr ? "طلب موافقة على مشروع" : "Project Approval Request", desc: isAr ? "يرجى مراجعة تفاصيل المشروع والموافقة عليه." : "Please review the project details and approve." },
    { title: isAr ? "طلب موافقة على إجازة" : "Leave Approval Request", desc: isAr ? "يرجى مراجعة طلب الإجازة والموافقة عليه." : "Please review and approve the leave request." },
    { title: isAr ? "طلب موافقة على ميزانية" : "Budget Approval Request", desc: isAr ? "يرجى مراجعة الميزانية المقترحة والموافقة عليها." : "Please review and approve the proposed budget." },
    { title: isAr ? "طلب موافقة على حدث" : "Event Approval Request", desc: isAr ? "يرجى مراجعة تفاصيل الحدث والموافقة عليه." : "Please review the event details and approve." },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSend({ title, description });
    setTitle("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {isAr ? "إرسال طلب موافقة" : "Send Approval Request"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Templates */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {isAr ? "قوالب سريعة" : "Quick Templates"}
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {templates.map((t, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 text-start justify-start text-xs"
                  onClick={() => { setTitle(t.title); setDescription(t.desc); }}
                >
                  {t.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isAr ? "عنوان الطلب" : "Request Title"}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isAr ? "عنوان طلب الموافقة" : "Approval request title"}
            />
          </div>

          <div className="space-y-2">
            <Label>{isAr ? "الوصف" : "Description"}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={isAr ? "تفاصيل الطلب..." : "Request details..."}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
              <Send className="h-4 w-4 me-2" />
              {isPending ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
