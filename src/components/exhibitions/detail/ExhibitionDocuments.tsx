import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileImage, FileSpreadsheet, File } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface DocumentItem {
  name?: string;
  name_ar?: string;
  url?: string;
  type?: string;
}

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: FileImage,
  spreadsheet: FileSpreadsheet,
  brochure: FileText,
  floorplan: FileImage,
};

interface Props {
  documents: Json;
  isAr: boolean;
}

export function ExhibitionDocuments({ documents, isAr }: Props) {
  if (!documents || !Array.isArray(documents)) return null;

  const docs = (documents as DocumentItem[]).filter((d) => d?.url);
  if (docs.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-2/10">
            <FileText className="h-3.5 w-3.5 text-chart-2" />
          </div>
          {isAr ? "ملفات ووثائق" : "Documents & Files"}
        </h3>
      </div>
      <CardContent className="p-3 space-y-1.5">
        {docs.map((doc, i) => {
          const Icon = FILE_ICONS[doc.type || ""] || File;
          const name = isAr && doc.name_ar ? doc.name_ar : doc.name || `${isAr ? "ملف" : "Document"} ${i + 1}`;

          return (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 hover:shadow-sm group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-2/10 shrink-0">
                <Icon className="h-4 w-4 text-chart-2" />
              </div>
              <span className="flex-1 truncate">{name}</span>
              <Download className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
