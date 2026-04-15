import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoogleMapEmbed } from "./GoogleMapEmbed";
import { DataField, TagList } from "./DataField";
import { EditableField } from "./EditableField";
import { ImagePreviewEditor } from "./ImagePreviewEditor";
import type { ImportedData } from "./SmartImportDialog";
import {
  FileText, Phone, MapPin, Building2, Briefcase, Clock,
  Star, Globe, Calendar, Users, Award, Share2,
  UserCheck, Shield, Link2, BookOpen, ExternalLink,
  Image as ImageIcon, BarChart3, Layers, Mic, ListChecks,
  Sparkles, Trophy, LucideIcon } from "lucide-react";

type EditProps = { editing?: boolean; onFieldUpdate?: (key: string, value: string) => void };
type TabProps = { details: ImportedData; isAr: boolean } & EditProps;

const Field = ({ label, value, fieldKey, editing, onFieldUpdate, copyable, multiline, pairedFieldKey, pairedFieldValue }: {
  label: string; value?: string | null; fieldKey: string; copyable?: boolean; multiline?: boolean;
  pairedFieldKey?: string; pairedFieldValue?: string | null;
} & EditProps) => {
  if (editing && onFieldUpdate) {
    return <EditableField label={label} value={value} fieldKey={fieldKey} onUpdate={onFieldUpdate} copyable={copyable} multiline={multiline} pairedFieldKey={pairedFieldKey} pairedFieldValue={pairedFieldValue} />;
  }
  return <DataField label={label} value={value} copyable={copyable} multiline={multiline} />;
};

interface DetailTabsProps {
  details: ImportedData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAr: boolean;
  editing?: boolean;
  onFieldUpdate?: (key: string, value: string) => void;
}

