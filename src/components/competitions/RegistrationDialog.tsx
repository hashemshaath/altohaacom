import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, X, Loader2, ArrowLeft } from "lucide-react";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  max_participants: number | null;
}

interface RegistrationFormProps {
  competitionId: string;
  competitionTitle: string;
  categories: Category[];
  onCancel: () => void;
  onSuccess: () => void;
}

export function RegistrationForm({
  competitionId,
  competitionTitle,
  categories,
  onCancel,
  onSuccess,
}: RegistrationFormProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dishName, setDishName] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setDishName("");
    setDishDescription("");
    setCategoryId("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: language === "ar" ? "نوع ملف غير صالح" : "Invalid file type",
          description: language === "ar" ? "الرجاء اختيار صورة" : "Please select an image file",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: language === "ar" ? "الملف كبير جداً" : "File too large",
          description: language === "ar" ? "الحد الأقصى 5 ميجابايت" : "Maximum file size is 5MB",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}/${competitionId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("dish-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from("dish-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      setUploading(true);

      // Upload image if provided
      let dishImageUrl: string | null = null;
      if (imageFile) {
        dishImageUrl = await uploadImage();
      }

      // Create registration
      const { error } = await supabase
        .from("competition_registrations")
        .insert({
          competition_id: competitionId,
          participant_id: user.id,
          dish_name: dishName.trim() || null,
          dish_description: dishDescription.trim() || null,
          dish_image_url: dishImageUrl,
          category_id: categoryId || null,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registration", competitionId] });
      toast({
        title: language === "ar" ? "تم تقديم التسجيل!" : "Registration submitted!",
        description:
          language === "ar"
            ? "تسجيلك في انتظار الموافقة."
            : "Your registration is pending approval.",
      });
      resetForm();
      onSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "فشل التسجيل" : "Registration failed",
        description: error.message,
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!dishName.trim()) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "اسم الطبق مطلوب" : "Dish name required",
        description:
          language === "ar" ? "الرجاء إدخال اسم طبقك" : "Please enter your dish name",
      });
      return;
    }

    if (dishName.trim().length > 100) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "الاسم طويل جداً" : "Name too long",
        description:
          language === "ar" ? "الحد الأقصى 100 حرف" : "Maximum 100 characters",
      });
      return;
    }

    if (dishDescription.length > 500) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "الوصف طويل جداً" : "Description too long",
        description:
          language === "ar" ? "الحد الأقصى 500 حرف" : "Maximum 500 characters",
      });
      return;
    }

    registerMutation.mutate();
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>
              {language === "ar" ? "التسجيل في المسابقة" : "Register for Competition"}
            </CardTitle>
            <CardDescription>{competitionTitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dish Name */}
          <div className="space-y-2">
            <Label htmlFor="dish-name">
              {language === "ar" ? "اسم الطبق" : "Dish Name"} *
            </Label>
            <Input
              id="dish-name"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder={
                language === "ar"
                  ? "مثال: شواء البحر الأبيض المتوسط"
                  : "e.g., Mediterranean Grilled Sea Bass"
              }
              maxLength={100}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              {dishName.length}/100 {language === "ar" ? "حرف" : "characters"}
            </p>
          </div>

          {/* Dish Description */}
          <div className="space-y-2">
            <Label htmlFor="dish-description">
              {language === "ar" ? "وصف الطبق" : "Dish Description"}
            </Label>
            <Textarea
              id="dish-description"
              value={dishDescription}
              onChange={(e) => setDishDescription(e.target.value)}
              placeholder={
                language === "ar"
                  ? "صف طبقك ومكوناته وطريقة تحضيره..."
                  : "Describe your dish, ingredients, and preparation method..."
              }
              rows={3}
              maxLength={500}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              {dishDescription.length}/500 {language === "ar" ? "حرف" : "characters"}
            </p>
          </div>

          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>{language === "ar" ? "الفئة" : "Category"}</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={language === "ar" ? "اختر فئة (اختياري)" : "Select a category (optional)"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {language === "ar" && cat.name_ar ? cat.name_ar : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dish Image Upload */}
          <div className="space-y-2">
            <Label>{language === "ar" ? "صورة الطبق" : "Dish Photo"}</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={uploading}
            />

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Dish preview"
                  className="h-48 w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={removeImage}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
              >
                <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "انقر لإضافة صورة" : "Click to add a photo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "الحد الأقصى 5 ميجابايت" : "Max 5MB"}
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={uploading || registerMutation.isPending}>
              {uploading || registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "ar" ? "جاري التسجيل..." : "Registering..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {language === "ar" ? "تقديم التسجيل" : "Submit Registration"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Keep the old dialog interface for backwards compatibility but convert to inline
interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  competitionTitle: string;
  categories: Category[];
}

export function RegistrationDialog({
  open,
  onOpenChange,
  competitionId,
  competitionTitle,
  categories,
}: RegistrationDialogProps) {
  if (!open) return null;
  
  return (
    <RegistrationForm
      competitionId={competitionId}
      competitionTitle={competitionTitle}
      categories={categories}
      onCancel={() => onOpenChange(false)}
      onSuccess={() => onOpenChange(false)}
    />
  );
}
