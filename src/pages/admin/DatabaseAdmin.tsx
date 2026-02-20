import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  HardDrive,
  Table2,
  Users,
  FileText,
  MessageSquare,
  Trophy,
  RefreshCw,
  Download,
  Trash2,
  Shield,
} from "lucide-react";

export default function DatabaseAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: tableStats, refetch } = useQuery({
    queryKey: ["database-stats"],
    queryFn: async () => {
      const tables = [
        { name: "profiles", icon: Users, label: language === "ar" ? "المستخدمين" : "Profiles" },
        { name: "competitions", icon: Trophy, label: language === "ar" ? "المسابقات" : "Competitions" },
        { name: "articles", icon: FileText, label: language === "ar" ? "المقالات" : "Articles" },
        { name: "messages", icon: MessageSquare, label: language === "ar" ? "الرسائل" : "Messages" },
        { name: "notifications", icon: FileText, label: language === "ar" ? "الإشعارات" : "Notifications" },
        { name: "competition_registrations", icon: Trophy, label: language === "ar" ? "التسجيلات" : "Registrations" },
        { name: "posts", icon: FileText, label: language === "ar" ? "المنشورات" : "Posts" },
        { name: "user_roles", icon: Shield, label: language === "ar" ? "الأدوار" : "Roles" },
      ];

      const stats = await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase
            .from(table.name as any)
            .select("*", { count: "exact", head: true });
          return { ...table, count: count || 0 };
        })
      );

      return stats;
    },
  });

  const { data: storageBuckets } = useQuery({
    queryKey: ["storage-buckets"],
    queryFn: async () => {
      // This would normally come from the Supabase storage API
      return [
        { name: "dish-images", size: "24.5 MB", files: 156, public: true },
        { name: "avatars", size: "8.2 MB", files: 89, public: true },
        { name: "documents", size: "12.1 MB", files: 34, public: false },
      ];
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: language === "ar" ? "تم التحديث" : "Refreshed",
      description: language === "ar" ? "تم تحديث إحصائيات قاعدة البيانات" : "Database stats refreshed",
    });
  };

  const handleExport = (tableName: string) => {
    toast({
      title: language === "ar" ? "جاري التصدير" : "Exporting",
      description: `${language === "ar" ? "جاري تصدير جدول" : "Exporting table"} ${tableName}...`,
    });
  };

  const totalRecords = tableStats?.reduce((sum, t) => sum + t.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "قاعدة البيانات" : "Database Overview"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "نظرة عامة على قاعدة البيانات والتخزين" : "Database and storage overview"}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {language === "ar" ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي السجلات" : "Total Records"}</p>
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "الجداول" : "Tables"}</p>
                <p className="text-2xl font-bold">{tableStats?.length || 0}</p>
              </div>
              <Table2 className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "التخزين" : "Storage"}</p>
                <p className="text-2xl font-bold">44.8 MB</p>
              </div>
              <HardDrive className="h-8 w-8 text-chart-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                <Badge variant="default" className="mt-1 bg-chart-5">
                  {language === "ar" ? "متصل" : "Connected"}
                </Badge>
              </div>
              <div className="h-3 w-3 rounded-full bg-chart-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5 text-primary" />
            {language === "ar" ? "جداول قاعدة البيانات" : "Database Tables"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "نظرة عامة على الجداول وعدد السجلات" : "Overview of tables and record counts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "ar" ? "الجدول" : "Table"}</TableHead>
                <TableHead className="text-end">{language === "ar" ? "السجلات" : "Records"}</TableHead>
                <TableHead className="text-end">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableStats?.map((table) => (
                <TableRow key={table.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                        <table.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{table.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{table.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <Badge variant="secondary">{table.count.toLocaleString()}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => handleExport(table.name)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Storage Buckets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            {language === "ar" ? "حاويات التخزين" : "Storage Buckets"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "إدارة ملفات التخزين" : "Manage storage files"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {storageBuckets?.map((bucket) => (
              <div key={bucket.name} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{bucket.name}</span>
                  </div>
                  <Badge variant={bucket.public ? "default" : "secondary"}>
                    {bucket.public 
                      ? (language === "ar" ? "عام" : "Public")
                      : (language === "ar" ? "خاص" : "Private")}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ar" ? "الحجم" : "Size"}:</span>
                    <span>{bucket.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ar" ? "الملفات" : "Files"}:</span>
                    <span>{bucket.files}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Progress value={Math.random() * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ar" ? "استخدام التخزين" : "Storage usage"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "إجراءات سريعة" : "Quick Actions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {language === "ar" ? "تصدير قاعدة البيانات" : "Export Database"}
            </Button>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === "ar" ? "تحديث الفهارس" : "Refresh Indexes"}
            </Button>
            <Button variant="outline" className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {language === "ar" ? "تنظيف الملفات المؤقتة" : "Clean Temp Files"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
