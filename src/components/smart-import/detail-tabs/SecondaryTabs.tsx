import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DataField, TagList } from "../DataField";
import { Field } from "./Field";
import { StatCard } from "./StatCard";
import { GoogleMapEmbed } from "../GoogleMapEmbed";
import { ImagePreviewEditor } from "../ImagePreviewEditor";
import type { TabProps } from "./tabTypes";
import {
  Calendar, Users, Globe, MapPin, Building2, Briefcase, Clock,
  Star, Award, UserCheck, Shield, ExternalLink,
  Image as ImageIcon, BarChart3, Layers, Mic, ListChecks,
  Sparkles, Trophy, FileText,
} from "lucide-react";

// ── Address Tab ──
export const AddressTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardContent className="pt-4 space-y-4">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <Globe className="h-3 w-3" /> {isAr ? "الدولة والمنطقة" : "Country & Region"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isAr ? "الدولة (EN)" : "Country (EN)"} value={details.country_en} fieldKey="country_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="country_ar" pairedFieldValue={details.country_ar} />
          <Field label={isAr ? "الدولة (AR)" : "Country (AR)"} value={details.country_ar} fieldKey="country_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="country_en" pairedFieldValue={details.country_en} />
          <Field label={isAr ? "رمز الدولة" : "Country Code"} value={details.country_code} fieldKey="country_code" editing={editing} onFieldUpdate={onFieldUpdate} />
          <Field label={isAr ? "المنطقة (EN)" : "Region (EN)"} value={details.region_en} fieldKey="region_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="region_ar" pairedFieldValue={details.region_ar} />
          <Field label={isAr ? "المنطقة (AR)" : "Region (AR)"} value={details.region_ar} fieldKey="region_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="region_en" pairedFieldValue={details.region_en} />
          <Field label={isAr ? "المدينة (EN)" : "City (EN)"} value={details.city_en} fieldKey="city_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="city_ar" pairedFieldValue={details.city_ar} />
          <Field label={isAr ? "المدينة (AR)" : "City (AR)"} value={details.city_ar} fieldKey="city_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="city_en" pairedFieldValue={details.city_en} />
        </div>
        <Separator />
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <MapPin className="h-3 w-3" /> {isAr ? "الحي والشارع" : "District & Street"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isAr ? "الحي (EN)" : "District (EN)"} value={details.district_en || details.neighborhood_en} fieldKey="district_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="district_ar" pairedFieldValue={details.district_ar || details.neighborhood_ar} />
          <Field label={isAr ? "الحي (AR)" : "District (AR)"} value={details.district_ar || details.neighborhood_ar} fieldKey="district_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="district_en" pairedFieldValue={details.district_en || details.neighborhood_en} />
          <Field label={isAr ? "الشارع (EN)" : "Street (EN)"} value={details.street_en} fieldKey="street_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="street_ar" pairedFieldValue={details.street_ar} />
          <Field label={isAr ? "الشارع (AR)" : "Street (AR)"} value={details.street_ar} fieldKey="street_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="street_en" pairedFieldValue={details.street_en} />
        </div>
        <Separator />
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <Building2 className="h-3 w-3" /> {isAr ? "تفاصيل المبنى" : "Building Details"}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Field label={isAr ? "رقم المبنى" : "Building No."} value={details.building_number} fieldKey="building_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "الطابق" : "Floor"} value={details.floor_number} fieldKey="floor_number" editing={editing} onFieldUpdate={onFieldUpdate} />
          <Field label={isAr ? "رقم الوحدة" : "Unit No."} value={details.unit_number} fieldKey="unit_number" editing={editing} onFieldUpdate={onFieldUpdate} />
        </div>
        <Separator />
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <MapPin className="h-3 w-3" /> {isAr ? "العنوان الوطني والبريدي" : "National & Postal Address"}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label={isAr ? "الرمز البريدي" : "Postal Code"} value={details.postal_code} fieldKey="postal_code" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "الرقم الإضافي" : "Additional No."} value={details.additional_number} fieldKey="additional_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "العنوان المختصر" : "Short Address"} value={details.short_address} fieldKey="short_address" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        </div>
        <Field label={isAr ? "العنوان الوطني (EN)" : "National Address (EN)"} value={details.national_address_en} fieldKey="national_address_en" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="national_address_ar" pairedFieldValue={details.national_address_ar} />
        <Field label={isAr ? "العنوان الوطني (AR)" : "National Address (AR)"} value={details.national_address_ar} fieldKey="national_address_ar" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="national_address_en" pairedFieldValue={details.national_address_en} />
        <Separator />
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <FileText className="h-3 w-3" /> {isAr ? "العنوان الكامل" : "Full Address"}
        </h4>
        <Field label={isAr ? "العنوان الكامل (EN)" : "Full Address (EN)"} value={details.full_address_en} fieldKey="full_address_en" editing={editing} onFieldUpdate={onFieldUpdate} copyable multiline pairedFieldKey="full_address_ar" pairedFieldValue={details.full_address_ar} />
        <Field label={isAr ? "العنوان الكامل (AR)" : "Full Address (AR)"} value={details.full_address_ar} fieldKey="full_address_ar" editing={editing} onFieldUpdate={onFieldUpdate} copyable multiline pairedFieldKey="full_address_en" pairedFieldValue={details.full_address_en} />
        {(details.latitude || details.longitude) && (
          <>
            <Separator />
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
              <Globe className="h-3 w-3" /> {isAr ? "الإحداثيات" : "GPS Coordinates"}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <DataField label={isAr ? "خط العرض" : "Latitude"} value={details.latitude?.toString()} copyable />
              <DataField label={isAr ? "خط الطول" : "Longitude"} value={details.longitude?.toString()} copyable />
            </div>
          </>
        )}
      </CardContent>
    </Card>
    <GoogleMapEmbed latitude={details.latitude} longitude={details.longitude} name={details.name_en || details.name_ar} className="h-[400px]" />
  </div>
));
AddressTab.displayName = "AddressTab";

