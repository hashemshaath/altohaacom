import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail } from "lucide-react";

interface SupplierContactFormProps {
  companyId: string;
  companyName: string;
}

export function SupplierContactForm({ companyId, companyName }: SupplierContactFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    if (!user) {
      toast({ title: isAr ? "يجب تسجيل الدخول أولاً" : "Please log in first", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("company_communications").insert({
        company_id: companyId,
        subject: subject || `Inquiry from ${name}`,
        message: `From: ${name} (${email})\n\n${message}`,
        sender_id: user.id,
        direction: "inbound",
        status: "unread",
      });
      if (error) throw error;

      // Trigger notification to company
      import("@/lib/notificationTriggers").then(({ notifySupplierInquiry }) => {
        notifySupplierInquiry({
          companyId,
          senderName: name,
          subject: subject || `Inquiry from ${name}`,
        });
      });

      toast({ title: isAr ? "تم إرسال رسالتك بنجاح" : "Message sent successfully" });
      setName("");
      setSubject("");
      setMessage("");
    } catch {
      toast({ title: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-primary" />
          {isAr ? `تواصل مع ${companyName}` : `Contact ${companyName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "الاسم" : "Name"}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required placeholder={isAr ? "اسمك" : "Your name"} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@example.com" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "الموضوع" : "Subject"}</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder={isAr ? "موضوع الرسالة" : "Message subject"} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isAr ? "الرسالة" : "Message"}</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4} placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."} />
          </div>
          <Button type="submit" disabled={sending || !user} className="w-full">
            <Send className="me-2 h-4 w-4" />
            {sending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send Message")}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              {isAr ? "يجب تسجيل الدخول لإرسال رسالة" : "You must be logged in to send a message"}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
