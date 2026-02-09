import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Clock, Users, GraduationCap, CheckCircle, PlayCircle,
  FileText, Lock, ChevronRight, ArrowLeft,
} from "lucide-react";

export default function MasterclassDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: masterclass, isLoading } = useQuery({
    queryKey: ["masterclass", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclasses")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["masterclass-modules", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclass_modules")
        .select("*, masterclass_lessons(*)")
        .eq("masterclass_id", id!)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("masterclass_enrollments")
        .select("*")
        .eq("masterclass_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lesson-progress", enrollment?.id],
    queryFn: async () => {
      if (!enrollment) return [];
      const { data, error } = await supabase
        .from("masterclass_lesson_progress")
        .select("*")
        .eq("enrollment_id", enrollment.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!enrollment,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("masterclass_enrollments")
        .insert({ masterclass_id: id, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast({
        title: language === "ar" ? "تم التسجيل بنجاح" : "Enrolled successfully",
        description: language === "ar" ? "يمكنك البدء بالتعلم الآن" : "You can start learning now",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل التسجيل" : "Failed to enroll",
        variant: "destructive",
      });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!enrollment) throw new Error("Not enrolled");
      const { error } = await supabase
        .from("masterclass_lesson_progress")
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: "enrollment_id,lesson_id" });
      if (error) throw error;

      // Update progress percentage
      const totalLessons = modules.reduce((sum: number, m: any) => sum + (m.masterclass_lessons?.length || 0), 0);
      const completedCount = lessonProgress.filter((lp) => lp.completed).length + 1;
      const newPercent = Math.round((completedCount / totalLessons) * 100);

      await supabase
        .from("masterclass_enrollments")
        .update({
          progress_percent: newPercent,
          ...(newPercent >= 100 ? { status: "completed", completed_at: new Date().toISOString() } : {}),
        })
        .eq("id", enrollment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!masterclass) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{language === "ar" ? "الدورة غير موجودة" : "Masterclass not found"}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalLessons = modules.reduce((sum: number, m: any) => sum + (m.masterclass_lessons?.length || 0), 0);
  const completedLessons = lessonProgress.filter((lp) => lp.completed).length;
  const isCompleted = enrollment?.status === "completed";
  const completedLessonIds = new Set(lessonProgress.filter((lp) => lp.completed).map((lp) => lp.lesson_id));

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="h-4 w-4" />;
      case "article": return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-12">
          <div className="container mx-auto px-4">
            <Button variant="ghost" onClick={() => navigate("/masterclasses")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "ar" ? "العودة" : "Back"}
            </Button>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{masterclass.category}</Badge>
                  <Badge variant="secondary">{masterclass.level}</Badge>
                  {masterclass.is_free && <Badge>{language === "ar" ? "مجاني" : "Free"}</Badge>}
                </div>
                <h1 className="text-3xl font-serif font-bold mb-4">
                  {language === "ar" && masterclass.title_ar ? masterclass.title_ar : masterclass.title}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {language === "ar" && masterclass.description_ar ? masterclass.description_ar : masterclass.description}
                </p>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {modules.length} {language === "ar" ? "وحدة" : "modules"} • {totalLessons} {language === "ar" ? "درس" : "lessons"}
                  </span>
                  {masterclass.duration_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {masterclass.duration_hours} {language === "ar" ? "ساعة" : "hours"}
                    </span>
                  )}
                </div>
              </div>

              {/* Enrollment Card */}
              <Card className="h-fit">
                <CardContent className="p-6 space-y-4">
                  {masterclass.cover_image_url && (
                    <img src={masterclass.cover_image_url} alt="" className="rounded-lg w-full aspect-video object-cover" />
                  )}
                  {enrollment ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{language === "ar" ? "التقدم" : "Progress"}</span>
                          <span>{Math.round(enrollment.progress_percent || 0)}%</span>
                        </div>
                        <Progress value={enrollment.progress_percent || 0} />
                        <p className="text-xs text-muted-foreground">
                          {completedLessons}/{totalLessons} {language === "ar" ? "دروس مكتملة" : "lessons completed"}
                        </p>
                      </div>
                      {isCompleted && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-500/10 rounded-lg p-3">
                          <GraduationCap className="h-5 w-5" />
                          <span className="font-medium">{language === "ar" ? "تم الإكمال!" : "Completed!"}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {!masterclass.is_free && (
                        <div className="text-2xl font-bold">
                          {masterclass.price} {masterclass.currency}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => user ? enrollMutation.mutate() : navigate("/auth")}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending
                          ? (language === "ar" ? "جاري التسجيل..." : "Enrolling...")
                          : (language === "ar" ? "سجل الآن" : "Enroll Now")}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* What you'll learn */}
        {masterclass.what_you_learn && masterclass.what_you_learn.length > 0 && (
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "ماذا ستتعلم" : "What you'll learn"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(language === "ar" && masterclass.what_you_learn_ar?.length
                    ? masterclass.what_you_learn_ar
                    : masterclass.what_you_learn
                  ).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Content */}
        <div className="container mx-auto px-4 pb-12">
          <h2 className="text-xl font-semibold mb-4">
            {language === "ar" ? "محتوى الدورة" : "Course Content"}
          </h2>
          <Accordion type="multiple" className="space-y-2">
            {modules.map((module: any) => {
              const lessons = module.masterclass_lessons || [];
              const sortedLessons = [...lessons].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
              const moduleCompletedCount = sortedLessons.filter((l: any) => completedLessonIds.has(l.id)).length;

              return (
                <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div>
                        <p className="font-medium">
                          {language === "ar" && module.title_ar ? module.title_ar : module.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sortedLessons.length} {language === "ar" ? "دروس" : "lessons"}
                          {enrollment && ` • ${moduleCompletedCount}/${sortedLessons.length} ${language === "ar" ? "مكتمل" : "done"}`}
                        </p>
                      </div>
                      {module.is_free_preview && (
                        <Badge variant="outline" className="text-xs">
                          {language === "ar" ? "معاينة مجانية" : "Free Preview"}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {sortedLessons.map((lesson: any) => {
                        const isLessonCompleted = completedLessonIds.has(lesson.id);
                        const canAccess = enrollment || module.is_free_preview;

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between rounded-md p-3 hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isLessonCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : canAccess ? (
                                getContentTypeIcon(lesson.content_type)
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {language === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.content_type}</span>
                                  {lesson.duration_minutes && <span>• {lesson.duration_minutes} min</span>}
                                </div>
                              </div>
                            </div>
                            {enrollment && !isLessonCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => completeLessonMutation.mutate(lesson.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {language === "ar" ? "إكمال" : "Complete"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