export const DetailTabs = React.memo(({ details, activeTab, onTabChange, isAr, editing, onFieldUpdate }: DetailTabsProps) => {
  const hasOrganizerData = details.organizer_name_en || details.organizer_name_ar || details.organizer_email || details.organizer_phone || details.organizer_website || details.organizer_logo_url;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="overview" className="gap-1.5"><FileText className="h-3.5 w-3.5" />{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
        <TabsTrigger value="media" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" />{isAr ? "الوسائط" : "Media"}</TabsTrigger>
        <TabsTrigger value="contact" className="gap-1.5"><Phone className="h-3.5 w-3.5" />{isAr ? "التواصل" : "Contact"}</TabsTrigger>
        <TabsTrigger value="address" className="gap-1.5"><MapPin className="h-3.5 w-3.5" />{isAr ? "العنوان" : "Address"}</TabsTrigger>
        <TabsTrigger value="organization" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />{isAr ? "المنظمة" : "Organization"}</TabsTrigger>
        <TabsTrigger value="services" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" />{isAr ? "الخدمات" : "Services"}</TabsTrigger>
        <TabsTrigger value="hours" className="gap-1.5"><Clock className="h-3.5 w-3.5" />{isAr ? "ساعات العمل" : "Hours"}</TabsTrigger>
        <TabsTrigger value="event" className="gap-1.5"><Calendar className="h-3.5 w-3.5" />{isAr ? "الحدث" : "Event"}</TabsTrigger>
        <TabsTrigger value="competition" className="gap-1.5"><Trophy className="h-3.5 w-3.5" />{isAr ? "المسابقة" : "Competition"}</TabsTrigger>
        {hasOrganizerData && (
          <TabsTrigger value="organizer" className="gap-1.5"><Users className="h-3.5 w-3.5" />{isAr ? "المنظم" : "Organizer"}</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <OverviewTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="media" className="mt-4">
        <MediaTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="contact" className="mt-4">
        <ContactTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="address" className="mt-4">
        <AddressTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="organization" className="mt-4">
        <OrganizationTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="services" className="mt-4">
        <ServicesTab details={details} isAr={isAr} />
      </TabsContent>

      <TabsContent value="hours" className="mt-4">
        <HoursTab details={details} isAr={isAr} />
      </TabsContent>

      <TabsContent value="event" className="mt-4">
        <EventTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      <TabsContent value="competition" className="mt-4">
        <CompetitionTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
      </TabsContent>

      {hasOrganizerData && (
        <TabsContent value="organizer" className="mt-4">
          <OrganizerTab details={details} isAr={isAr} editing={editing} onFieldUpdate={onFieldUpdate} />
        </TabsContent>
      )}
    </Tabs>
  );
});
DetailTabs.displayName = "DetailTabs";

// ── Overview Tab ──
const OverviewTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card className="lg:col-span-2">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {details.rating && (
            <StatCard icon={Star} iconClass="text-yellow-500 fill-yellow-500" bgClass="bg-yellow-500/10" label={isAr ? "التقييم" : "Rating"} value={details.rating} sub={details.total_reviews != null ? `${details.total_reviews} ${isAr ? "تقييم" : "reviews"}` : undefined} />
          )}
          {details.phone && <StatCard icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={details.phone} small />}
          {details.website && <StatCard icon={Globe} label={isAr ? "الموقع" : "Website"} value={details.website.replace(/^https?:\/\//, '')} small />}
          {(details.city_en || details.city_ar) && <StatCard icon={MapPin} label={isAr ? "المدينة" : "City"} value={details.city_en || details.city_ar || ''} small />}
          {details.founded_year && <StatCard icon={Calendar} label={isAr ? "سنة التأسيس" : "Founded"} value={details.founded_year} />}
          {details.member_count && <StatCard icon={Users} label={isAr ? "الأعضاء" : "Members"} value={details.member_count} />}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الأسماء" : "Names"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "الاسم (EN)" : "Name (EN)"} value={details.name_en} fieldKey="name_en" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="name_ar" pairedFieldValue={details.name_ar} />
        <Field label={isAr ? "الاسم (AR)" : "Name (AR)"} value={details.name_ar} fieldKey="name_ar" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="name_en" pairedFieldValue={details.name_en} />
        <Field label={isAr ? "الاختصار (EN)" : "Abbreviation (EN)"} value={details.abbreviation_en} fieldKey="abbreviation_en" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="abbreviation_ar" pairedFieldValue={details.abbreviation_ar} />
        <Field label={isAr ? "الاختصار (AR)" : "Abbreviation (AR)"} value={details.abbreviation_ar} fieldKey="abbreviation_ar" editing={editing} onFieldUpdate={onFieldUpdate} copyable pairedFieldKey="abbreviation_en" pairedFieldValue={details.abbreviation_en} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "نوع النشاط" : "Business Type"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "النوع (EN)" : "Type (EN)"} value={details.business_type_en} fieldKey="business_type_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="business_type_ar" pairedFieldValue={details.business_type_ar} />
        <Field label={isAr ? "النوع (AR)" : "Type (AR)"} value={details.business_type_ar} fieldKey="business_type_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="business_type_en" pairedFieldValue={details.business_type_en} />
        <TagList label={isAr ? "الكلمات المفتاحية" : "Tags"} items={details.tags} />
      </CardContent>
    </Card>

    {/* Short Description */}
    {(details.description_short_en || details.description_short_ar || details.description_en || details.description_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف المختصر" : "Short Description"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الوصف المختصر (EN)" : "Short Description (EN)"} value={details.description_short_en || details.description_en} fieldKey="description_short_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_short_ar" pairedFieldValue={details.description_short_ar} />
          <Field label={isAr ? "الوصف المختصر (AR)" : "Short Description (AR)"} value={details.description_short_ar || details.description_ar} fieldKey="description_short_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_short_en" pairedFieldValue={details.description_short_en} />
        </CardContent>
      </Card>
    )}

    {/* Long Description */}
    {(details.description_long_en || details.description_long_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف التفصيلي" : "Detailed Description"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الوصف التفصيلي (EN)" : "Detailed Description (EN)"} value={details.description_long_en} fieldKey="description_long_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_long_ar" pairedFieldValue={details.description_long_ar} />
          <Field label={isAr ? "الوصف التفصيلي (AR)" : "Detailed Description (AR)"} value={details.description_long_ar} fieldKey="description_long_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_long_en" pairedFieldValue={details.description_long_en} />
        </CardContent>
      </Card>
    )}

    {/* Standard Description (fallback if no short/long) */}
    {!(details.description_short_en || details.description_short_ar) && (details.description_en || details.description_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف" : "Description"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الوصف (EN)" : "Description (EN)"} value={details.description_en} fieldKey="description_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_ar" pairedFieldValue={details.description_ar} />
          <Field label={isAr ? "الوصف (AR)" : "Description (AR)"} value={details.description_ar} fieldKey="description_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_en" pairedFieldValue={details.description_en} />
        </CardContent>
      </Card>
    )}

    {(details.mission_en || details.mission_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{isAr ? "الرسالة والرؤية" : "Mission & Vision"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الرسالة (EN)" : "Mission (EN)"} value={details.mission_en} fieldKey="mission_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="mission_ar" pairedFieldValue={details.mission_ar} />
          <Field label={isAr ? "الرسالة (AR)" : "Mission (AR)"} value={details.mission_ar} fieldKey="mission_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="mission_en" pairedFieldValue={details.mission_en} />
        </CardContent>
      </Card>
    )}
  </div>
));
OverviewTab.displayName = "OverviewTab";

// ── Stat Card ──
const StatCard = React.memo(({ icon: Icon, iconClass, bgClass, label, value, sub, small }: {
  icon: LucideIcon; iconClass?: string; bgClass?: string; label: string; value: string | number; sub?: string; small?: boolean;
}) => (
  <div className={`text-center p-3 rounded-xl ${bgClass || 'bg-accent/30'}`}>
    <Icon className={`h-4 w-4 mx-auto mb-1 ${iconClass || 'text-primary'}`} />
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-${small ? 'medium' : 'bold'} ${small ? 'text-sm truncate' : 'text-lg'}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
));
StatCard.displayName = "StatCard";

