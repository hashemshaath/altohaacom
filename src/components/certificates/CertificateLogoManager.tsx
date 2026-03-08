import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Image, Library } from "lucide-react";
import type { LogoItem } from "./types";

interface CertificateLogoManagerProps {
  logos: LogoItem[];
  onChange: (logos: LogoItem[]) => void;
}

const positionLabels: Record<LogoItem["position"], { en: string; ar: string }> = {
  "header-left": { en: "Header Left", ar: "رأس يسار" },
  "header-center": { en: "Header Center", ar: "رأس وسط" },
  "header-right": { en: "Header Right", ar: "رأس يمين" },
  "footer-left": { en: "Footer Left", ar: "تذييل يسار" },
  "footer-center": { en: "Footer Center", ar: "تذييل وسط" },
  "footer-right": { en: "Footer Right", ar: "تذييل يمين" },
};

export const CertificateLogoManager = memo(function CertificateLogoManager({ logos, onChange }: CertificateLogoManagerProps) {
  const { language } = useLanguage();

  // Fetch logo library from database
  const { data: logoLibrary = [] } = useQuery({
    queryKey: ["certificate-logos-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificate_logos")
        .select("id, name, name_ar, logo_url, organization, is_sponsor, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addLogo = (position: LogoItem["position"]) => {
    const newLogo: LogoItem = {
      id: Date.now().toString(),
      name: "Logo",
      url: "",
      position,
      width: 70,
      height: 70,
      order: logos.filter(l => l.position === position).length,
    };
    onChange([...logos, newLogo]);
  };

  const addFromLibrary = (libraryLogo: typeof logoLibrary[0], position: LogoItem["position"]) => {
    const newLogo: LogoItem = {
      id: Date.now().toString(),
      name: language === "ar" && libraryLogo.name_ar ? libraryLogo.name_ar : libraryLogo.name,
      url: libraryLogo.logo_url,
      position,
      width: 70,
      height: 70,
      order: logos.filter(l => l.position === position).length,
      sourceId: libraryLogo.id,
    };
    onChange([...logos, newLogo]);
  };

  const updateLogo = (id: string, updates: Partial<LogoItem>) => {
    onChange(logos.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLogo = (id: string) => {
    onChange(logos.filter(l => l.id !== id));
  };

  const positions: LogoItem["position"][] = ["header-left", "header-center", "header-right", "footer-left", "footer-center", "footer-right"];

  return (
    <div className="space-y-3">
      {/* Logo Library */}
      {logoLibrary.length > 0 && (
        <>
          <div className="flex items-center gap-1.5">
            <Library className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">{language === "ar" ? "مكتبة الشعارات" : "Logo Library"}</Label>
          </div>
          <ScrollArea className="max-h-[120px]">
            <div className="grid grid-cols-4 gap-2">
              {logoLibrary.map(lib => (
                <div
                  key={lib.id}
                  className="relative group border rounded p-1.5 hover:border-primary transition-colors cursor-pointer"
                  title={language === "ar" && lib.name_ar ? lib.name_ar : lib.name}
                >
                  <img src={lib.logo_url} alt={lib.name} className="w-full h-10 object-contain" loading="lazy" />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Select onValueChange={pos => addFromLibrary(lib, pos as LogoItem["position"])}>
                      <SelectTrigger className="h-6 text-[9px] w-full border-0 bg-transparent">
                        <Plus className="h-3 w-3" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(p => (
                          <SelectItem key={p} value={p} className="text-xs">
                            {language === "ar" ? positionLabels[p].ar : positionLabels[p].en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground truncate mt-1">
                    {language === "ar" && lib.name_ar ? lib.name_ar : lib.name}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
        </>
      )}

      {/* Positioned Logos */}
      <Label className="text-sm font-medium">{language === "ar" ? "الشعارات الموضوعة" : "Placed Logos"}</Label>

      {positions.map(pos => {
        const posLogos = logos.filter(l => l.position === pos);
        if (posLogos.length === 0) return null;
        return (
          <div key={pos} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[9px]">
                {language === "ar" ? positionLabels[pos].ar : positionLabels[pos].en}
              </Badge>
            </div>
            {posLogos.map(logo => (
              <div key={logo.id} className="flex items-center gap-1.5 p-2 border rounded text-xs">
                {logo.url ? (
                  <img src={logo.url} alt="" className="w-8 h-8 object-contain rounded shrink-0" loading="lazy" />
                ) : (
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={language === "ar" ? "رابط الشعار" : "Logo URL"}
                    value={logo.url}
                    onChange={e => updateLogo(logo.id, { url: e.target.value })}
                    className="text-xs h-7"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center gap-1">
                      <Label className="text-[9px] shrink-0">W:</Label>
                      <Slider value={[logo.width]} onValueChange={([v]) => updateLogo(logo.id, { width: v })} min={20} max={150} step={5} />
                      <span className="text-[9px] w-6 text-end">{logo.width}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Label className="text-[9px] shrink-0">H:</Label>
                      <Slider value={[logo.height]} onValueChange={([v]) => updateLogo(logo.id, { height: v })} min={20} max={150} step={5} />
                      <span className="text-[9px] w-6 text-end">{logo.height}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeLogo(logo.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add Logo Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        {positions.map(pos => (
          <Button key={pos} variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => addLogo(pos)}>
            <Plus className="h-3 w-3 me-0.5" />
            {language === "ar" ? positionLabels[pos].ar : positionLabels[pos].en}
          </Button>
        ))}
      </div>
    </div>
  );
}
