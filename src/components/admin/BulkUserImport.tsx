import { useState, useRef, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Download, Users, Trash2
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "volunteer", "sponsor", "assistant", "supervisor"];

interface ParsedUser {
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  status: "valid" | "error" | "duplicate";
  error?: string;
}

export function BulkUserImport() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [defaultRole, setDefaultRole] = useState<AppRole>("chef");
  const [fileName, setFileName] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0, errors: [] as string[] });

  const parseCSV = (text: string): ParsedUser[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
    const nameIdx = header.findIndex(h => ["name", "full_name", "fullname", "الاسم"].includes(h));
    const emailIdx = header.findIndex(h => ["email", "البريد", "البريد الإلكتروني"].includes(h));
    const phoneIdx = header.findIndex(h => ["phone", "mobile", "الهاتف", "الجوال"].includes(h));
    const roleIdx = header.findIndex(h => ["role", "الدور"].includes(h));

    if (nameIdx === -1 || emailIdx === -1) return [];

    const seenEmails = new Set<string>();
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
      const email = cols[emailIdx]?.toLowerCase() || "";
      const full_name = cols[nameIdx] || "";
      const phone = phoneIdx >= 0 ? cols[phoneIdx] : undefined;
      const role = roleIdx >= 0 ? cols[roleIdx] : undefined;

      if (!full_name || !email) {
        return { full_name, email, phone, role, status: "error" as const, error: isAr ? "بيانات ناقصة" : "Missing required data" };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { full_name, email, phone, role, status: "error" as const, error: isAr ? "بريد إلكتروني غير صالح" : "Invalid email" };
      }
      if (seenEmails.has(email)) {
        return { full_name, email, phone, role, status: "duplicate" as const, error: isAr ? "مكرر" : "Duplicate" };
      }
      seenEmails.add(email);
      return { full_name, email, phone, role, status: "valid" as const };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const users = parseCSV(text);
      if (users.length === 0) {
        toast({ variant: "destructive", title: isAr ? "ملف غير صالح" : "Invalid file", description: isAr ? "تأكد أن الملف يحتوي على أعمدة name و email" : "File must have 'name' and 'email' columns" });
        return;
      }
      setParsedUsers(users);
      setStep("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    const validUsers = parsedUsers.filter(u => u.status === "valid");
    if (validUsers.length === 0) return;

    setStep("importing");
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < validUsers.length; i++) {
      const u = validUsers[i];
      try {
        const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!1`;
        const role = (u.role && ALL_ROLES.includes(u.role as AppRole) ? u.role : defaultRole) as AppRole;

        const { data, error } = await supabase.functions.invoke("admin-user-management", {
          body: {
            action: "create_user",
            email: u.email,
            password: tempPassword,
            full_name: u.full_name,
            phone: u.phone || "",
            role,
          },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        success++;
      } catch (err: any) {
        failed++;
        errors.push(`${u.email}: ${err.message}`);
      }
      setImportProgress(Math.round(((i + 1) / validUsers.length) * 100));
    }

    setImportResults({ success, failed, errors });
    setStep("done");
    queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
  };

  const downloadTemplate = () => {
    const csv = [
      "name,email,phone,role",
      "محمد أحمد / Mohammed Ahmed,mohammed@example.com,+966501234567,chef",
      "سارة خالد / Sara Khalid,sara@example.com,+966502345678,judge",
      "علي حسن / Ali Hassan,ali@example.com,+971501234567,student",
      "فاطمة يوسف / Fatima Yousef,fatima@example.com,+966503456789,volunteer",
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedUsers.filter(u => u.status === "valid").length;
  const errorCount = parsedUsers.filter(u => u.status !== "valid").length;

  const reset = () => {
    setStep("upload");
    setParsedUsers([]);
    setFileName("");
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0, errors: [] });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {isAr ? "استيراد المستخدمين من ملف" : "Bulk Import Users"}
        </CardTitle>
        <CardDescription>
          {isAr 
            ? "قم بتحميل ملف CSV يحتوي على أعمدة name و email لإضافة مستخدمين. يمكنك أيضاً تضمين phone و role." 
            : "Upload a CSV with 'name' and 'email' columns. Optionally include 'phone' and 'role'."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-10 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{isAr ? "اضغط لتحميل الملف أو اسحبه هنا" : "Click to upload or drag file here"}</p>
                <p className="text-xs text-muted-foreground mt-1">{isAr ? "ملفات CSV - الحد الأقصى 1000 مستخدم" : "CSV files — up to 1,000 users per import"}</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                {isAr ? "تحميل القالب" : "Download Template"}
              </Button>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">{isAr ? "الدور الافتراضي" : "Default Role"}</Label>
                <Select value={defaultRole} onValueChange={(v) => setDefaultRole(v as AppRole)}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1"><FileSpreadsheet className="h-3 w-3" />{fileName}</Badge>
                <Badge className="bg-chart-5/20 text-chart-5">{validCount} {isAr ? "صالح" : "valid"}</Badge>
                {errorCount > 0 && <Badge variant="destructive">{errorCount} {isAr ? "خطأ" : "errors"}</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={reset}><Trash2 className="h-4 w-4 me-1" />{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button size="sm" onClick={handleImport} disabled={validCount === 0}>
                  <Users className="h-4 w-4 me-1" />{isAr ? `استيراد ${validCount} مستخدم` : `Import ${validCount} Users`}
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                    <TableHead>{isAr ? "الهاتف" : "Phone"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedUsers.slice(0, 50).map((u, i) => (
                    <TableRow key={i} className={u.status !== "valid" ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-sm">{u.full_name}</TableCell>
                      <TableCell className="text-sm font-mono">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                      <TableCell>
                        {u.status === "valid" ? (
                          <CheckCircle2 className="h-4 w-4 text-chart-5" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />{u.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedUsers.length > 50 && (
              <p className="text-xs text-muted-foreground text-center">
                {isAr ? `عرض أول 50 من ${parsedUsers.length}` : `Showing first 50 of ${parsedUsers.length}`}
              </p>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">{isAr ? "جاري الاستيراد..." : "Importing users..."}</p>
            <Progress value={importProgress} className="max-w-xs mx-auto" />
            <p className="text-xs text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-chart-5">{importResults.success}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "نجح" : "Succeeded"}</p>
              </div>
              {importResults.failed > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{importResults.failed}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "فشل" : "Failed"}</p>
                </div>
              )}
            </div>
            {importResults.errors.length > 0 && (
              <div className="max-h-32 overflow-auto rounded-md border bg-destructive/5 p-3">
                {importResults.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">{e}</p>
                ))}
              </div>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={reset}>{isAr ? "استيراد آخر" : "Import Another"}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
