import { toast } from "@/hooks/use-toast";

type Variant = "default" | "destructive";

/**
 * Bilingual toast — picks the correct string automatically.
 *
 * Usage:
 *   biToast(isAr, "Saved", "تم الحفظ");
 *   biToast(isAr, "Saved", "تم الحفظ", { description: "Details here" });
 */
export function biToast(
  isAr: boolean,
  titleEn: string,
  titleAr: string,
  opts?: { description?: string; descriptionAr?: string; variant?: Variant }
) {
  toast({
    title: isAr ? titleAr : titleEn,
    description: opts?.descriptionAr && isAr ? opts.descriptionAr : opts?.description,
    variant: opts?.variant,
  });
}

/** Shorthand error toast */
export function errorToast(isAr: boolean, error?: unknown) {
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
  toast({
    variant: "destructive",
    title: isAr ? "حدث خطأ" : "Error",
    description: msg,
  });
}

/** Shorthand success toast */
export function successToast(isAr: boolean, en: string, ar: string) {
  toast({ title: isAr ? ar : en });
}
