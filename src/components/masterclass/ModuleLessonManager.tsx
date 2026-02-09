import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Trash2, GripVertical, Save, BookOpen, PlayCircle, FileText,
  ChevronUp, ChevronDown, X,
} from "lucide-react";

interface Props {
  masterclassId: string;
}

export function ModuleLessonManager({ masterclassId }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddModule, setShowAddModule] = useState(false);
  const [addingLessonToModule, setAddingLessonToModule] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", title_ar: "", description: "", is_free_preview: false });
  const [lessonForm, setLessonForm] = useState({
    title: "", title_ar: "", content: "", content_ar: "",
    content_type: "article", video_url: "", duration_minutes: 0,
  });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["admin-modules", masterclassId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("masterclass_modules")
        .select("*, masterclass_lessons(*)")
        .eq("masterclass_id", masterclassId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const addModuleMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = modules.reduce((max: number, m: any) => Math.max(max, m.sort_order || 0), 0);
      const { error } = await supabase.from("masterclass_modules").insert({
        masterclass_id: masterclassId,
        title: moduleForm.title,
        title_ar: moduleForm.title_ar || null,
        description: moduleForm.description || null,
        is_free_preview: moduleForm.is_free_preview,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules", masterclassId] });
      setShowAddModule(false);
      setModuleForm({ title: "", title_ar: "", description: "", is_free_preview: false });
      toast({ title: language === "ar" ? "تمت إضافة الوحدة" : "Module added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("masterclass_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules", masterclassId] });
      toast({ title: language === "ar" ? "تم حذف الوحدة" : "Module deleted" });
    },
  });

  const moveModuleMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = modules.findIndex((m: any) => m.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= modules.length) return;
      const current = modules[idx];
      const swap = modules[swapIdx];
      await Promise.all([
        supabase.from("masterclass_modules").update({ sort_order: swap.sort_order }).eq("id", current.id),
        supabase.from("masterclass_modules").update({ sort_order: current.sort_order }).eq("id", swap.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-modules", masterclassId] }),
  });

  const addLessonMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const module = modules.find((m: any) => m.id === moduleId);
      const lessons = module?.masterclass_lessons || [];
      const maxOrder = lessons.reduce((max: number, l: any) => Math.max(max, l.sort_order || 0), 0);
      const { error } = await supabase.from("masterclass_lessons").insert({
        module_id: moduleId,
        title: lessonForm.title,
        title_ar: lessonForm.title_ar || null,
        content: lessonForm.content || null,
        content_ar: lessonForm.content_ar || null,
        content_type: lessonForm.content_type,
        video_url: lessonForm.video_url || null,
        duration_minutes: lessonForm.duration_minutes || null,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules", masterclassId] });
      setAddingLessonToModule(null);
      setLessonForm({ title: "", title_ar: "", content: "", content_ar: "", content_type: "article", video_url: "", duration_minutes: 0 });
      toast({ title: language === "ar" ? "تمت إضافة الدرس" : "Lesson added" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("masterclass_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-modules", masterclassId] });
      toast({ title: language === "ar" ? "تم حذف الدرس" : "Lesson deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {language === "ar" ? "الوحدات والدروس" : "Modules & Lessons"}
        </h3>
        <Button size="sm" onClick={() => setShowAddModule(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة وحدة" : "Add Module"}
        </Button>
      </div>

      {/* Add Module Form */}
      {showAddModule && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{language === "ar" ? "العنوان (إنجليزي)" : "Title (EN)"}</Label>
                <Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} />
              </div>
              <div>
                <Label>{language === "ar" ? "العنوان (عربي)" : "Title (AR)"}</Label>
                <Input value={moduleForm.title_ar} onChange={(e) => setModuleForm({ ...moduleForm, title_ar: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div>
              <Label>{language === "ar" ? "الوصف" : "Description"}</Label>
              <Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={moduleForm.is_free_preview} onCheckedChange={(v) => setModuleForm({ ...moduleForm, is_free_preview: v })} />
              <Label>{language === "ar" ? "معاينة مجانية" : "Free Preview"}</Label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addModuleMutation.mutate()} disabled={!moduleForm.title}>
                <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddModule(false)}>
                <X className="mr-2 h-4 w-4" /> {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد وحدات بعد" : "No modules yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {modules.map((module: any, idx: number) => {
            const lessons = [...(module.masterclass_lessons || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            return (
              <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left flex-1">
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0}
                        onClick={(e) => { e.stopPropagation(); moveModuleMutation.mutate({ id: module.id, direction: "up" }); }}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === modules.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveModuleMutation.mutate({ id: module.id, direction: "down" }); }}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{language === "ar" && module.title_ar ? module.title_ar : module.title}</p>
                      <p className="text-xs text-muted-foreground">{lessons.length} {language === "ar" ? "دروس" : "lessons"}</p>
                    </div>
                    {module.is_free_preview && <Badge variant="outline" className="text-xs">{language === "ar" ? "مجانية" : "Free"}</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={(e) => { e.stopPropagation(); if (confirm("Delete this module?")) deleteModuleMutation.mutate(module.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {lessons.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-3">
                          {lesson.content_type === "video" ? <PlayCircle className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                          <div>
                            <p className="text-sm font-medium">{language === "ar" && lesson.title_ar ? lesson.title_ar : lesson.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {lesson.content_type}{lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => deleteLessonMutation.mutate(lesson.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Add Lesson */}
                    {addingLessonToModule === module.id ? (
                      <Card className="mt-2">
                        <CardContent className="p-3 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <Label className="text-xs">{language === "ar" ? "عنوان الدرس (EN)" : "Lesson Title (EN)"}</Label>
                              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "ar" ? "عنوان الدرس (AR)" : "Lesson Title (AR)"}</Label>
                              <Input value={lessonForm.title_ar} onChange={(e) => setLessonForm({ ...lessonForm, title_ar: e.target.value })} dir="rtl" />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <Label className="text-xs">{language === "ar" ? "نوع المحتوى" : "Content Type"}</Label>
                              <Select value={lessonForm.content_type} onValueChange={(v) => setLessonForm({ ...lessonForm, content_type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="article">{language === "ar" ? "مقال" : "Article"}</SelectItem>
                                  <SelectItem value="video">{language === "ar" ? "فيديو" : "Video"}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">{language === "ar" ? "المدة (دقائق)" : "Duration (min)"}</Label>
                              <Input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })} />
                            </div>
                          </div>
                          {lessonForm.content_type === "video" && (
                            <div>
                              <Label className="text-xs">{language === "ar" ? "رابط الفيديو" : "Video URL"}</Label>
                              <Input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/..." />
                            </div>
                          )}
                          <div>
                            <Label className="text-xs">{language === "ar" ? "المحتوى (EN)" : "Content (EN)"}</Label>
                            <Textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} rows={3} />
                          </div>
                          <div>
                            <Label className="text-xs">{language === "ar" ? "المحتوى (AR)" : "Content (AR)"}</Label>
                            <Textarea value={lessonForm.content_ar} onChange={(e) => setLessonForm({ ...lessonForm, content_ar: e.target.value })} rows={3} dir="rtl" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => addLessonMutation.mutate(module.id)} disabled={!lessonForm.title}>
                              <Save className="mr-2 h-4 w-4" /> {language === "ar" ? "حفظ" : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAddingLessonToModule(null)}>
                              {language === "ar" ? "إلغاء" : "Cancel"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setAddingLessonToModule(module.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {language === "ar" ? "إضافة درس" : "Add Lesson"}
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
