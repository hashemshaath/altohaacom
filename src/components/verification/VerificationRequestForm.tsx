import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo, memo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubmitVerification, useMyVerificationRequests } from "@/hooks/useVerification";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Upload, Loader2, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, FormErrorSummary, SubmitButton } from "@/components/form";
import { useFormValidation, rules } from "@/hooks/useFormValidation";

const documentTypes = [
  { value: "national_id", en: "National ID", ar: "بطاقة الهوية الوطنية" },
  { value: "passport", en: "Passport", ar: "جواز السفر" },
  { value: "driving_license", en: "Driving License", ar: "رخصة القيادة" },
  { value: "professional_certificate", en: "Professional Certificate", ar: "شهادة مهنية" },
  { value: "business_license", en: "Business License", ar: "رخصة تجارية" },
  { value: "trade_registration", en: "Trade Registration", ar: "سجل تجاري" },
  { value: "association_membership", en: "Association Membership", ar: "عضوية جمعية" },
  { value: "selfie", en: "Selfie Photo", ar: "صورة شخصية" },
];

const verificationLevels = [
  { value: "basic", en: "Basic Verification", ar: "توثيق أساسي", desc: "Email & phone verified", descAr: "بريد إلكتروني وهاتف" },
  { value: "identity", en: "Identity Verification", ar: "توثيق الهوية", desc: "Government ID required", descAr: "هوية حكومية مطلوبة" },
  { value: "professional", en: "Professional Verification", ar: "توثيق مهني", desc: "Credentials & experience", descAr: "شهادات وخبرة" },
];

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; labelAr: string }> = {
  pending: { icon: Clock, color: "text-chart-4", label: "Pending", labelAr: "قيد الانتظار" },
  under_review: { icon: Clock, color: "text-chart-3", label: "Under Review", labelAr: "قيد المراجعة" },
  ai_review: { icon: AlertTriangle, color: "text-accent", label: "AI Reviewed", labelAr: "مراجعة الذكاء الاصطناعي" },
  approved: { icon: CheckCircle, color: "text-primary", label: "Approved", labelAr: "معتمد" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected", labelAr: "مرفوض" },
};

export const VerificationRequestForm = memo(function VerificationRequestForm() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = useIsAr();
  const { toast } = useToast();
  const submitMutation = useSubmitVerification();
  const { data: myRequests, isLoading: loadingRequests } = useMyVerificationRequests();

  const [level, setLevel] = useState("identity");
  const [docType, setDocType] = useState("national_id");
  const [applicantName, setApplicantName] = useState("");
  const [position, setPosition] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ type: string; url: string; name: string }>>([]);

  const fieldConfig = useMemo(() => ({
    applicantName: { rules: [rules.required(isAr ? "الاسم الكامل" : "Full Name", "الاسم الكامل"), rules.minLength(3)] },
  }), [isAr]);

  const { errors, errorList, onBlur, onChange, validateAll, getError } = useFormValidation({
    fields: fieldConfig,
    isAr,
  });

  const hasPending = myRequests?.some((r) => ["pending", "under_review", "ai_review"].includes(r.status));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const MAX_SIZE = 10 * 1024 * 1024;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: language === "ar" ? "نوع ملف غير مدعوم — يُسمح بالصور و PDF فقط" : "Unsupported file type — only images and PDF allowed" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ variant: "destructive", title: language === "ar" ? "الملف كبير جداً — الحد الأقصى 10 ميجابايت" : "File too large — max 10MB" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("verification-documents")
      .upload(path, file);

    if (error) {
      setUploading(false);
      return;
    }

    setUploadedDocs((prev) => [...prev, { type: docType, url: path, name: file.name }]);
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!validateAll({ applicantName })) return;
    submitMutation.mutate({
      entity_type: "user",
      verification_level: level,
      applicant_name: applicantName,
      applicant_position: position,
      documents: uploadedDocs,
    });
  };

  const handleChange = (value: string) => {
    setApplicantName(value);
    onChange("applicantName");
  };

  return (
    <div className="space-y-6">
      {/* Existing Requests */}
      {myRequests && myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isAr ? "طلباتي السابقة" : "My Verification Requests"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRequests.map((req) => {
              const sc = statusConfig[req.status] || statusConfig.pending;
              const Icon = sc.icon;
              return (
                <div key={req.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${sc.color}`} />
                    <div>
                      <p className="text-sm font-medium">{req.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{req.verification_level}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={sc.color}>
                    {isAr ? sc.labelAr : sc.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* New Request Form */}
      {!hasPending && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{isAr ? "طلب التوثيق" : "Request Verification"}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "قدّم طلباً للحصول على شارة التوثيق" : "Submit a request to get your verified badge"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormErrorSummary errors={errorList} />

            {/* Level Selection */}
            <div className="space-y-2">
              <FormField label={isAr ? "مستوى التوثيق" : "Verification Level"}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {verificationLevels.map((vl) => (
                    <button
                      key={vl.value}
                      type="button"
                      onClick={() => setLevel(vl.value)}
                      className={`rounded-xl border p-3 text-start transition-all ${
                        level === vl.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-medium">{isAr ? vl.ar : vl.en}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? vl.descAr : vl.desc}</p>
                    </button>
                  ))}
                </div>
              </FormField>
            </div>

            <Separator />

            {/* Applicant Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={isAr ? "الاسم الكامل" : "Full Name"} htmlFor="applicant-name" required error={getError("applicantName")}>
                <Input
                  id="applicant-name"
                  value={applicantName}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={() => onBlur("applicantName", applicantName)}
                  state={errors.applicantName ? "error" : "default"}
                />
              </FormField>
              <FormField label={isAr ? "المنصب / الوظيفة" : "Position / Role"} htmlFor="position">
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
              </FormField>
            </div>

            <Separator />

            {/* Document Upload */}
            <div className="space-y-3">
              <FormField label={isAr ? "المستندات المطلوبة" : "Supporting Documents"}>
                <div className="flex flex-wrap gap-2">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          {isAr ? dt.ar : dt.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="cursor-pointer">
                    <Input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} />
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="gap-2">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {isAr ? "رفع" : "Upload"}
                      </span>
                    </Button>
                  </label>
                </div>
              </FormField>

              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  {uploadedDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border bg-muted/50 p-2 text-xs">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{documentTypes.find((d) => d.value === doc.type)?.[isAr ? "ar" : "en"]}</span>
                      <span className="text-muted-foreground">— {doc.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SubmitButton
              loading={submitMutation.isPending}
              loadingText={isAr ? "جاري التقديم..." : "Submitting..."}
              icon={<ShieldCheck className="h-4 w-4" />}
              className="w-full"
              onClick={handleSubmit}
            >
              {isAr ? "تقديم الطلب" : "Submit Verification Request"}
            </SubmitButton>
          </CardContent>
        </Card>
      )}

      {hasPending && (
        <Card className="border-chart-4/30 bg-chart-4/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-chart-4" />
            <p className="text-sm">
              {isAr
                ? "لديك طلب توثيق قيد المراجعة. سيتم إخطارك عند اكتمال المراجعة."
                : "You have a pending verification request. You'll be notified once it's reviewed."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
