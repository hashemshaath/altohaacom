import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, FileText, ShieldCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Props {
  userId: string;
  isAdmin?: boolean;
}

const docTypes = [
  { value: "passport", en: "Passport", ar: "جواز السفر" },
  { value: "national_id", en: "National ID", ar: "الهوية الوطنية" },
  { value: "certification", en: "Certification", ar: "شهادة مهنية" },
  { value: "resume", en: "Resume / CV", ar: "السيرة الذاتية" },
  { value: "photo", en: "Professional Photo", ar: "صورة رسمية" },
  { value: "medical", en: "Medical Certificate", ar: "شهادة طبية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export default function JudgeDocumentsPanel({ userId, isAdmin }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ document_type: "passport", title: "", expiry_date: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["judge-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_documents")
        .select("id, user_id, document_type, title, file_url, file_name, file_size, expiry_date, notes, is_verified, verified_by, verified_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      setUploading(true);

      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("judge-documents")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("judge-documents").getPublicUrl(path);

      const { error } = await supabase.from("judge_documents").insert({
        user_id: userId,
        document_type: form.document_type,
        title: form.title || file.name,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-documents", userId] });
      toast({ title: isAr ? "تم رفع المستند" : "Document uploaded" });
      setShowForm(false);
      setFile(null);
      setForm({ document_type: "passport", title: "", expiry_date: "", notes: "" });
      setUploading(false);
    },
    onError: (err: any) => {
      setUploading(false);
      toast({ title: isAr ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judge_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-documents", userId] });
      toast({ title: isAr ? "تم الحذف" : "Document deleted" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("judge_documents").update({
        is_verified: true,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-documents", userId] });
      toast({ title: isAr ? "تم التوثيق" : "Document verified" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isAr ? "المستندات والوثائق" : "Documents & Files"}</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? (isAr ? "إغلاق" : "Close") : <><Plus className="me-2 h-4 w-4" />{isAr ? "رفع مستند" : "Upload Document"}</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "نوع المستند" : "Document Type"}</Label>
                <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {docTypes.map(d => <SelectItem key={d.value} value={d.value}>{isAr ? d.ar : d.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{isAr ? "العنوان" : "Title"}</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
              <div><Label>{isAr ? "ملاحظات" : "Notes"}</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div>
              <Label>{isAr ? "الملف" : "File"}</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </div>
            <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploading}>
              <Upload className="me-2 h-4 w-4" />
              {uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "رفع" : "Upload")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "الانتهاء" : "Expiry"}</TableHead>
                <TableHead>{isAr ? "التوثيق" : "Verified"}</TableHead>
                <TableHead className="text-end">{isAr ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">{isAr ? "جاري التحميل..." : "Loading..."}</TableCell></TableRow>
              ) : documents?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{isAr ? "لا توجد مستندات" : "No documents uploaded"}</TableCell></TableRow>
              ) : (
                documents?.map(doc => {
                  const typeLabel = docTypes.find(d => d.value === doc.document_type);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell><Badge variant="secondary">{isAr ? typeLabel?.ar : typeLabel?.en}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <span className={new Date(doc.expiry_date) < new Date() ? "text-destructive" : ""}>
                            {format(new Date(doc.expiry_date), "yyyy-MM-dd")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {doc.is_verified ? (
                          <Badge className="bg-chart-3/20 text-chart-3"><ShieldCheck className="me-1 h-3 w-3" />{isAr ? "موثق" : "Verified"}</Badge>
                        ) : (
                          isAdmin ? (
                            <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate(doc.id)}>
                              {isAr ? "توثيق" : "Verify"}
                            </Button>
                          ) : <Badge variant="outline">{isAr ? "قيد المراجعة" : "Pending"}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