// ── Contact Tab ──
const ContactTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "معلومات التواصل" : "Contact Info"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "الهاتف" : "Phone"} value={details.phone} fieldKey="phone" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "هاتف ثانوي" : "Secondary Phone"} value={details.phone_secondary} fieldKey="phone_secondary" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "الفاكس" : "Fax"} value={details.fax} fieldKey="fax" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "البريد الإلكتروني" : "Email"} value={details.email} fieldKey="email" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "الموقع الإلكتروني" : "Website"} value={details.website} fieldKey="website" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
      </CardContent>
    </Card>
    {details.social_media && Object.values(details.social_media).some(Boolean) && (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5"><Share2 className="h-4 w-4" /> {isAr ? "التواصل الاجتماعي" : "Social Media"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(details.social_media).filter(([, v]) => v).map(([k, v]) => (
            <DataField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} copyable />
          ))}
        </CardContent>
      </Card>
    )}
  </div>
));
ContactTab.displayName = "ContactTab";

// ── Address Tab ──
const AddressTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardContent className="pt-4 space-y-4">
        {/* Country & Region */}
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

        {/* Street & District */}
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

        {/* Building Details */}
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <Building2 className="h-3 w-3" /> {isAr ? "تفاصيل المبنى" : "Building Details"}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Field label={isAr ? "رقم المبنى" : "Building No."} value={details.building_number} fieldKey="building_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
          <Field label={isAr ? "الطابق" : "Floor"} value={details.floor_number} fieldKey="floor_number" editing={editing} onFieldUpdate={onFieldUpdate} />
          <Field label={isAr ? "رقم الوحدة" : "Unit No."} value={details.unit_number} fieldKey="unit_number" editing={editing} onFieldUpdate={onFieldUpdate} />
        </div>

        <Separator />

        {/* Postal & National Address */}
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

        {/* Full Address */}
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
const OrganizationTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><UserCheck className="h-4 w-4" />{isAr ? "القيادة" : "Leadership"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "الرئيس (EN)" : "President (EN)"} value={details.president_name_en} fieldKey="president_name_en" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "الرئيس (AR)" : "President (AR)"} value={details.president_name_ar} fieldKey="president_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "السكرتير (EN)" : "Secretary (EN)"} value={details.secretary_name_en} fieldKey="secretary_name_en" editing={editing} onFieldUpdate={onFieldUpdate} />
        <Field label={isAr ? "السكرتير (AR)" : "Secretary (AR)"} value={details.secretary_name_ar} fieldKey="secretary_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
        {details.member_count && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">{isAr ? "عدد الأعضاء:" : "Member Count:"} <strong>{details.member_count}</strong></span>
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Shield className="h-4 w-4" />{isAr ? "التسجيل والترخيص" : "Registration & Legal"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "السجل التجاري" : "National/Commercial ID"} value={details.national_id} fieldKey="national_id" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "رقم التسجيل" : "Registration Number"} value={details.registration_number} fieldKey="registration_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        <Field label={isAr ? "رقم الترخيص" : "License Number"} value={details.license_number} fieldKey="license_number" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        {details.founded_year && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm">{isAr ? "سنة التأسيس:" : "Founded:"} <strong>{details.founded_year}</strong></span>
          </div>
        )}
      </CardContent>
    </Card>

    {details.affiliated_organizations && details.affiliated_organizations.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Link2 className="h-4 w-4" />{isAr ? "المنظمات التابعة" : "Affiliated Organizations"}</CardTitle></CardHeader>
        <CardContent>
          <TagList label="" items={details.affiliated_organizations} />
        </CardContent>
      </Card>
    )}
  </div>
));
OrganizationTab.displayName = "OrganizationTab";

