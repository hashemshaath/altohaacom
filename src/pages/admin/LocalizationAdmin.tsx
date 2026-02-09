import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Save,
  Plus,
  Search,
  Languages,
  Check,
} from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  enabled: boolean;
  default: boolean;
}

const defaultLanguages: Language[] = [
  { code: "en", name: "English", nativeName: "English", rtl: false, enabled: true, default: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true, enabled: true, default: false },
  { code: "fr", name: "French", nativeName: "Français", rtl: false, enabled: false, default: false },
  { code: "es", name: "Spanish", nativeName: "Español", rtl: false, enabled: false, default: false },
  { code: "de", name: "German", nativeName: "Deutsch", rtl: false, enabled: false, default: false },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", rtl: false, enabled: false, default: false },
];

const sampleTranslations = [
  { key: "welcome", en: "Welcome", ar: "مرحباً" },
  { key: "competitions", en: "Competitions", ar: "المسابقات" },
  { key: "dashboard", en: "Dashboard", ar: "لوحة التحكم" },
  { key: "profile", en: "Profile", ar: "الملف الشخصي" },
  { key: "settings", en: "Settings", ar: "الإعدادات" },
  { key: "logout", en: "Logout", ar: "تسجيل الخروج" },
  { key: "login", en: "Login", ar: "تسجيل الدخول" },
  { key: "signup", en: "Sign Up", ar: "إنشاء حساب" },
  { key: "submit", en: "Submit", ar: "إرسال" },
  { key: "cancel", en: "Cancel", ar: "إلغاء" },
];

export default function LocalizationAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [languages, setLanguages] = useState(defaultLanguages);
  const [translations, setTranslations] = useState(sampleTranslations);
  const [search, setSearch] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleToggleLanguage = (code: string) => {
    setLanguages(prev => prev.map(lang => 
      lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
    ));
  };

  const handleSetDefault = (code: string) => {
    setLanguages(prev => prev.map(lang => ({
      ...lang,
      default: lang.code === code,
      enabled: lang.code === code ? true : lang.enabled,
    })));
  };

  const handleUpdateTranslation = (key: string, langCode: string, value: string) => {
    setTranslations(prev => prev.map(t => 
      t.key === key ? { ...t, [langCode]: value } : t
    ));
  };

  const handleSave = () => {
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات اللغة" : "Localization settings saved",
    });
  };

  const filteredTranslations = translations.filter(t => 
    t.key.toLowerCase().includes(search.toLowerCase()) ||
    t.en.toLowerCase().includes(search.toLowerCase()) ||
    t.ar.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إدارة اللغات" : "Localization Management"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة اللغات والترجمات" : "Manage languages and translations"}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {language === "ar" ? "حفظ" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="languages">
        <TabsList>
          <TabsTrigger value="languages" className="gap-2">
            <Globe className="h-4 w-4" />
            {language === "ar" ? "اللغات" : "Languages"}
          </TabsTrigger>
          <TabsTrigger value="translations" className="gap-2">
            <Languages className="h-4 w-4" />
            {language === "ar" ? "الترجمات" : "Translations"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="languages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "اللغات المتاحة" : "Available Languages"}</CardTitle>
              <CardDescription>
                {language === "ar" 
                  ? "تفعيل وتعطيل اللغات المتاحة للمستخدمين" 
                  : "Enable or disable languages available to users"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {languages.map((lang) => (
                  <div 
                    key={lang.code}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      lang.enabled ? "" : "bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                        {lang.code.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lang.name}</p>
                          {lang.default && (
                            <Badge variant="default" className="text-xs">
                              {language === "ar" ? "افتراضي" : "Default"}
                            </Badge>
                          )}
                          {lang.rtl && (
                            <Badge variant="outline" className="text-xs">RTL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lang.enabled && !lang.default && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSetDefault(lang.code)}
                        >
                          {language === "ar" ? "افتراضي" : "Set Default"}
                        </Button>
                      )}
                      <Switch
                        checked={lang.enabled}
                        onCheckedChange={() => handleToggleLanguage(lang.code)}
                        disabled={lang.default}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "الترجمات" : "Translations"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "تعديل ترجمات النظام" : "Edit system translations"}
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "مفتاح جديد" : "Add Key"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث في الترجمات..." : "Search translations..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{language === "ar" ? "المفتاح" : "Key"}</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>العربية</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((t) => (
                    <TableRow key={t.key}>
                      <TableCell className="font-mono text-sm">{t.key}</TableCell>
                      <TableCell>
                        {editingKey === t.key ? (
                          <Input
                            value={t.en}
                            onChange={(e) => handleUpdateTranslation(t.key, "en", e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span onClick={() => setEditingKey(t.key)} className="cursor-pointer hover:bg-muted px-2 py-1 rounded">
                            {t.en}
                          </span>
                        )}
                      </TableCell>
                      <TableCell dir="rtl">
                        {editingKey === t.key ? (
                          <Input
                            dir="rtl"
                            value={t.ar}
                            onChange={(e) => handleUpdateTranslation(t.key, "ar", e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span onClick={() => setEditingKey(t.key)} className="cursor-pointer hover:bg-muted px-2 py-1 rounded">
                            {t.ar}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingKey === t.key && (
                          <Button size="icon" variant="ghost" onClick={() => setEditingKey(null)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
