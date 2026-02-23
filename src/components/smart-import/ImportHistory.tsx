import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Loader2, Plus, RefreshCw, Database as DatabaseIcon } from "lucide-react";
import { TARGET_TABLE_OPTIONS } from "./types";

interface ImportHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  history: any[];
  isAr: boolean;
}

export const ImportHistory = React.memo(({ open, onOpenChange, loading, history, isAr }: ImportHistoryProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {isAr ? "سجل الاستيراد" : "Import History"}
        </DialogTitle>
        <DialogDescription>
          {isAr ? "جميع عمليات الاستيراد السابقة" : "All previous import operations"}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DatabaseIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{isAr ? "لا توجد عمليات استيراد سابقة" : "No previous imports"}</p>
          </div>
        ) : (
          <div className="space-y-2 pe-2">
            {history.map((log) => {
              const tableInfo = TARGET_TABLE_OPTIONS.find(t => t.value === log.target_table);
              return (
                <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {log.action === 'create' ? <Plus className="h-4 w-4 text-primary" /> : <RefreshCw className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.entity_name || 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] h-4">{isAr ? tableInfo?.label_ar : tableInfo?.label_en}</Badge>
                        <Badge variant="secondary" className="text-[10px] h-4">{log.entity_type}</Badge>
                        <span>{log.action === 'create' ? (isAr ? 'إضافة' : 'Created') : (isAr ? 'تحديث' : 'Updated')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 text-end">
                    <p>{new Date(log.created_at).toLocaleDateString()}</p>
                    <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  </Dialog>
));
ImportHistory.displayName = "ImportHistory";
