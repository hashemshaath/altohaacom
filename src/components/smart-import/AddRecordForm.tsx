import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Loader2, MapPin, Star, Calendar, Phone, Hash,
} from "lucide-react";
import type { ImportedData } from "./SmartImportDialog";
import {
  type TargetTable, type EntityType, type CompanyType, type ExhibitionType,
  TARGET_TABLE_OPTIONS, ENTITY_TYPE_LABELS, COMPANY_TYPE_LABELS,
  ESTABLISHMENT_TYPES, EXHIBITION_TYPE_LABELS, countFields,
} from "./types";

interface AddRecordFormProps {
  details: ImportedData;
  targetTable: TargetTable;
  onTargetTableChange: (t: TargetTable) => void;
  selectedEntityType: EntityType;
  onEntityTypeChange: (t: EntityType) => void;
  selectedCompanyType: CompanyType;
  onCompanyTypeChange: (t: CompanyType) => void;
  selectedEstablishmentType: string;
  onEstablishmentTypeChange: (t: string) => void;
  selectedExhibitionType: ExhibitionType;
  onExhibitionTypeChange: (t: ExhibitionType) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isAr: boolean;
}

export const AddRecordForm = React.memo(({
  details, targetTable, onTargetTableChange,
  selectedEntityType, onEntityTypeChange,
  selectedCompanyType, onCompanyTypeChange,
  selectedEstablishmentType, onEstablishmentTypeChange,
  selectedExhibitionType, onExhibitionTypeChange,
  saving, onSave, onCancel, isAr,
}: AddRecordFormProps) => {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {isAr ? "إضافة سجل جديد" : "Add New Record"}
          </span>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </CardTitle>
        <CardDescription>
          {isAr ? "حدد الجدول والنوع لإضافة البيانات المستخرجة" : "Select target table and type to add extracted data"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Summary */}
        <div className="rounded-lg border p-3 bg-background space-y-1.5">
          <p className="text-sm font-semibold">{details?.name_en || details?.name_ar}</p>
          {details?.name_ar && details?.name_en && <p className="text-xs text-muted-foreground">{details.name_ar}</p>}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {details?.city_en && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{details.city_en}</span>}
            {details?.rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{details.rating}</span>}
            {details?.founded_year && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{details.founded_year}</span>}
            {details?.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{details.phone}</span>}
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {isAr ? `سيتم استيراد ${countFields(details)} حقل بيانات` : `${countFields(details)} data fields will be imported`}
          </p>
        </div>

        {/* Target Table Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{isAr ? "الجدول المستهدف" : "Target Table"} *</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {TARGET_TABLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = targetTable === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center ${
                    isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => onTargetTableChange(opt.value)}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-primary' : ''}`}>
                    {isAr ? opt.label_ar : opt.label_en}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {isAr ? opt.description_ar : opt.description_en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-type selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {targetTable === "culinary_entities" ? (isAr ? "نوع الكيان" : "Entity Type")
              : targetTable === "companies" ? (isAr ? "نوع الشركة" : "Company Type")
              : targetTable === "exhibitions" ? (isAr ? "نوع الحدث" : "Event Type")
              : targetTable === "competitions" ? (isAr ? "المسابقة" : "Competition")
              : (isAr ? "نوع المنشأة" : "Establishment Type")} *
          </Label>
          {targetTable === "culinary_entities" && (
            <Select value={selectedEntityType} onValueChange={(v) => onEntityTypeChange(v as EntityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, labels]) => (
                  <SelectItem key={value} value={value}>{isAr ? labels.ar : labels.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {targetTable === "companies" && (
            <Select value={selectedCompanyType} onValueChange={(v) => onCompanyTypeChange(v as CompanyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(COMPANY_TYPE_LABELS).map(([value, labels]) => (
                  <SelectItem key={value} value={value}>{isAr ? labels.ar : labels.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {targetTable === "establishments" && (
            <Select value={selectedEstablishmentType} onValueChange={onEstablishmentTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTABLISHMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {targetTable === "exhibitions" && (
            <Select value={selectedExhibitionType} onValueChange={(v) => onExhibitionTypeChange(v as ExhibitionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXHIBITION_TYPE_LABELS).map(([value, labels]) => (
                  <SelectItem key={value} value={value}>{isAr ? labels.ar : labels.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {targetTable === "competitions" && (
            <div className="text-xs text-muted-foreground p-2 border rounded-lg bg-muted/30">
              {isAr ? "سيتم إنشاء مسابقة بحالة مسودة — يمكنك تعديل التفاصيل لاحقاً" : "A draft competition will be created — you can edit details later"}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Hash className="h-4 w-4 shrink-0" />
          {targetTable === "culinary_entities"
            ? (isAr ? "سيتم تعيين رقم تسلسلي جديد تلقائياً (ENT...)" : "A new serial number (ENT...) will be auto-assigned")
            : targetTable === "companies"
              ? (isAr ? "سيتم تعيين رقم شركة جديد تلقائياً (C...)" : "A new company number (C...) will be auto-assigned")
              : targetTable === "exhibitions"
                ? (isAr ? "سيتم إنشاء معرض/مؤتمر جديد بحالة مسودة" : "A new exhibition/conference will be created as draft")
                : targetTable === "competitions"
                  ? (isAr ? "سيتم إنشاء مسابقة جديدة بحالة مسودة" : "A new competition will be created as draft")
                  : (isAr ? "سيتم إنشاء سجل منشأة جديد" : "A new establishment record will be created")}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={onSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add Record")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
AddRecordForm.displayName = "AddRecordForm";
