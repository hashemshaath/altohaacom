import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Plus, FileSpreadsheet, FileText, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ExportPreset {
  id: string;
  name: string;
  entity: string;
  format: string;
  lastRun?: string;
}

const EXPORT_ENTITIES = [
  { value: "users", label: "Users" },
  { value: "competitions", label: "Competitions" },
  { value: "articles", label: "Articles" },
  { value: "invoices", label: "Invoices" },
  { value: "support_tickets", label: "Support Tickets" },
  { value: "companies", label: "Companies" },
  { value: "certificates", label: "Certificates" },
];

export function AdminScheduledExports() {
  const [presets, setPresets] = useState<ExportPreset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("altoha_export_presets") || "[]");
    } catch { return []; }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; entity: string; format: string }>({ name: "", entity: "", format: "csv" });

  const savePresets = (updated: ExportPreset[]) => {
    setPresets(updated);
    localStorage.setItem("altoha_export_presets", JSON.stringify(updated));
  };

  const addPreset = () => {
    if (!form.name || !form.entity) {
      toast.error("Please fill all fields");
      return;
    }
    const preset: ExportPreset = {
      id: crypto.randomUUID(),
      name: form.name,
      entity: form.entity,
      format: form.format,
    };
    savePresets([...presets, preset]);
    setForm({ name: "", entity: "", format: "csv" });
    setDialogOpen(false);
    toast.success("Export preset saved");
  };

  const runExport = async (preset: ExportPreset) => {
    toast.info(`Exporting ${preset.entity} as ${preset.format.toUpperCase()}...`);
    // Simulate export
    const updated = presets.map((p) =>
      p.id === preset.id ? { ...p, lastRun: new Date().toISOString() } : p
    );
    savePresets(updated);
    setTimeout(() => toast.success(`${preset.name} exported successfully`), 1500);
  };

  const removePreset = (id: string) => {
    savePresets(presets.filter((p) => p.id !== id));
    toast.success("Preset removed");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Quick Exports
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>New Export Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs">Preset Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Monthly Users Report"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Data Source</Label>
                  <Select value={form.entity} onValueChange={(v) => setForm({ ...form, entity: v })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {EXPORT_ENTITIES.map((e) => (
                        <SelectItem key={e.value} value={e.value} className="text-xs">{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Format</Label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v as "csv" | "json" })}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv" className="text-xs">CSV (Excel)</SelectItem>
                      <SelectItem value="json" className="text-xs">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addPreset} className="w-full h-8 text-xs">Save Preset</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {presets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No export presets yet. Create one to quickly export data.
          </p>
        ) : (
          presets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 group">
              <div className="flex items-center gap-2 min-w-0">
                {preset.format === "csv" ? (
                  <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-accent-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{preset.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {preset.entity} • {preset.format.toUpperCase()}
                    {preset.lastRun && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        Last: {new Date(preset.lastRun).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => runExport(preset)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePreset(preset.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
