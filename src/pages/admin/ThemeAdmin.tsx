import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Type,
  Maximize,
  Save,
  RotateCcw,
  Eye,
} from "lucide-react";

export default function ThemeAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [theme, setTheme] = useState({
    // Colors
    primaryColor: "217 91% 60%",
    accentColor: "38 92% 50%",
    
    // Typography
    fontFamily: "Inter",
    headingFont: "Playfair Display",
    baseFontSize: 16,
    
    // Layout
    maxContentWidth: 1280,
    borderRadius: 8,
    
    // Mode
    defaultMode: "system",
    allowUserToggle: true,
    
    // Branding
    logoUrl: "/altoha-logo.png",
    faviconUrl: "/favicon.ico",
    siteName: "Altoha",
    tagline: "Culinary Excellence Platform",
  });

  const presetThemes = [
    { name: "Default", primary: "217 91% 60%", accent: "38 92% 50%" },
    { name: "Ocean", primary: "199 89% 48%", accent: "173 80% 40%" },
    { name: "Forest", primary: "142 76% 36%", accent: "45 93% 47%" },
    { name: "Sunset", primary: "24 95% 53%", accent: "340 82% 52%" },
    { name: "Purple", primary: "262 83% 58%", accent: "280 65% 60%" },
    { name: "Minimal", primary: "0 0% 20%", accent: "0 0% 45%" },
  ];

  const fonts = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Poppins",
    "Montserrat",
    "Source Sans Pro",
  ];

  const headingFonts = [
    "Playfair Display",
    "Merriweather",
    "Lora",
    "Crimson Text",
    "Libre Baskerville",
    "Cormorant Garamond",
  ];

  const handleSave = () => {
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات المظهر" : "Theme settings saved",
    });
  };

  const handleReset = () => {
    setTheme({
      primaryColor: "217 91% 60%",
      accentColor: "38 92% 50%",
      fontFamily: "Inter",
      headingFont: "Playfair Display",
      baseFontSize: 16,
      maxContentWidth: 1280,
      borderRadius: 8,
      defaultMode: "system",
      allowUserToggle: true,
      logoUrl: "/altoha-logo.png",
      faviconUrl: "/favicon.ico",
      siteName: "Altoha",
      tagline: "Culinary Excellence Platform",
    });
    toast({
      title: language === "ar" ? "تمت الإعادة" : "Reset",
      description: language === "ar" ? "تمت إعادة المظهر للإعدادات الافتراضية" : "Theme reset to defaults",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "المظهر والألوان" : "Theme & Colors"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تخصيص مظهر المنصة" : "Customize platform appearance"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="me-2 h-4 w-4" />
            {language === "ar" ? "إعادة" : "Reset"}
          </Button>
          <Button onClick={handleSave}>
            <Save className="me-2 h-4 w-4" />
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            {language === "ar" ? "الألوان" : "Colors"}
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            {language === "ar" ? "الخطوط" : "Typography"}
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Maximize className="h-4 w-4" />
            {language === "ar" ? "التخطيط" : "Layout"}
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Eye className="h-4 w-4" />
            {language === "ar" ? "الهوية" : "Branding"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6 space-y-6">
          {/* Preset Themes */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "سمات جاهزة" : "Preset Themes"}</CardTitle>
              <CardDescription>
                {language === "ar" ? "اختر من السمات المحددة مسبقاً" : "Choose from predefined themes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {presetThemes.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setTheme({
                      ...theme,
                      primaryColor: preset.primary,
                      accentColor: preset.accent,
                    })}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary ${
                      theme.primaryColor === preset.primary ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex gap-1">
                      <div 
                        className="h-6 w-6 rounded-full" 
                        style={{ backgroundColor: `hsl(${preset.primary})` }}
                      />
                      <div 
                        className="h-6 w-6 rounded-full" 
                        style={{ backgroundColor: `hsl(${preset.accent})` }}
                      />
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "ألوان مخصصة" : "Custom Colors"}</CardTitle>
              <CardDescription>
                {language === "ar" ? "تخصيص الألوان بشكل يدوي" : "Manually customize colors"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اللون الأساسي (HSL)" : "Primary Color (HSL)"}</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-md border" 
                      style={{ backgroundColor: `hsl(${theme.primaryColor})` }}
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      placeholder="217 91% 60%"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "لون التمييز (HSL)" : "Accent Color (HSL)"}</Label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-md border" 
                      style={{ backgroundColor: `hsl(${theme.accentColor})` }}
                    />
                    <Input
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      placeholder="38 92% 50%"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dark Mode */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "الوضع الداكن" : "Dark Mode"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الوضع الافتراضي" : "Default Mode"}</Label>
                <Select value={theme.defaultMode} onValueChange={(v) => setTheme({ ...theme, defaultMode: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        {language === "ar" ? "فاتح" : "Light"}
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        {language === "ar" ? "داكن" : "Dark"}
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        {language === "ar" ? "النظام" : "System"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{language === "ar" ? "السماح بالتبديل" : "Allow User Toggle"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "السماح للمستخدمين بتغيير الوضع" : "Let users switch between modes"}
                  </p>
                </div>
                <Switch
                  checked={theme.allowUserToggle}
                  onCheckedChange={(checked) => setTheme({ ...theme, allowUserToggle: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "الخطوط" : "Fonts"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "خط النص" : "Body Font"}</Label>
                  <Select value={theme.fontFamily} onValueChange={(v) => setTheme({ ...theme, fontFamily: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "خط العناوين" : "Heading Font"}</Label>
                  <Select value={theme.headingFont} onValueChange={(v) => setTheme({ ...theme, headingFont: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {headingFonts.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{language === "ar" ? "حجم الخط الأساسي" : "Base Font Size"}</Label>
                  <span className="text-sm text-muted-foreground">{theme.baseFontSize}px</span>
                </div>
                <Slider
                  value={[theme.baseFontSize]}
                  onValueChange={([v]) => setTheme({ ...theme, baseFontSize: v })}
                  min={12}
                  max={20}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "التخطيط" : "Layout"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{language === "ar" ? "أقصى عرض للمحتوى" : "Max Content Width"}</Label>
                  <span className="text-sm text-muted-foreground">{theme.maxContentWidth}px</span>
                </div>
                <Slider
                  value={[theme.maxContentWidth]}
                  onValueChange={([v]) => setTheme({ ...theme, maxContentWidth: v })}
                  min={960}
                  max={1600}
                  step={40}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{language === "ar" ? "استدارة الحواف" : "Border Radius"}</Label>
                  <span className="text-sm text-muted-foreground">{theme.borderRadius}px</span>
                </div>
                <Slider
                  value={[theme.borderRadius]}
                  onValueChange={([v]) => setTheme({ ...theme, borderRadius: v })}
                  min={0}
                  max={24}
                  step={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "الهوية البصرية" : "Branding"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم الموقع" : "Site Name"}</Label>
                  <Input
                    value={theme.siteName}
                    onChange={(e) => setTheme({ ...theme, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الشعار" : "Tagline"}</Label>
                  <Input
                    value={theme.tagline}
                    onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط الشعار" : "Logo URL"}</Label>
                  <Input
                    value={theme.logoUrl}
                    onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط الأيقونة" : "Favicon URL"}</Label>
                  <Input
                    value={theme.faviconUrl}
                    onChange={(e) => setTheme({ ...theme, faviconUrl: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
