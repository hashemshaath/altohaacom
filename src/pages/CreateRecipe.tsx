import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRecipe } from "@/hooks/useRecipes";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, UtensilsCrossed, GripVertical, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categoryOptions = [
  { value: "appetizer", en: "Appetizer", ar: "مقبلات" },
  { value: "main_course", en: "Main Course", ar: "طبق رئيسي" },
  { value: "dessert", en: "Dessert", ar: "حلويات" },
  { value: "salad", en: "Salad", ar: "سلطة" },
  { value: "soup", en: "Soup", ar: "شوربة" },
  { value: "beverage", en: "Beverage", ar: "مشروب" },
  { value: "snack", en: "Snack", ar: "وجبة خفيفة" },
  { value: "bread", en: "Bread", ar: "خبز" },
  { value: "sauce", en: "Sauce", ar: "صلصة" },
  { value: "side_dish", en: "Side Dish", ar: "طبق جانبي" },
];

export default function CreateRecipe() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [category, setCategory] = useState("main_course");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isAr ? "الحد الأقصى 5 ميجابايت" : "Max file size is 5MB");
      return;
    }
    setUploadingImage(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `recipes/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("user-media").upload(path, file, { contentType: file.type });
    if (error) {
      toast.error(error.message);
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(false);
  };

  // Nutrition
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [fiberG, setFiberG] = useState("");

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, val: string) => {
    const copy = [...ingredients];
    copy[i] = val;
    setIngredients(copy);
  };

  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, val: string) => {
    const copy = [...steps];
    copy[i] = val;
    setSteps(copy);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error(isAr ? "العنوان مطلوب" : "Title is required");
      return;
    }
    if (ingredients.filter(i => i.trim()).length === 0) {
      toast.error(isAr ? "أضف مكوناً واحداً على الأقل" : "Add at least one ingredient");
      return;
    }
    if (steps.filter(s => s.trim()).length === 0) {
      toast.error(isAr ? "أضف خطوة واحدة على الأقل" : "Add at least one step");
      return;
    }

    try {
      const data = await createRecipe.mutateAsync({
        title: title.trim(),
        title_ar: titleAr.trim() || undefined,
        description: description.trim() || undefined,
        description_ar: descriptionAr.trim() || undefined,
        cuisine: cuisine.trim() || undefined,
        difficulty,
        category,
        prep_time_minutes: prepTime ? parseInt(prepTime) : undefined,
        cook_time_minutes: cookTime ? parseInt(cookTime) : undefined,
        servings: servings ? parseInt(servings) : undefined,
        calories: calories ? parseInt(calories) : undefined,
        protein_g: proteinG ? parseFloat(proteinG) : undefined,
        carbs_g: carbsG ? parseFloat(carbsG) : undefined,
        fat_g: fatG ? parseFloat(fatG) : undefined,
        fiber_g: fiberG ? parseFloat(fiberG) : undefined,
        ingredients: ingredients.filter(i => i.trim()),
        steps: steps.filter(s => s.trim()),
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        image_url: imageUrl.trim() || undefined,
        is_published: isPublished,
      });
      toast.success(isAr ? "تم إنشاء الوصفة!" : "Recipe created!");
      navigate(`/recipes/${data.slug || data.id}`);
    } catch (err: any) {
      toast.error(err.message || (isAr ? "خطأ في الإنشاء" : "Failed to create recipe"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title={isAr ? "إضافة وصفة" : "Add Recipe"} />
      <Header />

      <main className="flex-1">
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8">
            <Button variant="ghost" size="sm" className="-ms-2 mb-4" onClick={() => navigate("/recipes")}>
              <ArrowLeft className="me-1.5 h-4 w-4" />
              {isAr ? "العودة للوصفات" : "Back to Recipes"}
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
                <UtensilsCrossed className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold md:text-3xl">{isAr ? "إضافة وصفة جديدة" : "Add New Recipe"}</h1>
                <p className="text-sm text-muted-foreground">{isAr ? "شارك وصفتك مع مجتمع الطهاة" : "Share your recipe with the culinary community"}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle>{isAr ? "المعلومات الأساسية" : "Basic Information"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان" : "Title"} *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isAr ? "اسم الوصفة" : "Recipe name"} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "العنوان بالعربية" : "Title (Arabic)"}</Label>
                    <Input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الوصف" : "Description"}</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={isAr ? "وصف مختصر للوصفة" : "Brief description of the recipe"} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الوصف بالعربية" : "Description (Arabic)"}</Label>
                  <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} rows={2} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "صورة الوصفة" : "Recipe Image"}</Label>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {imagePreview || imageUrl ? (
                    <div className="relative rounded-xl border border-border overflow-hidden group">
                      <img src={imagePreview || imageUrl} alt="" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => imageInputRef.current?.click()}>
                          {isAr ? "تغيير" : "Change"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => { setImageUrl(""); setImagePreview(null); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 bg-muted/20 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground/50" />
                          <span className="text-xs text-muted-foreground">{isAr ? "اضغط لرفع صورة" : "Click to upload image"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{isAr ? "المطبخ" : "Cuisine"}</Label>
                    <Input value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder={isAr ? "مثال: عربي" : "e.g. Arabic"} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الصعوبة" : "Difficulty"}</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{isAr ? "سهل" : "Easy"}</SelectItem>
                        <SelectItem value="medium">{isAr ? "متوسط" : "Medium"}</SelectItem>
                        <SelectItem value="hard">{isAr ? "صعب" : "Hard"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "الفئة" : "Category"}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(c => (
                          <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{isAr ? "وقت التحضير (دقائق)" : "Prep Time (min)"}</Label>
                    <Input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "وقت الطبخ (دقائق)" : "Cook Time (min)"}</Label>
                    <Input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "عدد الحصص" : "Servings"}</Label>
                    <Input type="number" value={servings} onChange={e => setServings(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma-separated)"}</Label>
                  <Input value={tags} onChange={e => setTags(e.target.value)} placeholder={isAr ? "حار، صحي، سريع" : "spicy, healthy, quick"} />
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isAr ? "المكونات" : "Ingredients"}</CardTitle>
                  <Badge variant="secondary">{ingredients.filter(i => i.trim()).length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <Input
                      value={ing}
                      onChange={e => updateIngredient(i, e.target.value)}
                      placeholder={isAr ? `مكون ${i + 1}` : `Ingredient ${i + 1}`}
                      className="flex-1"
                    />
                    {ingredients.length > 1 && (
                      <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeIngredient(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addIngredient} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {isAr ? "إضافة مكون" : "Add Ingredient"}
                </Button>
              </CardContent>
            </Card>

            {/* Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isAr ? "الخطوات" : "Instructions"}</CardTitle>
                  <Badge variant="secondary">{steps.filter(s => s.trim()).length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-1">
                      {i + 1}
                    </div>
                    <Textarea
                      value={step}
                      onChange={e => updateStep(i, e.target.value)}
                      placeholder={isAr ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                      rows={2}
                      className="flex-1"
                    />
                    {steps.length > 1 && (
                      <Button variant="ghost" size="icon" className="shrink-0 text-destructive mt-1" onClick={() => removeStep(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {isAr ? "إضافة خطوة" : "Add Step"}
                </Button>
              </CardContent>
            </Card>

            {/* Nutrition */}
            <Card>
              <CardHeader><CardTitle>{isAr ? "القيمة الغذائية (اختياري)" : "Nutrition Facts (optional)"}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
                  <div className="space-y-2">
                    <Label>{isAr ? "سعرات" : "Calories"}</Label>
                    <Input type="number" value={calories} onChange={e => setCalories(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "بروتين (غ)" : "Protein (g)"}</Label>
                    <Input type="number" step="0.1" value={proteinG} onChange={e => setProteinG(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "كربوهيدرات (غ)" : "Carbs (g)"}</Label>
                    <Input type="number" step="0.1" value={carbsG} onChange={e => setCarbsG(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "دهون (غ)" : "Fat (g)"}</Label>
                    <Input type="number" step="0.1" value={fatG} onChange={e => setFatG(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isAr ? "ألياف (غ)" : "Fiber (g)"}</Label>
                    <Input type="number" step="0.1" value={fiberG} onChange={e => setFiberG(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publish */}
            <Card>
              <CardContent className="flex items-center justify-between py-6">
                <div>
                  <p className="font-medium">{isAr ? "نشر الوصفة" : "Publish Recipe"}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? "الوصفة ستكون مرئية للجميع" : "Recipe will be visible to everyone"}</p>
                </div>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => navigate("/recipes")}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSubmit} disabled={createRecipe.isPending} className="min-w-32">
                {createRecipe.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الوصفة" : "Create Recipe")}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
