import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail } from "lucide-react";
import { FormField, FormErrorSummary, SubmitButton } from "@/components/form";
import { useFormValidation, rules } from "@/hooks/useFormValidation";

interface SupplierContactFormProps {
  companyId: string;
  companyName: string;
}

export const SupplierContactForm = memo(function SupplierContactForm({ companyId, companyName }: SupplierContactFormProps) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fieldConfig = useMemo(() => ({
    name: { rules: [rules.required(isAr ? "الاسم" : "Name", "الاسم"), rules.maxLength(100)] },
    email: { rules: [rules.required(isAr ? "البريد" : "Email", "البريد"), rules.email()] },
    subject: { rules: [rules.maxLength(200)] },
    message: { rules: [rules.required(isAr ? "الرسالة" : "Message", "الرسالة"), rules.minLength(5), rules.maxLength(1000)] },
  }), [isAr]);

  const { errors, errorList, onBlur, onChange, validateAll, resetErrors, getError } = useFormValidation({
    fields: fieldConfig,
    isAr,
  });

  const values = useMemo(() => ({ name, email, subject, message }), [name, email, subject, message]);

  const handleChange = (field: keyof typeof values, value: string) => {
    if (field === "name") setName(value);
    else if (field === "email") setEmail(value);
    else if (field === "subject") setSubject(value);
    else setMessage(value);
    onChange(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll(values)) return;
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
      resetErrors();
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
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <FormErrorSummary errors={errorList} />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={isAr ? "الاسم" : "Name"} htmlFor="supplier-name" required error={getError("name")}>
              <Input
                id="supplier-name"
                value={name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => onBlur("name", name)}
                state={errors.name ? "error" : "default"}
                placeholder={isAr ? "اسمك" : "Your name"}
              />
            </FormField>
            <FormField label={isAr ? "البريد الإلكتروني" : "Email"} htmlFor="supplier-email" required error={getError("email")}>
              <Input
                id="supplier-email"
                type="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => onBlur("email", email)}
                state={errors.email ? "error" : "default"}
                placeholder="email@example.com"
              />
            </FormField>
          </div>

          <FormField label={isAr ? "الموضوع" : "Subject"} htmlFor="supplier-subject" error={getError("subject")}>
            <Input
              id="supplier-subject"
              value={subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              onBlur={() => onBlur("subject", subject)}
              state={errors.subject ? "error" : "default"}
              placeholder={isAr ? "موضوع الرسالة" : "Message subject"}
            />
          </FormField>

          <FormField label={isAr ? "الرسالة" : "Message"} htmlFor="supplier-message" required error={getError("message")}>
            <Textarea
              id="supplier-message"
              value={message}
              onChange={(e) => handleChange("message", e.target.value)}
              onBlur={() => onBlur("message", message)}
              state={errors.message ? "error" : "default"}
              rows={4}
              maxCharacters={1000}
              placeholder={isAr ? "اكتب رسالتك..." : "Write your message..."}
            />
          </FormField>

          <SubmitButton
            loading={sending}
            disabled={!user}
            loadingText={isAr ? "جاري الإرسال..." : "Sending..."}
            icon={<Send className="h-4 w-4" />}
            className="w-full"
          >
            {isAr ? "إرسال" : "Send Message"}
          </SubmitButton>

          {!user && (
            <p className="text-xs text-muted-foreground text-center">
              {isAr ? "يجب تسجيل الدخول لإرسال رسالة" : "You must be logged in to send a message"}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
});