// ── Organization Tab ──
export const OrganizationTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><UserCheck className="h-4 w-4" />{isAr ? "القيادة" : "Leadership"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "الرئيس (EN)" : "President (EN)"} value={details.president_name_en} fieldKey="president_name_en" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "الرئيس (AR)" : "President (AR)"} value={details.president_name_ar} fieldKey="president_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "المدير التنفيذي (EN)" : "CEO/Director (EN)"} value={details.ceo_name_en} fieldKey="ceo_name_en" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "المدير التنفيذي (AR)" : "CEO/Director (AR)"} value={details.ceo_name_ar} fieldKey="ceo_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Shield className="h-4 w-4" />{isAr ? "معلومات قانونية" : "Legal Info"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "السجل التجاري" : "Commercial Reg."} value={details.commercial_reg} fieldKey="commercial_reg" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "الرقم الضريبي" : "Tax Number"} value={details.tax_number} fieldKey="tax_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "رقم الرخصة" : "License Number"} value={details.license_number} fieldKey="license_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "سنة التأسيس" : "Founded Year"} value={details.founded_year} fieldKey="founded_year" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "عدد الأعضاء" : "Member Count"} value={details.member_count} fieldKey="member_count" editing={editing} onFieldUpdate={onFieldUpdate} />
      </CardContent>
    </Card>
    {details.accreditations && details.accreditations.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "الاعتمادات" : "Accreditations"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {details.accreditations.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>)}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
));
OrganizationTab.displayName = "OrganizationTab";

