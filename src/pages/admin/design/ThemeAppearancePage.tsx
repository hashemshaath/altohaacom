import { useIsAr } from "@/hooks/useIsAr";
import { Palette, Type, Moon, Sun, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ThemePresetsPanel } from "@/components/admin/settings/ThemePresetsPanel";
import { TypographySettings } from "@/components/admin/settings/TypographySettings";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

const DARK_MODE_OPTIONS = [
  { id: "light", icon: Sun, labelEn: "Light", labelAr: "فاتح", descEn: "Always use light mode", descAr: "استخدام الوضع الفاتح دائمًا" },
  { id: "dark", icon: Moon, labelEn: "Dark", labelAr: "داكن", descEn: "Always use dark mode", descAr: "استخدام الوضع الداكن دائمًا" },
  { id: "system", icon: Monitor, labelEn: "System", labelAr: "تلقائي", descEn: "Follow system preference", descAr: "اتباع إعداد النظام" },
] as const;

export default function ThemeAppearancePage() {
  const isAr = useIsAr();
  const { settings, isLoading, saveSetting } = useSiteSettings();
  const { theme, setTheme } = useTheme();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Palette}
        title={isAr ? "المظهر والثيم" : "Theme & Appearance"}
        description={isAr ? "تخصيص الألوان والخطوط ووضع العرض للمنصة" : "Customize colors, fonts, and display mode for the platform"}
      />

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="w-full flex h-auto gap-1 bg-muted/50 p-1 rounded-2xl">
          <TabsTrigger value="colors" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Palette className="h-3.5 w-3.5" />
            {isAr ? "الألوان والثيم" : "Colors & Theme"}
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Type className="h-3.5 w-3.5" />
            {isAr ? "الخطوط" : "Typography"}
          </TabsTrigger>
          <TabsTrigger value="mode" className="text-xs gap-1.5 flex-1 rounded-xl data-[state=active]:shadow-sm">
            <Moon className="h-3.5 w-3.5" />
            {isAr ? "وضع العرض" : "Display Mode"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4">
          <ThemePresetsPanel settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </TabsContent>

        <TabsContent value="typography" className="mt-4">
          <TypographySettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
        </TabsContent>

        <TabsContent value="mode" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="h-4.5 w-4.5 text-primary" />
                {isAr ? "وضع العرض" : "Display Mode"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? "اختر بين الوضع الفاتح أو الداكن أو التلقائي" : "Choose between light, dark, or system-based display mode"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DARK_MODE_OPTIONS.map((opt) => {
                  const isActive = theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-sm",
                        isActive
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{isAr ? opt.labelAr : opt.labelEn}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isAr ? opt.descAr : opt.descEn}</p>
                      </div>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">
                          {isAr ? "نشط" : "Active"}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
