import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS_EN = [
  "What are the top growth trends this month?",
  "Which countries have the most active users?",
  "How is competition engagement performing?",
  "Summarize the platform health score",
  "What are the main revenue drivers?",
  "Identify users at risk of churning",
];

const SUGGESTIONS_AR = [
  "ما هي أبرز اتجاهات النمو هذا الشهر؟",
  "أي الدول لديها أكثر المستخدمين نشاطاً؟",
  "كيف أداء التفاعل مع المسابقات؟",
  "لخّص نتيجة صحة المنصة",
  "ما هي المحركات الرئيسية للإيرادات؟",
  "حدد المستخدمين المعرضين لخطر المغادرة",
];

export function AIAnalyticsChat() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = isAr ? SUGGESTIONS_AR : SUGGESTIONS_EN;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-analytics-chat", {
        body: { messages: [...messages, userMsg], language },
      });

      if (error) throw error;

      const assistantContent = data?.response || (isAr ? "عذراً، لم أتمكن من الرد" : "Sorry, I couldn't generate a response.");
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err: any) {
      const errorMsg = err?.message?.includes("429")
        ? (isAr ? "تم تجاوز الحد المسموح، حاول لاحقاً" : "Rate limit exceeded, please try later")
        : err?.message?.includes("402")
        ? (isAr ? "نفدت رصيد الذكاء الاصطناعي" : "AI credits exhausted")
        : (isAr ? "حدث خطأ، حاول مرة أخرى" : "An error occurred, please try again");

      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
        <CardHeader className="pb-3 border-b shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            {isAr ? "مساعد التحليلات الذكي" : "AI Analytics Assistant"}
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Sparkles className="h-3 w-3" />
              {isAr ? "مدعوم بالذكاء الاصطناعي" : "AI-Powered"}
            </Badge>
          </CardTitle>
        </CardHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {isAr ? "اسأل عن بيانات المنصة" : "Ask about your platform data"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAr
                      ? "يمكنني تحليل البيانات وتقديم رؤى فورية"
                      : "I can analyze data and provide instant insights"}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 max-w-lg mx-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-start text-sm p-3 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? "جارٍ التحليل..." : "Analyzing..."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <CardContent className="border-t pt-3 pb-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAr ? "اسأل عن البيانات..." : "Ask about your data..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
