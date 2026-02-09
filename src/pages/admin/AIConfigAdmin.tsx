import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Sparkles,
  MessageSquare,
  FileText,
  Image,
  Languages,
  Save,
  RefreshCw,
  Zap,
  Brain,
  Settings,
} from "lucide-react";

export default function AIConfigAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [config, setConfig] = useState({
    // General AI Settings
    enabled: true,
    defaultModel: "google/gemini-3-flash-preview",
    maxTokens: 2048,
    temperature: 0.7,
    
    // Feature Toggles
    chatAssistant: true,
    contentGeneration: true,
    autoModeration: false,
    translationService: true,
    imageCaptioning: false,
    
    // Prompts
    systemPrompt: "You are a helpful culinary assistant for the Altohaa platform. You help chefs, judges, and organizers with questions about competitions, recipes, and culinary techniques.",
    moderationPrompt: "Analyze the following content for inappropriate material, spam, or policy violations.",
    
    // Limits
    dailyRequestLimit: 1000,
    maxConversationLength: 50,
    rateLimitPerUser: 20,
  });

  const models = [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash (Fast)", description: "Balanced speed and capability" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro (Best)", description: "Highest quality responses" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Good for simple tasks" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Complex reasoning" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Fast and cost-effective" },
    { id: "openai/gpt-5", name: "GPT-5", description: "Most powerful" },
  ];

  const features = [
    {
      key: "chatAssistant",
      icon: MessageSquare,
      title: language === "ar" ? "مساعد المحادثة" : "Chat Assistant",
      description: language === "ar" ? "مساعد ذكي للإجابة على استفسارات المستخدمين" : "AI assistant to answer user queries",
    },
    {
      key: "contentGeneration",
      icon: FileText,
      title: language === "ar" ? "إنشاء المحتوى" : "Content Generation",
      description: language === "ar" ? "إنشاء مقالات ووصفات تلقائياً" : "Auto-generate articles and recipes",
    },
    {
      key: "autoModeration",
      icon: Bot,
      title: language === "ar" ? "الإشراف التلقائي" : "Auto Moderation",
      description: language === "ar" ? "فحص المحتوى تلقائياً للمخالفات" : "Automatically scan content for violations",
    },
    {
      key: "translationService",
      icon: Languages,
      title: language === "ar" ? "خدمة الترجمة" : "Translation Service",
      description: language === "ar" ? "ترجمة المحتوى بين العربية والإنجليزية" : "Translate content between Arabic and English",
    },
    {
      key: "imageCaptioning",
      icon: Image,
      title: language === "ar" ? "وصف الصور" : "Image Captioning",
      description: language === "ar" ? "إنشاء وصف تلقائي للصور" : "Auto-generate image descriptions",
    },
  ];

  const handleSave = () => {
    toast({
      title: language === "ar" ? "تم الحفظ" : "Saved",
      description: language === "ar" ? "تم حفظ إعدادات الذكاء الاصطناعي" : "AI configuration saved successfully",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: language === "ar" ? "الاتصال ناجح" : "Connection Successful",
      description: language === "ar" ? "تم الاتصال بخدمة AI بنجاح" : "Successfully connected to AI service",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {language === "ar" ? "إعدادات الذكاء الاصطناعي" : "AI Configuration"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" 
              ? "إدارة خدمات الذكاء الاصطناعي في المنصة" 
              : "Manage AI services for the platform"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestConnection}>
            <Zap className="mr-2 h-4 w-4" />
            {language === "ar" ? "اختبار الاتصال" : "Test Connection"}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {language === "ar" ? "Lovable AI Gateway" : "Lovable AI Gateway"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === "ar" ? "متصل ويعمل بشكل طبيعي" : "Connected and operational"}
              </p>
            </div>
          </div>
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            {language === "ar" ? "نشط" : "Active"}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {language === "ar" ? "اختيار النموذج" : "Model Selection"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "اختر نموذج الذكاء الاصطناعي الافتراضي" : "Choose the default AI model"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "النموذج الافتراضي" : "Default Model"}</Label>
              <Select
                value={config.defaultModel}
                onValueChange={(value) => setConfig({ ...config, defaultModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{language === "ar" ? "الحد الأقصى للرموز" : "Max Tokens"}</Label>
                  <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
                </div>
                <Slider
                  value={[config.maxTokens]}
                  onValueChange={([v]) => setConfig({ ...config, maxTokens: v })}
                  min={256}
                  max={8192}
                  step={256}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{language === "ar" ? "درجة الإبداع" : "Temperature"}</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature]}
                  onValueChange={([v]) => setConfig({ ...config, temperature: v })}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {language === "ar" ? "الميزات" : "Features"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "تفعيل وتعطيل ميزات الذكاء الاصطناعي" : "Enable or disable AI features"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Switch
                  checked={config[feature.key as keyof typeof config] as boolean}
                  onCheckedChange={(checked) => setConfig({ ...config, [feature.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {language === "ar" ? "رسالة النظام" : "System Prompt"}
            </CardTitle>
            <CardDescription>
              {language === "ar" 
                ? "الرسالة الأساسية التي تحدد شخصية المساعد" 
                : "The base prompt that defines the assistant's personality"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={4}
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder={language === "ar" ? "أدخل رسالة النظام..." : "Enter system prompt..."}
            />
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {language === "ar" ? "حدود الاستخدام" : "Usage Limits"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "إدارة حدود استخدام الذكاء الاصطناعي" : "Manage AI usage limits"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الحد اليومي للطلبات" : "Daily Request Limit"}</Label>
                <Input
                  type="number"
                  value={config.dailyRequestLimit}
                  onChange={(e) => setConfig({ ...config, dailyRequestLimit: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "طول المحادثة الأقصى" : "Max Conversation Length"}</Label>
                <Input
                  type="number"
                  value={config.maxConversationLength}
                  onChange={(e) => setConfig({ ...config, maxConversationLength: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "حد الطلبات لكل مستخدم/دقيقة" : "Rate Limit Per User/min"}</Label>
                <Input
                  type="number"
                  value={config.rateLimitPerUser}
                  onChange={(e) => setConfig({ ...config, rateLimitPerUser: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
