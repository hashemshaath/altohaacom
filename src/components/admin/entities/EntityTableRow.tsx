import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { Building2, Eye, EyeOff, Pencil, Settings2, ShieldCheck, Trash2, Users } from "lucide-react";

interface EntityRow {
  id: string;
  entity_number: string;
  name: string;
  name_ar: string | null;
  username: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  type: string;
  scope: string;
  status: string;
  is_visible: boolean;
  is_verified: boolean;
  entity_followers?: { id: string }[];
}

interface Props {
  entity: EntityRow;
  typeLabel?: { en: string; ar: string };
  scopeLabel?: { en: string; ar: string };
  onEdit: (entity: EntityRow) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onManage: (id: string, name: string) => void;
}

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; labelEn: string; labelAr: string }> = {
  active: { variant: "default", labelEn: "Active", labelAr: "نشط" },
  pending: { variant: "outline", labelEn: "Pending", labelAr: "قيد المراجعة" },
  suspended: { variant: "destructive", labelEn: "Suspended", labelAr: "موقوف" },
  archived: { variant: "secondary", labelEn: "Archived", labelAr: "مؤرشف" },
};

export default function EntityTableRow({ entity, typeLabel, scopeLabel, onEdit, onDelete, onToggleVisibility, onManage }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const displayName = isAr && entity.name_ar ? entity.name_ar : entity.name;
  const followers = (entity as any).entity_followers?.length || 0;
  const sc = statusConfig[entity.status] || statusConfig.pending;

  return (
    <>
      <TableRow className="group">
        <TableCell className="hidden xl:table-cell font-mono text-xs text-muted-foreground">{entity.entity_number}</TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            {entity.logo_url ? (
              <img src={entity.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover border shrink-0" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate max-w-[200px]">{displayName}</p>
              {entity.username && <p className="text-xs text-muted-foreground">@{entity.username}</p>}
              {entity.city && (
                <p className="text-xs text-muted-foreground truncate">
                  {entity.city}{entity.country ? `, ${entity.country}` : ""}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="text-xs whitespace-nowrap">{isAr ? typeLabel?.ar : typeLabel?.en}</Badge></TableCell>
        <TableCell className="hidden xl:table-cell"><Badge variant="outline" className="text-xs whitespace-nowrap">{isAr ? scopeLabel?.ar : scopeLabel?.en}</Badge></TableCell>
        <TableCell>
          <Badge variant={sc.variant} className="gap-1 whitespace-nowrap">
            {entity.is_verified && <ShieldCheck className="h-3 w-3" />}
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>
        </TableCell>
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onToggleVisibility(entity.id, !entity.is_visible)}>
                {entity.is_visible ? <Eye className="h-4 w-4 text-chart-3" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{entity.is_visible ? (isAr ? "مرئي" : "Visible") : (isAr ? "مخفي" : "Hidden")}</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            {followers}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onManage(entity.id, displayName)}>
                  <Settings2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "إدارة" : "Manage"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(entity as any)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "تعديل" : "Edit"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "حذف" : "Delete"}</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${displayName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${displayName}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDelete(entity.id)}>
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
