import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { PerformanceMonitor } from "@/components/admin/PerformanceMonitor";
import { NotificationPreferencesManager } from "@/components/admin/NotificationPreferencesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import { Gauge, Bell } from "lucide-react";

export default function PerformanceAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Gauge} title="Performance & Notifications" description="Monitor and optimize" />
      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance" className="gap-1">
            <Gauge className="h-3.5 w-3.5" />
            {isAr ? "الأداء" : "Performance"}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1">
            <Bell className="h-3.5 w-3.5" />
            {isAr ? "الإشعارات" : "Notifications"}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationPreferencesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
