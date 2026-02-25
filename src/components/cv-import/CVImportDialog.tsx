import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Loader2, Sparkles, ClipboardPaste } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CVData } from "./types";
import { CVPreview } from "./CVPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  isAr: boolean;
  onImported: () => void;
}

export function CVImportDialog({ open, onOpenChange, targetUserId, isAr, onImported }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "preview">("input");
  const [cvText, setCvText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<CVData | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt")) {
      toast({ variant: "destructive", title: isAr ? "نوع ملف غير مدعوم" : "Unsupported file type" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً (الحد 5MB)" : "File too large (max 5MB)" });
      return;
    }

    setFileUploading(true);
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setCvText(text);
      } else {
        // For PDF/DOCX, read as text (basic extraction)
        const text = await file.text();
        if (text.trim().length > 50) {
          setCvText(text);
        } else {
          toast({
            title: isAr ? "لم نتمكن من قراءة الملف" : "Could not read file",
            description: isAr
              ? "يرجى نسخ محتوى السيرة الذاتية ولصقه في حقل النص"
              : "Please copy and paste the CV content into the text field",
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ في قراءة الملف" : "Error reading file" });
    }
    setFileUploading(false);
    e.target.value = "";
  }, [isAr, toast]);

  const handleParse = async () => {
    if (cvText.trim().length < 50) {
      toast({ variant: "destructive", title: isAr ? "النص قصير جداً" : "Text is too short" });
      return;
    }

    setParsing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cv_text: cvText, target_user_id: targetUserId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setParsedData(data.data as CVData);
      setStep("preview");
      toast({ title: isAr ? "تم تحليل السيرة الذاتية بنجاح ✨" : "CV parsed successfully ✨" });
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في التحليل" : "Parsing error", description: err.message });
    }
    setParsing(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("input");
      setCvText("");
      setParsedData(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isAr ? "استيراد السيرة الذاتية" : "Import CV / Resume"}
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? "ارفع ملف السيرة الذاتية أو الصق محتواها لاستخراج البيانات تلقائياً بالذكاء الاصطناعي"
                : "Upload your CV file or paste its content to automatically extract data using AI"}
            </p>

            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="paste" className="flex-1 gap-1.5">
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  {isAr ? "لصق النص" : "Paste Text"}
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1 gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {isAr ? "رفع ملف" : "Upload File"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="space-y-3 mt-3">
                <Label>{isAr ? "محتوى السيرة الذاتية" : "CV Content"}</Label>
                <Textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder={isAr
                    ? "الصق محتوى السيرة الذاتية هنا...\n\nيدعم العربية والإنجليزية"
                    : "Paste your CV content here...\n\nSupports Arabic and English"}
                  className="min-h-[300px] text-sm"
                  dir="auto"
                />
                <p className="text-[10px] text-muted-foreground">
                  {cvText.length > 0 ? `${cvText.length} ${isAr ? "حرف" : "characters"}` : ""}
                </p>
              </TabsContent>

              <TabsContent value="upload" className="mt-3">
                <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3 hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{isAr ? "اسحب الملف هنا أو" : "Drag file here or"}</p>
                    <label className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        {isAr ? "اختر ملفاً" : "choose a file"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        disabled={fileUploading}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? "PDF, Word, TXT — الحد الأقصى 5MB" : "PDF, Word, TXT — Max 5MB"}
                  </p>
                  {fileUploading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />}
                </div>
                {cvText.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                      {isAr ? `✅ تم تحميل ${cvText.length} حرف` : `✅ Loaded ${cvText.length} characters`}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleParse}
              disabled={parsing || cvText.trim().length < 50}
              className="w-full gap-2"
              size="lg"
            >
              {parsing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {parsing
                ? (isAr ? "جاري التحليل بالذكاء الاصطناعي..." : "Analyzing with AI...")
                : (isAr ? "تحليل السيرة الذاتية" : "Analyze CV")}
            </Button>
          </div>
        )}

        {step === "preview" && parsedData && (
          <CVPreview
            data={parsedData}
            targetUserId={targetUserId}
            isAr={isAr}
            onBack={() => setStep("input")}
            onSaved={() => {
              onImported();
              handleClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