// ── Services Tab ──
const ServicesTab = React.memo(({ details, isAr }: { details: ImportedData; isAr: boolean }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{isAr ? "الخدمات" : "Services"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <TagList label={isAr ? "الخدمات (EN)" : "Services (EN)"} items={details.services_en} />
        <TagList label={isAr ? "الخدمات (AR)" : "Services (AR)"} items={details.services_ar} />
        {!details.services_en?.length && !details.services_ar?.length && (
          <p className="text-sm text-muted-foreground">{isAr ? "لم يتم العثور على خدمات" : "No services found"}</p>
        )}
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "التخصصات" : "Specializations"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <TagList label={isAr ? "التخصصات (EN)" : "Specializations (EN)"} items={details.specializations_en} />
        <TagList label={isAr ? "التخصصات (AR)" : "Specializations (AR)"} items={details.specializations_ar} />
        {!details.specializations_en?.length && !details.specializations_ar?.length && (
          <p className="text-sm text-muted-foreground">{isAr ? "لم يتم العثور على تخصصات" : "No specializations found"}</p>
        )}
      </CardContent>
    </Card>
  </div>
));
ServicesTab.displayName = "ServicesTab";

// ── Hours Tab ──
const HoursTab = React.memo(({ details, isAr }: { details: ImportedData; isAr: boolean }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {details.business_hours && details.business_hours.length > 0 ? (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" /> {isAr ? "ساعات العمل" : "Business Hours"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {details.business_hours.map((h, i) => (
              <div key={i} className="flex justify-between text-xs rounded-xl border p-2.5">
                <span className="font-medium">{isAr ? h.day_ar : h.day_en}</span>
                <span className={h.is_closed ? "text-muted-foreground" : "text-primary font-medium"}>
                  {h.is_closed ? (isAr ? "مغلق" : "Closed") : `${h.open} - ${h.close}`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isAr ? "لم يتم العثور على ساعات العمل" : "No business hours found"}</p>
        </CardContent>
      </Card>
    )}
    {details.google_maps_url && (
      <Card>
        <CardContent className="pt-4 flex flex-col items-center justify-center gap-3 text-center h-full">
          <MapPin className="h-8 w-8 text-red-500" />
          <p className="text-sm font-medium">{isAr ? "عرض على الخريطة" : "View on Map"}</p>
          <a href={details.google_maps_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
            </Button>
          </a>
        </CardContent>
      </Card>
    )}
  </div>
));
HoursTab.displayName = "HoursTab";

// ── Event Tab (Exhibitions / Competitions) ──
const EventTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Event Details */}
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Calendar className="h-4 w-4" />{isAr ? "تفاصيل الحدث" : "Event Details"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "المكان (EN)" : "Venue (EN)"} value={details.venue_en} fieldKey="venue_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="venue_ar" pairedFieldValue={details.venue_ar} />
        <Field label={isAr ? "المكان (AR)" : "Venue (AR)"} value={details.venue_ar} fieldKey="venue_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="venue_en" pairedFieldValue={details.venue_en} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={isAr ? "تاريخ البداية" : "Start Date"} value={details.start_date} fieldKey="start_date" editing={editing} onFieldUpdate={onFieldUpdate} />
          <Field label={isAr ? "تاريخ النهاية" : "End Date"} value={details.end_date} fieldKey="end_date" editing={editing} onFieldUpdate={onFieldUpdate} />
        </div>
        {details.edition_year && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm">{isAr ? "سنة الإصدار:" : "Edition Year:"} <strong>{details.edition_year}</strong></span>
          </div>
        )}
        {details.is_virtual !== undefined && details.is_virtual !== null && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm">{details.is_virtual ? (isAr ? "حدث افتراضي" : "Virtual Event") : (isAr ? "حدث حضوري" : "In-Person Event")}</span>
          </div>
        )}
        {details.virtual_link && <Field label={isAr ? "رابط الحدث الافتراضي" : "Virtual Link"} value={details.virtual_link} fieldKey="virtual_link" editing={editing} onFieldUpdate={onFieldUpdate} copyable />}
        {details.map_url && <Field label={isAr ? "رابط الخريطة" : "Map URL"} value={details.map_url} fieldKey="map_url" editing={editing} onFieldUpdate={onFieldUpdate} copyable />}
      </CardContent>
    </Card>

    {/* Registration & Attendance */}
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-4 w-4" />{isAr ? "التسجيل والحضور" : "Registration & Attendance"}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Field label={isAr ? "المنظم (EN)" : "Organizer (EN)"} value={details.organizer_name_en} fieldKey="organizer_name_en" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="organizer_name_ar" pairedFieldValue={details.organizer_name_ar} />
        <Field label={isAr ? "المنظم (AR)" : "Organizer (AR)"} value={details.organizer_name_ar} fieldKey="organizer_name_ar" editing={editing} onFieldUpdate={onFieldUpdate} pairedFieldKey="organizer_name_en" pairedFieldValue={details.organizer_name_en} />
        {details.organizer_email && <Field label={isAr ? "بريد المنظم" : "Organizer Email"} value={details.organizer_email} fieldKey="organizer_email" editing={editing} onFieldUpdate={onFieldUpdate} copyable />}
        {details.organizer_phone && <Field label={isAr ? "هاتف المنظم" : "Organizer Phone"} value={details.organizer_phone} fieldKey="organizer_phone" editing={editing} onFieldUpdate={onFieldUpdate} copyable />}
        <Field label={isAr ? "رابط التسجيل" : "Registration URL"} value={details.registration_url} fieldKey="registration_url" editing={editing} onFieldUpdate={onFieldUpdate} copyable />
        {details.registration_deadline && <Field label={isAr ? "آخر موعد للتسجيل" : "Registration Deadline"} value={details.registration_deadline} fieldKey="registration_deadline" editing={editing} onFieldUpdate={onFieldUpdate} />}
        {details.max_attendees && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">{isAr ? "الحد الأقصى:" : "Max Attendees:"} <strong>{details.max_attendees}</strong></span>
          </div>
        )}
        {details.ticket_price && <Field label={isAr ? "سعر التذكرة" : "Ticket Price"} value={details.ticket_price} fieldKey="ticket_price" editing={editing} onFieldUpdate={onFieldUpdate} />}
        {details.is_free !== undefined && details.is_free !== null && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
            <span className="text-sm">{details.is_free ? (isAr ? "✅ مجاني" : "✅ Free Event") : (isAr ? "💰 مدفوع" : "💰 Paid Event")}</span>
          </div>
        )}
        {details.registration_fee !== undefined && details.registration_fee !== null && (
          <Field label={isAr ? "رسوم التسجيل" : "Registration Fee"} value={String(details.registration_fee)} fieldKey="registration_fee" editing={editing} onFieldUpdate={onFieldUpdate} />
        )}
      </CardContent>
    </Card>

    {/* Edition Statistics */}
    {details.edition_stats && Object.values(details.edition_stats).some(v => v !== null && v !== undefined) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />{isAr ? "إحصائيات الحدث" : "Event Statistics"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {details.edition_stats.exhibitors && <StatCard icon={Building2} label={isAr ? "عارضون" : "Exhibitors"} value={details.edition_stats.exhibitors} />}
            {details.edition_stats.visitors && <StatCard icon={Users} label={isAr ? "زوار" : "Visitors"} value={details.edition_stats.visitors} />}
            {details.edition_stats.countries && <StatCard icon={Globe} label={isAr ? "دول" : "Countries"} value={details.edition_stats.countries} />}
            {details.edition_stats.brands && <StatCard icon={Award} label={isAr ? "علامات تجارية" : "Brands"} value={details.edition_stats.brands} />}
            {details.edition_stats.sessions && <StatCard icon={Mic} label={isAr ? "جلسات" : "Sessions"} value={details.edition_stats.sessions} />}
            {details.edition_stats.speakers && <StatCard icon={UserCheck} label={isAr ? "متحدثون" : "Speakers"} value={details.edition_stats.speakers} />}
            {details.edition_stats.workshops && <StatCard icon={Briefcase} label={isAr ? "ورش عمل" : "Workshops"} value={details.edition_stats.workshops} />}
            {details.edition_stats.area_sqm && <StatCard icon={Layers} label={isAr ? "المساحة (م²)" : "Area (sqm)"} value={details.edition_stats.area_sqm} />}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Target Audience */}
    {details.target_audience && details.target_audience.length > 0 && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-4 w-4" />{isAr ? "الجمهور المستهدف" : "Target Audience"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {details.target_audience.map((a, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Targeted Sectors */}
    {details.targeted_sectors && details.targeted_sectors.length > 0 && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Layers className="h-4 w-4" />{isAr ? "القطاعات المستهدفة" : "Targeted Sectors"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {details.targeted_sectors.map((s, i) => (
              <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Activities */}
    {(details.activities_en?.length || details.activities_ar?.length) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ListChecks className="h-4 w-4" />{isAr ? "الأنشطة والفعاليات" : "Activities & Events"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {details.activities_en?.length ? (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground uppercase">English</span>
                <ul className="space-y-1">
                  {details.activities_en.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {details.activities_ar?.length ? (
              <div className="space-y-1.5" dir="rtl">
                <span className="text-xs font-medium text-muted-foreground uppercase">عربي</span>
                <ul className="space-y-1">
                  {details.activities_ar.map((a, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Reasons to Attend */}
    {details.reasons_to_attend && details.reasons_to_attend.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4" />{isAr ? "أسباب الحضور" : "Reasons to Attend"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {details.reasons_to_attend.map((r, i) => (
              <div key={i} className="p-2.5 rounded-xl border bg-accent/20 text-sm">
                <p>{r.reason}</p>
                {r.reason_ar && <p className="text-muted-foreground text-xs mt-1" dir="rtl">{r.reason_ar}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Unique Features */}
    {details.unique_features && details.unique_features.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4" />{isAr ? "الميزات الفريدة" : "Unique Features"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {details.unique_features.map((f, i) => (
              <div key={i} className="p-2.5 rounded-xl border bg-accent/20 text-sm">
                <p>{f.feature}</p>
                {f.feature_ar && <p className="text-muted-foreground text-xs mt-1" dir="rtl">{f.feature_ar}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Sponsors */}
    {details.sponsors && details.sponsors.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "الرعاة والشركاء" : "Sponsors & Partners"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {details.sponsors.map((s, i) => (
              <div key={i} className="p-3 rounded-xl border flex items-center gap-3">
                {s.logo_url ? (
                  <img loading="lazy" decoding="async" src={s.logo_url} alt={s.name} className="h-10 w-10 object-contain rounded" />
                ) : (
                  <div className="h-10 w-10 rounded bg-accent/50 flex items-center justify-center text-xs font-bold text-muted-foreground">{s.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  {s.name_ar && <p className="text-xs text-muted-foreground truncate" dir="rtl">{s.name_ar}</p>}
                  {s.tier && (
                    <Badge variant="outline" className="text-xs mt-0.5 capitalize">{s.tier}</Badge>
                  )}
                </div>
                {s.website_url && (
                  <a href={s.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Speakers */}
    {details.speakers && details.speakers.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Mic className="h-4 w-4" />{isAr ? "المتحدثون" : "Speakers"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {details.speakers.map((s, i) => (
              <div key={i} className="p-3 rounded-xl border text-center">
                {s.photo_url ? (
                  <img loading="lazy" decoding="async" src={s.photo_url} alt={s.name} className="h-12 w-12 rounded-full mx-auto object-cover mb-2" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-2 text-sm font-bold text-muted-foreground">{s.name.charAt(0)}</div>
                )}
                <p className="text-sm font-medium truncate">{s.name}</p>
                {s.title && <p className="text-xs text-muted-foreground truncate">{s.title}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Schedule */}
    {details.schedule_items && details.schedule_items.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Clock className="h-4 w-4" />{isAr ? "الجدول الزمني" : "Schedule"}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {details.schedule_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border">
                <span className="text-xs font-mono text-primary shrink-0 pt-0.5">{item.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{item.title_ar}</p>}
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Venue Details */}
    {details.venue_details && Object.values(details.venue_details).some(v => v !== null && v !== undefined) && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Building2 className="h-4 w-4" />{isAr ? "تفاصيل المكان" : "Venue Details"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {details.venue_details.capacity && <DataField label={isAr ? "السعة" : "Capacity"} value={String(details.venue_details.capacity)} />}
          {details.venue_details.halls && <DataField label={isAr ? "القاعات" : "Halls"} value={String(details.venue_details.halls)} />}
          {details.venue_details.area_sqm && <DataField label={isAr ? "المساحة (م²)" : "Area (sqm)"} value={String(details.venue_details.area_sqm)} />}
          {details.venue_details.parking && <DataField label={isAr ? "المواقف" : "Parking"} value={String(details.venue_details.parking)} />}
          {details.venue_details.accessibility && <DataField label={isAr ? "إمكانية الوصول" : "Accessibility"} value={String(details.venue_details.accessibility)} />}
          {details.venue_details.facilities?.length > 0 && <TagList label={isAr ? "المرافق" : "Facilities"} items={details.venue_details.facilities} />}
        </CardContent>
      </Card>
    )}

    {/* Entry Details */}
    {details.entry_details && Object.values(details.entry_details).some(v => v !== null && v !== undefined) && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ListChecks className="h-4 w-4" />{isAr ? "تفاصيل الدخول" : "Entry Details"}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {details.entry_details.type && <DataField label={isAr ? "النوع" : "Type"} value={details.entry_details.type} />}
          {details.entry_details.early_bird_price && <DataField label={isAr ? "سعر الحجز المبكر" : "Early Bird Price"} value={String(details.entry_details.early_bird_price)} />}
          {details.entry_details.vip_price && <DataField label={isAr ? "سعر VIP" : "VIP Price"} value={String(details.entry_details.vip_price)} />}
          {details.entry_details.group_discount && <DataField label={isAr ? "خصم المجموعات" : "Group Discount"} value={String(details.entry_details.group_discount)} />}
          {details.entry_details.ticket_types?.length > 0 && <TagList label={isAr ? "أنواع التذاكر" : "Ticket Types"} items={details.entry_details.ticket_types} />}
        </CardContent>
      </Card>
    )}

    {/* Highlights */}
    {details.highlights && details.highlights.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Star className="h-4 w-4" />{isAr ? "أبرز النقاط" : "Highlights"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {details.highlights.map((h, i) => (
              <div key={i} className="p-2.5 rounded-xl border text-center">
                <p className="text-lg font-bold text-primary">{h.value}</p>
                <p className="text-xs text-muted-foreground">{h.label}</p>
                {h.label_ar && <p className="text-xs text-muted-foreground" dir="rtl">{h.label_ar}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Categories */}
    {details.categories && details.categories.length > 0 && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Layers className="h-4 w-4" />{isAr ? "الفئات" : "Categories"}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {details.categories.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )}

    {/* Rules Summary */}
    {(details.rules_summary_en || details.rules_summary_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "ملخص القواعد" : "Rules Summary"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "القواعد (EN)" : "Rules (EN)"} value={details.rules_summary_en} fieldKey="rules_summary_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="rules_summary_ar" pairedFieldValue={details.rules_summary_ar} />
          <Field label={isAr ? "القواعد (AR)" : "Rules (AR)"} value={details.rules_summary_ar} fieldKey="rules_summary_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="rules_summary_en" pairedFieldValue={details.rules_summary_en} />
        </CardContent>
      </Card>
    )}
  </div>
));
EventTab.displayName = "EventTab";

// ── Competition Tab ──
const CompetitionTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => {
  const hasCompetitionData = details.competition_type || details.competition_versions?.length ||
    details.judging_criteria?.length || details.judging_committee?.length ||
    details.prizes?.length || details.competition_rounds?.length ||
    details.eligibility_en || details.terms_conditions_en ||
    details.scoring_method_en || details.participation_requirements_en?.length ||
    details.equipment_provided?.length || details.equipment_required?.length;

  if (!hasCompetitionData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isAr ? "لا توجد بيانات مسابقة" : "No competition data found"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Competition Info */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4" />{isAr ? "معلومات المسابقة" : "Competition Info"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {details.competition_type && <Field label={isAr ? "نوع المسابقة" : "Competition Type"} value={details.competition_type} fieldKey="competition_type" editing={editing} onFieldUpdate={onFieldUpdate} />}
          {details.edition_number && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">{isAr ? "رقم النسخة:" : "Edition #:"} <strong>{details.edition_number}</strong></span>
            </div>
          )}
          {(details.edition_label_en || details.edition_label_ar) && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={isAr ? "عنوان النسخة (EN)" : "Edition Label (EN)"} value={details.edition_label_en} fieldKey="edition_label_en" editing={editing} onFieldUpdate={onFieldUpdate} />
              <Field label={isAr ? "عنوان النسخة (AR)" : "Edition Label (AR)"} value={details.edition_label_ar} fieldKey="edition_label_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
            </div>
          )}
          <Field label={isAr ? "طريقة التقييم (EN)" : "Scoring Method (EN)"} value={details.scoring_method_en} fieldKey="scoring_method_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
          <Field label={isAr ? "طريقة التقييم (AR)" : "Scoring Method (AR)"} value={details.scoring_method_ar} fieldKey="scoring_method_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
          {(details.max_team_size || details.min_team_size) && (
            <div className="grid grid-cols-2 gap-3">
              {details.min_team_size && <DataField label={isAr ? "الحد الأدنى للفريق" : "Min Team Size"} value={String(details.min_team_size)} />}
              {details.max_team_size && <DataField label={isAr ? "الحد الأقصى للفريق" : "Max Team Size"} value={String(details.max_team_size)} />}
            </div>
          )}
          {details.blind_judging !== undefined && details.blind_judging !== null && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30">
              <span className="text-sm">{details.blind_judging ? "🔒 " : "👁️ "}{details.blind_judging ? (isAr ? "تحكيم مخفي الهوية" : "Blind Judging") : (isAr ? "تحكيم مكشوف" : "Open Judging")}</span>
            </div>
          )}
          {details.age_restrictions && <Field label={isAr ? "قيود العمر" : "Age Restrictions"} value={details.age_restrictions} fieldKey="age_restrictions" editing={editing} onFieldUpdate={onFieldUpdate} />}
          {(details.dress_code || details.dress_code_ar) && (
            <div className="grid grid-cols-2 gap-3">
              <Field label={isAr ? "الزي (EN)" : "Dress Code (EN)"} value={details.dress_code} fieldKey="dress_code" editing={editing} onFieldUpdate={onFieldUpdate} />
              <Field label={isAr ? "الزي (AR)" : "Dress Code (AR)"} value={details.dress_code_ar} fieldKey="dress_code_ar" editing={editing} onFieldUpdate={onFieldUpdate} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eligibility & Requirements */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Shield className="h-4 w-4" />{isAr ? "الأهلية والمتطلبات" : "Eligibility & Requirements"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الأهلية (EN)" : "Eligibility (EN)"} value={details.eligibility_en} fieldKey="eligibility_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
          <Field label={isAr ? "الأهلية (AR)" : "Eligibility (AR)"} value={details.eligibility_ar} fieldKey="eligibility_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
          <TagList label={isAr ? "متطلبات المشاركة (EN)" : "Participation Requirements (EN)"} items={details.participation_requirements_en} />
          <TagList label={isAr ? "متطلبات المشاركة (AR)" : "Participation Requirements (AR)"} items={details.participation_requirements_ar} />
          <TagList label={isAr ? "أنواع المشاركة المسموحة" : "Allowed Entry Types"} items={details.allowed_entry_types} />
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      {(details.terms_conditions_en || details.terms_conditions_ar) && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ListChecks className="h-4 w-4" />{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label={isAr ? "الشروط (EN)" : "Terms (EN)"} value={details.terms_conditions_en} fieldKey="terms_conditions_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
            <Field label={isAr ? "الشروط (AR)" : "Terms (AR)"} value={details.terms_conditions_ar} fieldKey="terms_conditions_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline />
          </CardContent>
        </Card>
      )}

      {/* Competition Versions */}
      {details.competition_versions && details.competition_versions.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Layers className="h-4 w-4" />{isAr ? "فئات المسابقة" : "Competition Categories"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.competition_versions.map((v, i) => (
                <div key={i} className="p-3 rounded-xl border">
                  <p className="text-sm font-medium">{v.name}</p>
                  {v.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{v.name_ar}</p>}
                  {v.description && <p className="text-xs text-muted-foreground mt-1">{v.description}</p>}
                  {v.max_participants && <Badge variant="outline" className="text-xs mt-1">{isAr ? `${v.max_participants} مشارك` : `${v.max_participants} participants`}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Judging Criteria */}
      {details.judging_criteria && details.judging_criteria.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><BarChart3 className="h-4 w-4" />{isAr ? "معايير التحكيم" : "Judging Criteria"}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {details.judging_criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.criterion}</p>
                    {c.criterion_ar && <p className="text-xs text-muted-foreground" dir="rtl">{c.criterion_ar}</p>}
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  </div>
                  {c.weight && <Badge variant="secondary" className="shrink-0">{c.weight}%</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Judging Committee */}
      {details.judging_committee && details.judging_committee.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><UserCheck className="h-4 w-4" />{isAr ? "لجنة التحكيم" : "Judging Committee"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {details.judging_committee.map((j, i) => (
                <div key={i} className="p-3 rounded-xl border text-center">
                  {j.photo_url ? (
                    <img loading="lazy" decoding="async" src={j.photo_url} alt={j.name} className="h-12 w-12 rounded-full mx-auto object-cover mb-2" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center mx-auto mb-2 text-sm font-bold text-muted-foreground">{j.name.charAt(0)}</div>
                  )}
                  <p className="text-sm font-medium truncate">{j.name}</p>
                  {j.name_ar && <p className="text-xs text-muted-foreground truncate" dir="rtl">{j.name_ar}</p>}
                  {j.title && <p className="text-xs text-muted-foreground truncate">{j.title}</p>}
                  {j.role && <Badge variant="outline" className="text-xs mt-1">{j.role}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prizes */}
      {details.prizes && details.prizes.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="h-4 w-4" />{isAr ? "الجوائز" : "Prizes"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {details.prizes.map((p, i) => (
                <div key={i} className="p-3 rounded-xl border text-center">
                  <p className="text-xs text-muted-foreground">{p.place}</p>
                  {p.place_ar && <p className="text-xs text-muted-foreground" dir="rtl">{p.place_ar}</p>}
                  <p className="text-sm font-bold mt-1">{p.prize}</p>
                  {p.prize_ar && <p className="text-xs text-muted-foreground" dir="rtl">{p.prize_ar}</p>}
                  {p.value && <Badge variant="secondary" className="mt-1">{details.currency || '$'}{p.value.toLocaleString()}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competition Rounds */}
      {details.competition_rounds && details.competition_rounds.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Layers className="h-4 w-4" />{isAr ? "جولات المسابقة" : "Competition Rounds"}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {details.competition_rounds.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.name_ar && <p className="text-xs text-muted-foreground" dir="rtl">{r.name_ar}</p>}
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  </div>
                  {r.duration && <Badge variant="outline" className="shrink-0 text-xs">{r.duration}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment */}
      {(details.equipment_provided?.length || details.equipment_required?.length) ? (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "المعدات" : "Equipment"}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <TagList label={isAr ? "معدات مقدمة" : "Provided Equipment"} items={details.equipment_provided} />
            </div>
            <div>
              <TagList label={isAr ? "معدات مطلوبة" : "Required Equipment"} items={details.equipment_required} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Past Editions */}
      {details.past_editions && details.past_editions.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Calendar className="h-4 w-4" />{isAr ? "النسخ السابقة" : "Past Editions"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {details.past_editions.map((ed, i) => (
                <div key={i} className="p-3 rounded-xl border text-center">
                  <p className="text-lg font-bold text-primary">{ed.year}</p>
                  {ed.label_en && <p className="text-xs text-muted-foreground">{ed.label_en}</p>}
                  <div className="mt-2 space-y-0.5">
                    {ed.visitors && <p className="text-xs">{isAr ? "زوار:" : "Visitors:"} {ed.visitors.toLocaleString()}</p>}
                    {ed.exhibitors && <p className="text-xs">{isAr ? "عارضون:" : "Exhibitors:"} {ed.exhibitors}</p>}
                    {ed.countries && <p className="text-xs">{isAr ? "دول:" : "Countries:"} {ed.countries}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
CompetitionTab.displayName = "CompetitionTab";

// ── Organizer Tab ──
const OrganizerTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => {
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
            <ImagePreviewEditor
              label={isAr ? "شعار المنظم" : "Organizer Logo"}
              value={details.organizer_logo_url}
              fieldKey="organizer_logo_url"
              onUpdate={onFieldUpdate || (() => {})}
              aspectRatio="square"
              isAr={isAr}
              readOnly={!editing && !onFieldUpdate}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
});
OrganizerTab.displayName = "OrganizerTab";

const MediaTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          {isAr ? "الشعار" : "Logo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImagePreviewEditor
          label={isAr ? "شعار الجهة" : "Entity Logo"}
          value={details.logo_url}
          fieldKey="logo_url"
          onUpdate={onFieldUpdate || (() => {})}
          aspectRatio="square"
          isAr={isAr}
          readOnly={!editing && !onFieldUpdate}
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4" />
          {isAr ? "صورة الغلاف" : "Cover Image"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImagePreviewEditor
          label={isAr ? "صورة الغلاف" : "Cover Image"}
          value={details.cover_url}
          fieldKey="cover_url"
          onUpdate={onFieldUpdate || (() => {})}
          aspectRatio="wide"
          isAr={isAr}
          readOnly={!editing && !onFieldUpdate}
        />
      </CardContent>
    </Card>

    {/* Organizer Logo */}
    {details.organizer_logo_url && (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {isAr ? "شعار المنظم" : "Organizer Logo"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImagePreviewEditor
            label={isAr ? "شعار المنظم" : "Organizer Logo"}
            value={details.organizer_logo_url}
            fieldKey="organizer_logo_url"
            onUpdate={onFieldUpdate || (() => {})}
            aspectRatio="square"
            isAr={isAr}
            readOnly={!editing && !onFieldUpdate}
          />
        </CardContent>
      </Card>
    )}

    {/* Gallery */}
    {details.gallery_urls && details.gallery_urls.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            {isAr ? "معرض الصور" : "Gallery"} 
            <Badge variant="secondary" className="text-xs">{details.gallery_urls.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {details.gallery_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-xl overflow-hidden border bg-accent/20 hover:ring-2 hover:ring-primary/30 transition-all">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
));
MediaTab.displayName = "MediaTab";
