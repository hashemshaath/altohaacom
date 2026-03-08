import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, ClipboardList, ChefHat, Calendar, CheckSquare, Square, Users, Utensils } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  assignee?: string;
  done: boolean;
  priority: "low" | "medium" | "high";
}

interface RecipeItem {
  id: string;
  name: string;
  notes: string;
  ingredients: string[];
}

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  activity: string;
  location?: string;
}

export const TeamCollaborationPanel = memo(function TeamCollaborationPanel({ competitionId, isOrganizer }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tasks");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["team-workspaces", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_workspaces")
        .select("id, competition_id, registration_id, name, name_ar, task_board, recipe_plan, practice_schedule, created_at, updated_at")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: myRegistration } = useQuery({
    queryKey: ["my-reg-workspace", competitionId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("participant_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: async () => {
      if (!myRegistration?.id) throw new Error("No registration");
      const { error } = await supabase.from("team_workspaces").insert({
        competition_id: competitionId,
        registration_id: myRegistration.id,
        name: newWorkspaceName || "My Team Workspace",
        task_board: [] as unknown as Json,
        recipe_plan: [] as unknown as Json,
        practice_schedule: [] as unknown as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-workspaces", competitionId] });
      setShowCreateDialog(false);
      setNewWorkspaceName("");
      toast({ title: isAr ? "تم إنشاء مساحة العمل" : "Workspace created" });
    },
  });

  const updateWorkspace = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: Json }) => {
      const { error } = await supabase
        .from("team_workspaces")
        .update({ [field]: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-workspaces", competitionId] }),
  });

  const workspace = workspaces?.[0]; // Use first workspace

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  if (!workspace) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold mb-2">{isAr ? "مساحة عمل الفريق" : "Team Workspace"}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {isAr ? "أنشئ مساحة عمل مشتركة لتنظيم المهام والوصفات وجدول التدريب" : "Create a shared workspace to organize tasks, recipes, and practice schedule"}
          </p>
          {myRegistration ? (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="me-1.5 h-4 w-4" />{isAr ? "إنشاء مساحة عمل" : "Create Workspace"}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isAr ? "مساحة عمل جديدة" : "New Workspace"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder={isAr ? "اسم المساحة" : "Workspace name"}
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                  />
                  <Button onClick={() => createWorkspace.mutate()} disabled={createWorkspace.isPending} className="w-full">
                    {createWorkspace.isPending ? "..." : isAr ? "إنشاء" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-xs text-muted-foreground">{isAr ? "يجب التسجيل أولاً" : "Register first to create a workspace"}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const tasks: TaskItem[] = Array.isArray(workspace.task_board) ? (workspace.task_board as any[]) : [];
  const recipes: RecipeItem[] = Array.isArray(workspace.recipe_plan) ? (workspace.recipe_plan as any[]) : [];
  const schedule: ScheduleItem[] = Array.isArray(workspace.practice_schedule) ? (workspace.practice_schedule as any[]) : [];

  const addTask = () => {
    const newTask: TaskItem = { id: crypto.randomUUID(), title: "", assignee: "", done: false, priority: "medium" };
    updateWorkspace.mutate({ id: workspace.id, field: "task_board", value: [...tasks, newTask] as unknown as Json });
  };

  const toggleTask = (taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    updateWorkspace.mutate({ id: workspace.id, field: "task_board", value: updated as unknown as Json });
  };

  const updateTaskTitle = (taskId: string, title: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, title } : t);
    updateWorkspace.mutate({ id: workspace.id, field: "task_board", value: updated as unknown as Json });
  };

  const addRecipe = () => {
    const newRecipe: RecipeItem = { id: crypto.randomUUID(), name: "", notes: "", ingredients: [] };
    updateWorkspace.mutate({ id: workspace.id, field: "recipe_plan", value: [...recipes, newRecipe] as unknown as Json });
  };

  const updateRecipe = (recipeId: string, field: string, value: any) => {
    const updated = recipes.map(r => r.id === recipeId ? { ...r, [field]: value } : r);
    updateWorkspace.mutate({ id: workspace.id, field: "recipe_plan", value: updated as unknown as Json });
  };

  const addScheduleItem = () => {
    const item: ScheduleItem = { id: crypto.randomUUID(), date: "", time: "", activity: "" };
    updateWorkspace.mutate({ id: workspace.id, field: "practice_schedule", value: [...schedule, item] as unknown as Json });
  };

  const completedTasks = useMemo(() => tasks.filter(t => t.done).length, [tasks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{workspace.name || (isAr ? "مساحة العمل" : "Workspace")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {tasks.length} {isAr ? "مهمة" : "tasks"} • {recipes.length} {isAr ? "وصفة" : "recipes"}
            </p>
          </div>
        </div>
        {tasks.length > 0 && (
          <Badge variant="outline" className="text-xs">{completedTasks}/{tasks.length} {isAr ? "مكتمل" : "done"}</Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="tasks" className="flex-1 gap-1.5"><ClipboardList className="h-3.5 w-3.5" />{isAr ? "المهام" : "Tasks"}</TabsTrigger>
          <TabsTrigger value="recipes" className="flex-1 gap-1.5"><Utensils className="h-3.5 w-3.5" />{isAr ? "الوصفات" : "Recipes"}</TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 gap-1.5"><Calendar className="h-3.5 w-3.5" />{isAr ? "الجدول" : "Schedule"}</TabsTrigger>
        </TabsList>

        {/* Tasks */}
        <TabsContent value="tasks" className="space-y-2 mt-4">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 rounded-xl border border-border/60 p-2.5 group">
              <button onClick={() => toggleTask(task.id)} className="shrink-0">
                {task.done ? <CheckSquare className="h-4 w-4 text-chart-5" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              </button>
              <Input
                value={task.title}
                onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                placeholder={isAr ? "عنوان المهمة..." : "Task title..."}
                className={`border-0 p-0 h-auto text-sm bg-transparent focus-visible:ring-0 ${task.done ? "line-through text-muted-foreground" : ""}`}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addTask} className="w-full">
            <Plus className="me-1.5 h-3.5 w-3.5" />{isAr ? "إضافة مهمة" : "Add Task"}
          </Button>
        </TabsContent>

        {/* Recipes */}
        <TabsContent value="recipes" className="space-y-3 mt-4">
          {recipes.map(recipe => (
            <Card key={recipe.id} className="border-border/60">
              <CardContent className="p-3 space-y-2">
                <Input
                  value={recipe.name}
                  onChange={(e) => updateRecipe(recipe.id, "name", e.target.value)}
                  placeholder={isAr ? "اسم الوصفة..." : "Recipe name..."}
                  className="font-semibold"
                />
                <Textarea
                  value={recipe.notes}
                  onChange={(e) => updateRecipe(recipe.id, "notes", e.target.value)}
                  placeholder={isAr ? "ملاحظات وتعليمات..." : "Notes & instructions..."}
                  className="min-h-[60px] text-sm"
                />
                <Input
                  value={recipe.ingredients?.join(", ") || ""}
                  onChange={(e) => updateRecipe(recipe.id, "ingredients", e.target.value.split(",").map(s => s.trim()))}
                  placeholder={isAr ? "المكونات (مفصولة بفواصل)" : "Ingredients (comma-separated)"}
                  className="text-xs"
                />
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={addRecipe} className="w-full">
            <Plus className="me-1.5 h-3.5 w-3.5" />{isAr ? "إضافة وصفة" : "Add Recipe"}
          </Button>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-2 mt-4">
          {schedule.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-2.5">
              <Input
                type="date"
                value={item.date}
                onChange={(e) => {
                  const updated = [...schedule];
                  updated[idx] = { ...item, date: e.target.value };
                  updateWorkspace.mutate({ id: workspace.id, field: "practice_schedule", value: updated as unknown as Json });
                }}
                className="text-xs"
              />
              <Input
                type="time"
                value={item.time}
                onChange={(e) => {
                  const updated = [...schedule];
                  updated[idx] = { ...item, time: e.target.value };
                  updateWorkspace.mutate({ id: workspace.id, field: "practice_schedule", value: updated as unknown as Json });
                }}
                className="text-xs"
              />
              <Input
                value={item.activity}
                onChange={(e) => {
                  const updated = [...schedule];
                  updated[idx] = { ...item, activity: e.target.value };
                  updateWorkspace.mutate({ id: workspace.id, field: "practice_schedule", value: updated as unknown as Json });
                }}
                placeholder={isAr ? "النشاط" : "Activity"}
                className="text-xs"
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addScheduleItem} className="w-full">
            <Plus className="me-1.5 h-3.5 w-3.5" />{isAr ? "إضافة جلسة" : "Add Session"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
});
