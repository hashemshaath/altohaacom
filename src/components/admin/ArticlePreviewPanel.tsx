import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, Calendar, Star, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ArticlePreviewPanelProps {
  article: {
    title: string;
    title_ar?: string | null;
    excerpt?: string | null;
    excerpt_ar?: string | null;
    content: string;
    content_ar?: string | null;
    featured_image_url?: string | null;
    type: string;
    status?: string | null;
    is_featured?: boolean | null;
    published_at?: string | null;
    created_at: string;
    view_count?: number | null;
  };
  onClose: () => void;
}

export function ArticlePreviewPanel({ article, onClose }: ArticlePreviewPanelProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const title = isAr && article.title_ar ? article.title_ar : article.title;
  const excerpt = isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt;
  const content = isAr && article.content_ar ? article.content_ar : article.content;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{article.type}</Badge>
              {article.status && (
                <Badge variant={article.status === "published" ? "default" : "secondary"}>
                  {article.status}
                </Badge>
              )}
              {article.is_featured && (
                <Badge className="bg-chart-4/15 text-chart-4 gap-1">
                  <Star className="h-3 w-3" /> {isAr ? "مميز" : "Featured"}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight" dir={isAr ? "rtl" : "ltr"}>{title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(article.published_at), "MMM dd, yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.view_count || 0} {isAr ? "مشاهدة" : "views"}
          </span>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        <ScrollArea className="h-[400px]">
          {article.featured_image_url && (
            <img
              src={article.featured_image_url}
              alt={title}
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
          )}

          {excerpt && (
            <p className="text-sm text-muted-foreground italic mb-4 border-s-2 border-primary/30 ps-3" dir={isAr ? "rtl" : "ltr"}>
              {excerpt}
            </p>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none" dir={isAr ? "rtl" : "ltr"}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
