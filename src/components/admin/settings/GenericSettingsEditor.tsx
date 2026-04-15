import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save, Plus, Trash2, Database, Search, Edit2, X, Check, Copy, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  onDelete?: (key: string) => void;
  isPending: boolean;
}

export const GenericSettingsEditor = memo(function GenericSettingsEditor({
  settings, onSave, isPending,
}: Props) {
  const isAr = useIsAr();

  const [search, setSearch] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newValueRaw, setNewValueRaw] = useState("{}");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const allKeys = Object.keys(settings).filter(
    (k) => !search || k.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(JSON.stringify(settings[key], null, 2));
  };

  const saveEdit = () => {
    if (!editingKey) return;
    try {
      const parsed = JSON.parse(editValue);
      onSave(editingKey, parsed);
      setEditingKey(null);
      setEditValue("");
    } catch {
      alert(isAr ? "JSON غير صالح" : "Invalid JSON format");
    }
  };

  const handleAdd = () => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(newValueRaw);
      onSave(trimmed, parsed, newCategory);
      setNewKey("");
      setNewValueRaw("{}");
    } catch {
      alert(isAr ? "JSON غير صالح" : "Invalid JSON format");
    }
  };

  const copyValue = (key: string) => {
    navigator.clipboard.writeText(JSON.stringify(settings[key], null, 2)).then(null, () => {});
  };

  return (
    <div className="space-y-6">
      {/* Add New Entry */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إضافة إعداد جديد" : "Add New Setting"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "أدخل مفتاح فريد وقيمة JSON. يمكنك إضافة أي إعداد مخصص مثل مفاتيح API أو تكوينات التكامل."
              : "Enter a unique key and JSON value. You can add any custom setting like API keys, integration configs, or feature flags."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المفتاح" : "Key"}</Label>
              <Input
                placeholder={isAr ? "مثال: google_api_key" : "e.g. google_api_key"}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الفئة" : "Category"}</Label>
              <Input
                placeholder="general"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "القيمة (JSON)" : "Value (JSON)"}</Label>
            <Textarea
              rows={3}
              className="font-mono text-xs"
              placeholder='{"apiKey": "...", "enabled": true}'
              value={newValueRaw}
              onChange={(e) => setNewValueRaw(e.target.value)}
            />
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleAdd} disabled={isPending || !newKey.trim()}>
            <Plus className="h-3.5 w-3.5" />
            {isAr ? "إضافة" : "Add Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Search & Browse Existing */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4.5 w-4.5 text-primary" />
            {isAr ? "الإعدادات المحفوظة" : "Saved Settings"}
            <Badge variant="secondary" className="text-[12px]">{allKeys.length}</Badge>
          </CardTitle>
          <div className="pt-2">
            <Input
              placeholder={isAr ? "ابحث عن مفتاح..." : "Search keys..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="h-3.5 w-3.5" />}
              clearable
              onClear={() => setSearch("")}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/40">
          {allKeys.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {isAr ? "لا توجد إعدادات مطابقة" : "No matching settings found"}
            </p>
          )}
          {allKeys.map((key) => {
            const isExpanded = expandedKeys.has(key);
            const isEditing = editingKey === key;
            const val = settings[key];
            const preview = JSON.stringify(val);
            const truncated = preview.length > 80 ? preview.slice(0, 80) + "…" : preview;

            return (
              <div key={key} className="py-3 px-1">
                <div className="flex items-start justify-between gap-2">
                  <button
                    className="text-start flex-1 min-w-0"
                    onClick={() => toggleExpand(key)}
                  >
                    <p className="text-sm font-semibold font-mono text-foreground">{key}</p>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                        {truncated}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyValue(key)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => (isEditing ? setEditingKey(null) : startEdit(key))}>
                      {isEditing ? <X className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <pre className="mt-2 p-3 rounded-xl bg-muted/50 text-xs font-mono overflow-x-auto max-h-48 scrollbar-thin">
                    {JSON.stringify(val, null, 2)}
                  </pre>
                )}

                {isEditing && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      rows={6}
                      className="font-mono text-xs"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1.5" onClick={saveEdit} disabled={isPending}>
                        <Save className="h-3 w-3" />
                        {isAr ? "حفظ" : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
});
