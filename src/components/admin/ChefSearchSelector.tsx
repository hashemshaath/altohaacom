import { useState, useEffect, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, User } from "lucide-react";

interface ChefSearchSelectorProps {
  value?: string; // user_id
  valueName?: string; // display name for initial render
  onChange: (userId: string, fullName: string, fullNameAr: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChefSearchSelector = memo(function ChefSearchSelector({ value, valueName, onChange, onClear, placeholder, disabled }: ChefSearchSelectorProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(valueName || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valueName) setSelectedName(valueName);
  }, [valueName]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["chef-search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, avatar_url, experience_level, specialization")
        .or(`full_name.ilike.%${search}%,full_name_ar.ilike.%${search}%`)
        .limit(15);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2 && isOpen,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value && selectedName) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm flex-1 truncate">{selectedName}</span>
        {onClear && !disabled && (
          <button type="button" onClick={() => { onClear(); setSelectedName(""); }} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || (isAr ? "ابحث عن شيف..." : "Search chef...")}
          className="ps-10"
          disabled={disabled}
        />
      </div>
      {isOpen && search.length >= 2 && (
        <Card className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto p-1 shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{isAr ? "جاري البحث..." : "Searching..."}</p>
          ) : results && results.length > 0 ? (
            results.map(chef => (
              <button
                key={chef.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start hover:bg-accent transition-colors"
                onClick={() => {
                  const displayName = isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name || "";
                  onChange(chef.user_id, chef.full_name || "", chef.full_name_ar || "");
                  setSelectedName(displayName);
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                {chef.avatar_url ? (
                  <img src={chef.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{isAr && chef.full_name_ar ? chef.full_name_ar : chef.full_name}</p>
                  <div className="flex items-center gap-2">
                    {chef.experience_level && <Badge variant="secondary" className="text-[10px] h-4">{chef.experience_level}</Badge>}
                    {chef.specialization && <span className="text-[10px] text-muted-foreground truncate">{chef.specialization}</span>}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results"}</p>
          )}
        </Card>
      )}
    </div>
  );
}
