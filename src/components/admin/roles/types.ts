import type { Database } from "@/integrations/supabase/types";
import {
  Shield, ChefHat, Award, Users, Hand, Heart, Headphones, Eye, PenTool,
} from "lucide-react";

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface RoleMeta {
  icon: typeof Shield;
  color: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
}

export const ROLE_META: Record<AppRole, RoleMeta> = {
  chef: { icon: ChefHat, color: "bg-chart-2/10 text-chart-2", labelEn: "Chef", labelAr: "شيف", descEn: "Professional chefs", descAr: "الطهاة المحترفين" },
  judge: { icon: Award, color: "bg-chart-3/10 text-chart-3", labelEn: "Judge", labelAr: "حَكَم", descEn: "Competition judges", descAr: "حكام المسابقات" },
  student: { icon: Users, color: "bg-primary/10 text-primary", labelEn: "Student", labelAr: "طالب", descEn: "Culinary students", descAr: "طلاب الطهي" },
  organizer: { icon: Shield, color: "bg-destructive/10 text-destructive", labelEn: "Organizer", labelAr: "منظم", descEn: "Event organizers", descAr: "منظمو الفعاليات" },
  volunteer: { icon: Hand, color: "bg-chart-5/10 text-chart-5", labelEn: "Volunteer", labelAr: "متطوع", descEn: "Platform volunteers", descAr: "المتطوعون" },
  sponsor: { icon: Heart, color: "bg-chart-1/10 text-chart-1", labelEn: "Sponsor", labelAr: "راعي", descEn: "Corporate sponsors", descAr: "الرعاة" },
  assistant: { icon: Headphones, color: "bg-accent text-accent-foreground", labelEn: "Assistant", labelAr: "مساعد", descEn: "Support assistants", descAr: "مساعدو الدعم" },
  supervisor: { icon: Eye, color: "bg-chart-4/10 text-chart-4", labelEn: "Supervisor", labelAr: "مشرف", descEn: "Platform supervisors", descAr: "مشرفو المنصة" },
  content_writer: { icon: PenTool, color: "bg-chart-1/10 text-chart-1", labelEn: "Content Writer", labelAr: "كاتب محتوى", descEn: "Content & SEO specialists", descAr: "متخصصو المحتوى والسيو" },
};

export const ALL_ROLES: AppRole[] = ["supervisor", "organizer", "content_writer", "judge", "chef", "student", "volunteer", "sponsor", "assistant"];
