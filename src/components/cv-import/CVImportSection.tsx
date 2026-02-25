import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search, Loader2, FileText, Upload, ClipboardPaste, Sparkles,
  UserPlus, CheckCircle2, User, ChefHat, AlertCircle,
} from "lucide-react";
import { extractTextFromFile } from "@/components/cv-import/fileParser";
import { CVImportDialog } from "@/components/cv-import/CVImportDialog";
import { getFlag } from "@/components/cv-import/types";

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

export function CVImportSection() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ChefResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedChef, setSelectedChef] = useState<ChefResult | null>(null);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);

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
      // Search profiles by name (English and Arabic), email, or phone
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
    setCvDialogOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast({ variant: "destructive", title: isAr ? "الاسم والبريد مطلوبان" : "Name and email are required" });
      return;
    }
    setCreating(true);
    try {
      // Create user via admin function
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
        setSelectedChef({
          user_id: newUserId,
          full_name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
        });
        setCvDialogOpen(true);
        setShowCreate(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Search for Chef */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            {isAr ? "استيراد السيرة الذاتية للشيف" : "Chef CV Import"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "ابحث عن الشيف بالاسم أو البريد أو الهاتف، ثم استورد سيرته الذاتية"
              : "Search for chef by name, email, or phone, then import their CV"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
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

          {/* Results */}
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
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors text-start"
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
                            {chef.city && (
                              <span>
                                {chef.country_code && getFlag(chef.country_code)} {chef.city}
                              </span>
                            )}
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

              {/* Create New Account Button */}
              <Separator className="my-3" />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCreate(!showCreate)}
              >
                <UserPlus className="h-4 w-4" />
                {isAr ? "إنشاء حساب جديد للشيف" : "Create New Chef Account"}
              </Button>

              {/* Create New Account Form */}
              {showCreate && (
                <Card className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "الاسم الكامل *" : "Full Name *"}</Label>
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={isAr ? "اسم الشيف" : "Chef name"}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="chef@example.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}</Label>
                      <Input
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+966..."
                      />
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

      {/* CV Import Dialog */}
      {selectedChef && (
        <CVImportDialog
          open={cvDialogOpen}
          onOpenChange={setCvDialogOpen}
          targetUserId={selectedChef.user_id}
          isAr={isAr}
          onImported={() => {
            toast({ title: isAr ? "✅ تم استيراد السيرة الذاتية بنجاح" : "✅ CV imported successfully" });
            setSelectedChef(null);
          }}
        />
      )}
    </div>
  );
}
