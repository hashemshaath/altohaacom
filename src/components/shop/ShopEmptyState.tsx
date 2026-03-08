import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { ShoppingBag } from "lucide-react";

interface ShopEmptyStateProps {
  search: string;
  onClearSearch: () => void;
}

export function ShopEmptyState({ search, onClearSearch }: ShopEmptyStateProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-2xl bg-muted/60 p-5">
        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isAr ? "لا توجد منتجات" : "No products found"}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {search
          ? (isAr ? "جرّب كلمات بحث مختلفة" : "Try different search terms")
          : (isAr ? "لا توجد منتجات متاحة حالياً" : "No products available yet")}
      </p>
      {search && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearSearch}>
          {isAr ? "مسح البحث" : "Clear search"}
        </Button>
      )}
    </div>
  );
}
