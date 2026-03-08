import { useState, memo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2 } from "lucide-react";

interface Suggestion {
  name: string;
  name_ar: string;
  quantity: number;
  unit: string;
  estimated_cost: number;
  priority: string;
  category: string;
}

interface Props {
  competitionId: string;
  listId: string;
  listCategory: string;
  existingItemNames: string[];
  onItemsAdded: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/10 text-primary",
  high: "bg-chart-4/10 text-chart-4",
  critical: "bg-destructive/10 text-destructive",
};

export const AIRequirementsSuggest = memo(function AIRequirementsSuggest({ competitionId, listId, listCategory, existingItemNames, onItemsAdded }: Props) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchSuggestions = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-requirements", {
        body: {
          competitionType: "culinary",
          category: listCategory,
          language,
          existingItems: existingItemNames,
        },
      });
      if (error) throw error;
      return data as { suggestions: Suggestion[] };
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      setSelected(new Set((data.suggestions || []).map((_: Suggestion, i: number) => i)));
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Error", description: e.message });
    },
  });

  const addSelectedMutation = useMutation({
    mutationFn: async () => {
      const items = suggestions
        .filter((_, i) => selected.has(i))
        .map((s) => ({
          list_id: listId,
          custom_name: s.name,
          custom_name_ar: s.name_ar,
          quantity: s.quantity,
          unit: s.unit,
          estimated_cost: s.estimated_cost,
          priority: s.priority,
          status: "pending",
        }));
      if (items.length === 0) return;
      const { error } = await supabase.from("requirement_list_items").insert(items as any);
      if (error) throw error;
    },
    onSuccess: () => {
      onItemsAdded();
      setOpen(false);
      setSuggestions([]);
      setSelected(new Set());
      toast({ title: language === "ar" ? "تمت إضافة العناصر المقترحة" : "AI suggestions added" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Error", description: e.message });
    },
  });

  const toggleItem = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="me-2 h-4 w-4" />
          {language === "ar" ? "اقتراحات الذكاء الاصطناعي" : "AI Suggest"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === "ar" ? "اقتراحات الذكاء الاصطناعي" : "AI Requirement Suggestions"}
          </DialogTitle>
        </DialogHeader>

        {fetchSuggestions.isPending ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "جاري التفكير في الاقتراحات..." : "Generating suggestions..."}
            </p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {language === "ar" ? "لا توجد اقتراحات" : "No suggestions available"}
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {suggestions.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(i)}
                  >
                    <Checkbox checked={selected.has(i)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {language === "ar" ? item.name_ar : item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit} · ${item.estimated_cost}
                      </p>
                    </div>
                    <Badge variant="outline" className={PRIORITY_COLORS[item.priority] || ""}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {selected.size} {language === "ar" ? "عنصر محدد" : "selected"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchSuggestions.mutate()}>
                  {language === "ar" ? "إعادة توليد" : "Regenerate"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => addSelectedMutation.mutate()}
                  disabled={selected.size === 0 || addSelectedMutation.isPending}
                >
                  {addSelectedMutation.isPending ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {language === "ar" ? "إضافة المحدد" : `Add ${selected.size} Items`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
