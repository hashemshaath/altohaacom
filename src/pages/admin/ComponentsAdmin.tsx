import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  EyeOff,
  Save,
  LayoutDashboard,
  Home,
  Newspaper,
  Trophy,
  Users,
  MessageSquare,
  Bell,
  Search,
  Menu,
  User,
  Settings,
  HelpCircle,
  Globe,
  Moon,
} from "lucide-react";

interface ComponentVisibility {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: any;
  visible: boolean;
  page: string;
}

const defaultComponents: ComponentVisibility[] = [
  // Header Components
  { id: "header_logo", name: "Logo", nameAr: "الشعار", description: "Site logo in header", descriptionAr: "شعار الموقع في الرأس", icon: Home, visible: true, page: "header" },
  { id: "header_search", name: "Quick Search", nameAr: "البحث السريع", description: "Search bar in header", descriptionAr: "شريط البحث في الرأس", icon: Search, visible: true, page: "header" },
  { id: "header_notifications", name: "Notifications", nameAr: "الإشعارات", description: "Notification bell icon", descriptionAr: "أيقونة جرس الإشعارات", icon: Bell, visible: true, page: "header" },
  { id: "header_messages", name: "Messages", nameAr: "الرسائل", description: "Messages icon", descriptionAr: "أيقونة الرسائل", icon: MessageSquare, visible: true, page: "header" },
  { id: "header_theme_toggle", name: "Theme Toggle", nameAr: "تبديل السمة", description: "Light/Dark mode switch", descriptionAr: "مفتاح الوضع الفاتح/الداكن", icon: Moon, visible: true, page: "header" },
  { id: "header_language", name: "Language Switcher", nameAr: "مبدل اللغة", description: "Language selection", descriptionAr: "اختيار اللغة", icon: Globe, visible: true, page: "header" },
  
  // Home Page
  { id: "home_hero", name: "Hero Section", nameAr: "قسم البطل", description: "Main hero banner", descriptionAr: "البانر الرئيسي", icon: LayoutDashboard, visible: true, page: "home" },
  { id: "home_featured_competitions", name: "Featured Competitions", nameAr: "المسابقات المميزة", description: "Featured competitions carousel", descriptionAr: "دوارة المسابقات المميزة", icon: Trophy, visible: true, page: "home" },
  { id: "home_news", name: "Latest News", nameAr: "آخر الأخبار", description: "News section on homepage", descriptionAr: "قسم الأخبار في الصفحة الرئيسية", icon: Newspaper, visible: true, page: "home" },
  { id: "home_community", name: "Community Section", nameAr: "قسم المجتمع", description: "Community highlights", descriptionAr: "أبرز أحداث المجتمع", icon: Users, visible: true, page: "home" },
  
  // Dashboard
  { id: "dashboard_stats", name: "Quick Stats", nameAr: "إحصائيات سريعة", description: "Stats widgets on dashboard", descriptionAr: "أدوات الإحصائيات في لوحة التحكم", icon: LayoutDashboard, visible: true, page: "dashboard" },
  { id: "dashboard_activity", name: "Recent Activity", nameAr: "النشاط الأخير", description: "Activity feed widget", descriptionAr: "أداة تغذية النشاط", icon: Bell, visible: true, page: "dashboard" },
  { id: "dashboard_upcoming", name: "Upcoming Competitions", nameAr: "المسابقات القادمة", description: "Upcoming events widget", descriptionAr: "أداة الأحداث القادمة", icon: Trophy, visible: true, page: "dashboard" },
  
  // Profile
  { id: "profile_social", name: "Social Links", nameAr: "روابط التواصل", description: "Social media links on profile", descriptionAr: "روابط التواصل الاجتماعي في الملف", icon: User, visible: true, page: "profile" },
  { id: "profile_history", name: "Competition History", nameAr: "سجل المسابقات", description: "User's competition history", descriptionAr: "سجل مسابقات المستخدم", icon: Trophy, visible: true, page: "profile" },
  { id: "profile_message_btn", name: "Message Button", nameAr: "زر الرسالة", description: "Send message button", descriptionAr: "زر إرسال رسالة", icon: MessageSquare, visible: true, page: "profile" },
  
  // Footer
  { id: "footer_links", name: "Footer Links", nameAr: "روابط التذييل", description: "Footer navigation links", descriptionAr: "روابط التنقل في التذييل", icon: Menu, visible: true, page: "footer" },
  { id: "footer_social", name: "Footer Social", nameAr: "التواصل في التذييل", description: "Social links in footer", descriptionAr: "روابط التواصل في التذييل", icon: Users, visible: true, page: "footer" },
  { id: "footer_newsletter", name: "Newsletter", nameAr: "النشرة الإخبارية", description: "Newsletter signup", descriptionAr: "الاشتراك في النشرة الإخبارية", icon: Newspaper, visible: false, page: "footer" },
];

export default function ComponentsAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [components, setComponents] = useState(defaultComponents);

  const pages = [
    { id: "all", label: language === "ar" ? "الكل" : "All" },
    { id: "header", label: language === "ar" ? "الرأس" : "Header" },
    { id: "home", label: language === "ar" ? "الرئيسية" : "Home" },
    { id: "dashboard", label: language === "ar" ? "لوحة التحكم" : "Dashboard" },
    { id: "profile", label: language === "ar" ? "الملف الشخصي" : "Profile" },
    { id: "footer", label: language === "ar" ? "التذييل" : "Footer" },
  ];

  const toggleComponent = (id: string) => {
    setComponents(prev => 
      prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c)
    );
  };

  const toggleAll = (page: string, visible: boolean) => {
    setComponents(prev =>
      prev.map(c => (page === "all" || c.page === page) ? { ...c, visible } : c)
    );
  };

  const handleSave = () => {
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات المكونات" : "Component visibility saved",
    });
  };

  const getPageComponents = (page: string) => {
    if (page === "all") return components;
    return components.filter(c => c.page === page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إظهار المكونات" : "Component Visibility"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" 
              ? "التحكم في ظهور المكونات في الصفحات" 
              : "Control which components are visible on each page"}
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          {language === "ar" ? "حفظ" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto">
          {pages.map(page => (
            <TabsTrigger key={page.id} value={page.id}>{page.label}</TabsTrigger>
          ))}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page.id} value={page.id} className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {page.id === "all" 
                      ? (language === "ar" ? "جميع المكونات" : "All Components")
                      : page.label}
                  </CardTitle>
                  <CardDescription>
                    {getPageComponents(page.id).filter(c => c.visible).length} / {getPageComponents(page.id).length} {language === "ar" ? "مفعل" : "visible"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAll(page.id, true)}>
                    <Eye className="mr-2 h-3 w-3" />
                    {language === "ar" ? "إظهار الكل" : "Show All"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(page.id, false)}>
                    <EyeOff className="mr-2 h-3 w-3" />
                    {language === "ar" ? "إخفاء الكل" : "Hide All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {getPageComponents(page.id).map((component) => (
                    <div 
                      key={component.id}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                        component.visible 
                          ? "bg-card" 
                          : "bg-muted/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${
                          component.visible ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <component.icon className={`h-4 w-4 ${
                            component.visible ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {language === "ar" ? component.nameAr : component.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {language === "ar" ? component.descriptionAr : component.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={component.visible ? "default" : "secondary"} className="text-xs">
                          {component.visible 
                            ? (language === "ar" ? "مرئي" : "Visible")
                            : (language === "ar" ? "مخفي" : "Hidden")}
                        </Badge>
                        <Switch
                          checked={component.visible}
                          onCheckedChange={() => toggleComponent(component.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
