import { useState, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Loader2, FileText, UserPlus, AlertCircle, ChefHat,
  Upload, ClipboardPaste, CheckCircle2, Sparkles, ArrowLeft,
} from "lucide-react";
import { CVImportHistory } from "@/components/cv-import/CVImportHistory";
import { CVPreview } from "@/components/cv-import/CVPreview";
import { getFlag } from "@/components/cv-import/types";
import { extractTextFromFile } from "@/components/cv-import/fileParser";
import type { CVData } from "@/components/cv-import/types";

interface ChefResult {
  user_id: string;
  full_name: string;
  full_name_ar?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  country_code?: string;
  job_title?: string;
  account_number?: string;
}

type Step = "search" | "input" | "preview";

export const CVImportSection = memo(function CVImportSection() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [step, setStep] = useState<Step>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ChefResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedChef, setSelectedChef] = useState<ChefResult | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // CV input state
  const [cvText, setCvText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<CVData | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  // New account creation
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    setResults([]);
    setSelectedChef(null);
    setShowCreate(false);

    try {
      const q = searchQuery.trim();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, email, phone, avatar_url, city, country_code, job_title, account_number")
        .or(`full_name.ilike.%${q}%,full_name_ar.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,account_number.ilike.%${q}%`)
        .order("full_name", { ascending: true })
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ في البحث" : "Search error", description: err.message });
    }
    setSearching(false);
  }, [searchQuery, isAr, toast]);

  const handleSelectChef = (chef: ChefResult) => {
    setSelectedChef(chef);
    setCvText("");
    setParsedData(null);
    setFileName("");
    setStep("input");
  };

  const handleCreateAccount = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast({ variant: "destructive", title: isAr ? "الاسم والبريد مطلوبان" : "Name and email are required" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: {
          action: "create",
          email: newEmail.trim(),
          full_name: newName.trim(),
          phone: newPhone.trim() || undefined,
          role: "chef",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newUserId = data?.user_id || data?.id;
      if (newUserId) {
        toast({ title: isAr ? "✅ تم إنشاء الحساب بنجاح" : "✅ Account created successfully" });
        handleSelectChef({
          user_id: newUserId,
          full_name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setCreating(false);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      toast({ variant: "destructive", title: isAr ? "نوع ملف غير مدعوم" : "Unsupported file type" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً (الحد 10MB)" : "File too large (max 10MB)" });
      return;
    }

    setFileUploading(true);
    setFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      if (text.trim().length < 30) {
        toast({
          title: isAr ? "لم نتمكن من استخراج نص كافٍ" : "Could not extract enough text",
          description: isAr ? "يرجى نسخ محتوى السيرة الذاتية ولصقه" : "Please copy and paste the CV content",
          variant: "destructive",
        });
      } else {
        setCvText(text);
        toast({ title: isAr ? `✅ تم استخراج ${text.length} حرف` : `✅ Extracted ${text.length} characters` });
      }
    } catch (err: any) {
      if (err?.message === "OLD_DOC_FORMAT") {
        toast({ variant: "destructive", title: isAr ? "صيغة .doc القديمة غير مدعومة" : "Old .doc format not supported", description: isAr ? "يرجى تحويل الملف إلى .docx أو PDF" : "Please convert to .docx or PDF" });
      } else {
        toast({ variant: "destructive", title: isAr ? "خطأ في قراءة الملف" : "Error reading file" });
      }
    }
    setFileUploading(false);
    e.target.value = "";
  }, [isAr, toast]);

  const handleParse = async () => {
    if (cvText.trim().length < 50) {
      toast({ variant: "destructive", title: isAr ? "النص قصير جداً" : "Text is too short" });
      return;
    }
    if (!selectedChef) return;

    setParsing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("parse-cv", {
        body: { cv_text: cvText, target_user_id: selectedChef.user_id },
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

  const handleGoBack = () => {
    if (step === "preview") {
      setStep("input");
    } else if (step === "input") {
      setStep("search");
      setSelectedChef(null);
      setCvText("");
      setParsedData(null);
      setFileName("");
    }
  };

  const handleImported = () => {
    toast({ title: isAr ? "✅ تم استيراد السيرة الذاتية بنجاح" : "✅ CV imported successfully" });
    setStep("search");
    setSelectedChef(null);
    setCvText("");
    setParsedData(null);
    setFileName("");
    setHistoryRefresh(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* ═══ STEP: SEARCH ═══ */}
      {step === "search" && (
        <>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                {isAr ? "استيراد السيرة الذاتية للشيف" : "Chef CV Import"}
              </CardTitle>
              <CardDescription>
                {isAr
                  ? "ابحث عن الشيف بالاسم أو البريد أو الهاتف، ثم استورد سيرته الذاتية بالذكاء الاصطناعي"
                  : "Search for chef by name, email, or phone, then import their CV with AI extraction"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="ps-9 h-11"
                    placeholder={isAr ? "ابحث بالاسم، البريد، الهاتف، أو رقم الحساب..." : "Search by name, email, phone, or account number..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2} className="gap-1.5 h-11">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isAr ? "بحث" : "Search"}
                </Button>
              </div>

              {searched && (
                <div className="space-y-2">
                  {searching ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{isAr ? "جاري البحث..." : "Searching..."}</span>
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? `تم العثور على ${results.length} نتيجة` : `Found ${results.length} result(s)`}
                      </p>
                      <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                        {results.map((chef) => (
                          <button
                            key={chef.user_id}
                            onClick={() => handleSelectChef(chef)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors text-start"
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={chef.avatar_url || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {(chef.full_name || "?")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">{chef.full_name}</span>
                                {chef.full_name_ar && chef.full_name_ar !== chef.full_name && (
                                  <span className="text-xs text-muted-foreground truncate">({chef.full_name_ar})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                {chef.account_number && <span className="font-mono">{chef.account_number}</span>}
                                {chef.email && <span className="truncate">{chef.email}</span>}
                                {chef.city && <span>{chef.country_code && getFlag(chef.country_code)} {chef.city}</span>}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <Badge variant="outline" className="text-[10px] gap-1">
                                <FileText className="h-3 w-3" />
                                {isAr ? "استيراد CV" : "Import CV"}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {isAr ? "لم يتم العثور على نتائج مطابقة" : "No matching results found"}
                      </p>
                    </div>
                  )}

                  <Separator className="my-3" />
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowCreate(!showCreate)}>
                    <UserPlus className="h-4 w-4" />
                    {isAr ? "إنشاء حساب جديد للشيف" : "Create New Chef Account"}
                  </Button>

                  {showCreate && (
                    <Card className="border-dashed">
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{isAr ? "الاسم الكامل *" : "Full Name *"}</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={isAr ? "اسم الشيف" : "Chef name"} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                            <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="chef@example.com" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
                          <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+966..." />
                        </div>
                        <Button onClick={handleCreateAccount} disabled={creating} className="w-full gap-1.5">
                          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                          {creating ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء وبدء الاستيراد" : "Create & Start Import")}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <CVImportHistory isAr={isAr} refreshTrigger={historyRefresh} />
        </>
      )}

      {/* ═══ STEP: CV INPUT ═══ */}
      {step === "input" && selectedChef && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={selectedChef.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{(selectedChef.full_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{selectedChef.full_name}</CardTitle>
                  <CardDescription className="text-[11px] truncate">
                    {selectedChef.email} {selectedChef.account_number && `• ${selectedChef.account_number}`}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                <FileText className="h-3 w-3" />
                {isAr ? "استيراد CV" : "CV Import"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <span className="text-sm text-primary hover:underline">{isAr ? "اختر ملفاً" : "choose a file"}</span>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} disabled={fileUploading} />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? "PDF, Word (.docx), TXT — الحد الأقصى 10MB" : "PDF, Word (.docx), TXT — Max 10MB"}
                  </p>
                  {fileUploading && (
                    <div className="flex items-center gap-2 text-primary justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-xs">{isAr ? "جاري استخراج النص..." : "Extracting text..."}</span>
                    </div>
                  )}
                </div>
                {cvText.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border bg-muted/30 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {fileName && <p className="text-xs font-medium truncate">{fileName}</p>}
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? `تم استخراج ${cvText.length.toLocaleString()} حرف` : `Extracted ${cvText.length.toLocaleString()} characters`}
                      </p>
                    </div>
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
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {parsing
                ? (isAr ? "جاري التحليل بالذكاء الاصطناعي..." : "Analyzing with AI...")
                : (isAr ? "تحليل السيرة الذاتية" : "Analyze CV")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP: PREVIEW ═══ */}
      {step === "preview" && parsedData && selectedChef && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={selectedChef.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{(selectedChef.full_name || "?")[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm truncate">{selectedChef.full_name}</CardTitle>
                <CardDescription className="text-[11px]">{isAr ? "مراجعة البيانات المستخرجة" : "Review extracted data"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CVPreview
              data={parsedData}
              targetUserId={selectedChef.user_id}
              isAr={isAr}
              onBack={handleGoBack}
              onSaved={handleImported}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
});
