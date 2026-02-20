import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlayCircle, FileText, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LessonViewerProps {
  lesson: {
    id: string;
    title: string;
    title_ar?: string | null;
    content?: string | null;
    content_ar?: string | null;
    content_type: string;
    video_url?: string | null;
    duration_minutes?: number | null;
  };
  isCompleted: boolean;
  isEnrolled: boolean;
  onComplete: (lessonId: string) => void;
  onBack: () => void;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Already an embed or direct URL
  if (url.includes("embed")) return url;

  return null;
}

export function LessonViewer({ lesson, isCompleted, isEnrolled, onComplete, onBack }: LessonViewerProps) {
  const { language } = useLanguage();

  const title = language === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title;
  const content = language === "ar" && lesson.content_ar ? lesson.content_ar : lesson.content;
  const embedUrl = lesson.video_url ? getEmbedUrl(lesson.video_url) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 me-2" />
          {language === "ar" ? "رجوع" : "Back"}
        </Button>
        <div className="flex items-center gap-2">
          {lesson.content_type === "video" ? (
            <PlayCircle className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {isCompleted && <CheckCircle className="h-5 w-5 text-chart-5" />}
      </div>

      {/* Video Player */}
      {lesson.content_type === "video" && embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {lesson.content_type === "video" && lesson.video_url && !embedUrl && (
        <Card>
          <CardContent className="py-8 text-center">
            <PlayCircle className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {language === "ar" ? "شاهد الفيديو" : "Watch Video"}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Article Content */}
      {content && (
        <Card>
          <CardContent className="py-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Button */}
      {isEnrolled && !isCompleted && (
        <div className="flex justify-end">
          <Button onClick={() => onComplete(lesson.id)}>
            <CheckCircle className="me-2 h-4 w-4" />
            {language === "ar" ? "وضع علامة مكتمل" : "Mark as Complete"}
          </Button>
        </div>
      )}
    </div>
  );
}
