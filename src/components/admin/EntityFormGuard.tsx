import { useState, useEffect, memo, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEntityDedup } from "@/hooks/useEntityDedup";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { DeduplicationPanel } from "@/components/admin/DeduplicationPanel";
import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EntityInput {
  name?: string;
  name_ar?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  country?: string;
}

interface TranslationField {
  en: string | null;
  ar: string | null;
  key: string;
}

interface EntityFormGuardProps {
  /** Current form entity data for dedup checking */
  entity: EntityInput;
  /** Which tables to check against */
  tables?: string[];
  /** Exclude this ID (when editing existing record) */
  excludeId?: string;
  /** Translation fields to auto-translate */
  translationFields?: TranslationField[];
  /** Context for translation (e.g. "company / business") */
  translationContext?: string;
  /** Called with translated field updates */
  onTranslated?: (updates: Record<string, string>) => void;
  /** Show auto-translate button */
  showTranslate?: boolean;
}

/**
 * Drop-in component for any admin entity form.
 * Provides real-time dedup checking + auto-translate button.
 * Usage:
 * ```tsx
 * <EntityFormGuard
 *   entity={{ name: form.name, email: form.email, ... }}
 *   tables={["companies", "organizers"]}
 *   excludeId={editId}
 *   translationFields={[{ en: form.name, ar: form.name_ar, key: "name" }]}
 *   onTranslated={(updates) => setForm(f => ({ ...f, ...updates }))}
 *   showTranslate
 * />
 * ```
 */
export const EntityFormGuard = memo(function EntityFormGuard({
  entity,
  tables,
  excludeId,
  translationFields,
  translationContext,
  onTranslated,
  showTranslate = true,
}: EntityFormGuardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { checking, duplicates, checkEntity, clearDuplicates } = useEntityDedup({
    tables: tables || ["organizers", "companies", "culinary_entities", "establishments"],
    excludeId,
  });

  const { autoTranslateFields } = useAutoTranslate();
  const [translating, setTranslating] = useState(false);

  // Debounced dedup check
  useEffect(() => {
    if (!entity.name && !entity.email) return;
    const timer = setTimeout(() => {
      checkEntity(entity);
    }, 800);
    return () => clearTimeout(timer);
  }, [entity.name, entity.email, entity.website]);

  const handleTranslate = useCallback(async () => {
    if (!translationFields?.length || !onTranslated) return;
    setTranslating(true);
    try {
      const updates = await autoTranslateFields(translationFields, translationContext);
      if (Object.keys(updates).length > 0) {
        onTranslated(updates);
        toast.success(isAr ? "تمت الترجمة التلقائية" : "Auto-translated");
      } else {
        toast.info(isAr ? "لا حاجة للترجمة" : "Nothing to translate");
      }
    } catch {
      toast.error(isAr ? "فشلت الترجمة" : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }, [translationFields, translationContext, autoTranslateFields, onTranslated, isAr]);

  return (
    <div className="space-y-3">
      <DeduplicationPanel
        duplicates={duplicates}
        checking={checking}
        onDismiss={clearDuplicates}
        compact
      />

      {showTranslate && translationFields?.length && onTranslated && (
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={handleTranslate}
          disabled={translating}
        >
          {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
          {translating ? "..." : (isAr ? "ترجمة تلقائية" : "Auto-Translate")}
        </Button>
      )}
    </div>
  );
});