// ── Services Tab ──
export const ServicesTab = React.memo(({ details, isAr }: { details: TabProps["details"]; isAr: boolean }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{isAr ? "الخدمات" : "Services"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <TagList label={isAr ? "الخدمات (EN)" : "Services (EN)"} items={details.services_en} />
        <TagList label={isAr ? "الخدمات (AR)" : "Services (AR)"} items={details.services_ar} />
        <TagList label={isAr ? "التخصصات" : "Specialties"} items={details.specialties} />
        <TagList label={isAr ? "المنتجات الرئيسية" : "Key Products"} items={details.key_products} />
        <TagList label={isAr ? "العلامات التجارية" : "Brands Carried"} items={details.brands_carried} />
        <TagList label={isAr ? "المأكولات" : "Cuisines"} items={details.cuisines} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Star className="h-4 w-4" />{isAr ? "الشهادات والمعايير" : "Certifications"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <TagList label={isAr ? "الشهادات" : "Certifications"} items={details.certifications} />
        <TagList label={isAr ? "الجوائز" : "Awards"} items={details.awards} />
        <TagList label={isAr ? "العضويات" : "Memberships"} items={details.memberships} />
      </CardContent>
    </Card>
  </div>
));
ServicesTab.displayName = "ServicesTab";

// ── Hours Tab ──
export const HoursTab = React.memo(({ details, isAr }: { details: TabProps["details"]; isAr: boolean }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" />{isAr ? "ساعات العمل" : "Working Hours"}</CardTitle></CardHeader>
    <CardContent>
      {details.working_hours && Object.keys(details.working_hours).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(details.working_hours).map(([day, hours]) => (
            <div key={day} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
              <span className="text-sm font-medium capitalize">{day}</span>
              <span className="text-sm text-muted-foreground">{hours || (isAr ? "مغلق" : "Closed")}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{isAr ? "لا توجد ساعات عمل" : "No working hours available"}</p>
      )}
      {details.prayer_room !== undefined && details.prayer_room !== null && (
        <div className="mt-3 p-2 rounded-lg bg-accent/30 text-sm">{details.prayer_room ? "🕌 " : ""}{details.prayer_room ? (isAr ? "يوجد مصلى" : "Prayer room available") : (isAr ? "لا يوجد مصلى" : "No prayer room")}</div>
      )}
      {details.parking_available !== undefined && details.parking_available !== null && (
        <div className="mt-2 p-2 rounded-lg bg-accent/30 text-sm">{details.parking_available ? "🅿️ " : ""}{details.parking_available ? (isAr ? "مواقف سيارات متاحة" : "Parking available") : (isAr ? "لا يوجد موقف" : "No parking")}</div>
      )}
      {details.delivery_available !== undefined && details.delivery_available !== null && (
        <div className="mt-2 p-2 rounded-lg bg-accent/30 text-sm">{details.delivery_available ? "🚚 " : ""}{details.delivery_available ? (isAr ? "خدمة التوصيل متاحة" : "Delivery available") : (isAr ? "لا يوجد توصيل" : "No delivery")}</div>
      )}
    </CardContent>
  </Card>
));
HoursTab.displayName = "HoursTab";

// ── Organizer Tab ──
export const OrganizerTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => {
  const hasData = details.organizer_name_en || details.organizer_name_ar || details.organizer_email || details.organizer_phone || details.organizer_website;
  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isAr ? "لا توجد بيانات منظم" : "No organizer data found"}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-4 w-4" />{isAr ? "معلومات المنظم" : "Organizer Info"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "اسم المنظم (EN)" : "Organizer Name (EN)"} value={details.organizer_name_en} fieldKey="organizer_name_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="organizer_name_ar" pairedFieldValue={details.organizer_name_ar} />
          <Field label={isAr ? "اسم المنظم (AR)" : "Organizer Name (AR)"} value={details.organizer_name_ar} fieldKey="organizer_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="organizer_name_en" pairedFieldValue={details.organizer_name_en} />
          <Field label={isAr ? "البريد الإلكتروني" : "Email"} value={details.organizer_email} fieldKey="organizer_email" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "الهاتف" : "Phone"} value={details.organizer_phone} fieldKey="organizer_phone" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "الموقع الإلكتروني" : "Website"} value={details.organizer_website} fieldKey="organizer_website" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><MapPin className="h-4 w-4" />{isAr ? "عنوان المنظم" : "Organizer Address"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={isAr ? "المدينة (EN)" : "City (EN)"} value={details.organizer_city_en} fieldKey="organizer_city_en" editing={editing} onFieldUpdate={onFieldUpdate} />
            <Field label={isAr ? "المدينة (AR)" : "City (AR)"} value={details.organizer_city_ar} fieldKey="organizer_city_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
            <Field label={isAr ? "الدولة (EN)" : "Country (EN)"} value={details.organizer_country_en} fieldKey="organizer_country_en" editing={editing} onFieldUpdate={onFieldUpdate} />
            <Field label={isAr ? "الدولة (AR)" : "Country (AR)"} value={details.organizer_country_ar} fieldKey="organizer_country_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
          </div>
          <Field label={isAr ? "العنوان الكامل (EN)" : "Full Address (EN)"} value={details.organizer_full_address_en} fieldKey="organizer_full_address_en" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "العنوان الكامل (AR)" : "Full Address (AR)"} value={details.organizer_full_address_ar} fieldKey="organizer_full_address_ar" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          {(details.organizer_building_number || details.organizer_postal_code) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <Field label={isAr ? "رقم المبنى" : "Building No."} value={details.organizer_building_number} fieldKey="organizer_building_number" editing={editing} onFieldUpdate={onFieldUpdate} />
                <Field label={isAr ? "الرمز البريدي" : "Postal Code"} value={details.organizer_postal_code} fieldKey="organizer_postal_code" editing={editing} onFieldUpdate={onFieldUpdate} />
                <Field label={isAr ? "الحي (EN)" : "District (EN)"} value={details.organizer_district_en} fieldKey="organizer_district_en" editing={editing} onFieldUpdate={onFieldUpdate} />
                <Field label={isAr ? "الحي (AR)" : "District (AR)"} value={details.organizer_district_ar} fieldKey="organizer_district_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {details.organizer_logo_url && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ImageIcon className="h-4 w-4" />{isAr ? "شعار المنظم" : "Organizer Logo"}</CardTitle></CardHeader>
          <CardContent>
            <ImagePreviewEditor label={isAr ? "شعار المنظم" : "Organizer Logo"} value={details.organizer_logo_url} fieldKey="organizer_logo_url" onUpdate={onFieldUpdate || (() => {})} aspectRatio="square" isAr={isAr} readOnly={!editing && !onFieldUpdate} />
          </CardContent>
        </Card>
      )}
    </div>
  );
});
OrganizerTab.displayName = "OrganizerTab";
