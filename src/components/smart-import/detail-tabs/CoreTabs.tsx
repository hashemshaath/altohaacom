import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataField, TagList } from "../DataField";
import { Field } from "./Field";
import { StatCard } from "./StatCard";
import { GoogleMapEmbed } from "../GoogleMapEmbed";
import { ImagePreviewEditor } from "../ImagePreviewEditor";
import type { TabProps } from "./tabTypes";
import {
  Calendar, Users, Globe, MapPin, Building2, Briefcase, Clock,
  Star, Award, Share2, UserCheck, Shield, BookOpen, ExternalLink,
  Image as ImageIcon, BarChart3, Layers, Mic, ListChecks,
  Sparkles, Trophy, Phone, FileText, LucideIcon,
} from "lucide-react";

// ── Overview Tab ──
export const OverviewTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
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

    {(details.description_short_en || details.description_short_ar || details.description_en || details.description_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف المختصر" : "Short Description"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الوصف المختصر (EN)" : "Short Description (EN)"} value={details.description_short_en || details.description_en} fieldKey="description_short_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_short_ar" pairedFieldValue={details.description_short_ar} />
          <Field label={isAr ? "الوصف المختصر (AR)" : "Short Description (AR)"} value={details.description_short_ar || details.description_ar} fieldKey="description_short_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_short_en" pairedFieldValue={details.description_short_en} />
        </CardContent>
      </Card>
    )}

    {(details.description_long_en || details.description_long_ar) && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الوصف التفصيلي" : "Detailed Description"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Field label={isAr ? "الوصف التفصيلي (EN)" : "Detailed Description (EN)"} value={details.description_long_en} fieldKey="description_long_en" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_long_ar" pairedFieldValue={details.description_long_ar} />
          <Field label={isAr ? "الوصف التفصيلي (AR)" : "Detailed Description (AR)"} value={details.description_long_ar} fieldKey="description_long_ar" editing={editing} onFieldUpdate={onFieldUpdate} multiline pairedFieldKey="description_long_en" pairedFieldValue={details.description_long_en} />
        </CardContent>
      </Card>
    )}

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

// ── Contact Tab ──
export const ContactTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
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

// ── Media Tab ──
export const MediaTab = React.memo(({ details, isAr, editing, onFieldUpdate }: TabProps) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ImageIcon className="h-4 w-4" />{isAr ? "الشعار" : "Logo"}</CardTitle></CardHeader>
      <CardContent>
        <ImagePreviewEditor label={isAr ? "شعار الجهة" : "Entity Logo"} value={details.logo_url} fieldKey="logo_url" onUpdate={onFieldUpdate || (() => {})} aspectRatio="square" isAr={isAr} readOnly={!editing && !onFieldUpdate} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ImageIcon className="h-4 w-4" />{isAr ? "صورة الغلاف" : "Cover Image"}</CardTitle></CardHeader>
      <CardContent>
        <ImagePreviewEditor label={isAr ? "صورة الغلاف" : "Cover Image"} value={details.cover_url} fieldKey="cover_url" onUpdate={onFieldUpdate || (() => {})} aspectRatio="wide" isAr={isAr} readOnly={!editing && !onFieldUpdate} />
      </CardContent>
    </Card>
    {details.organizer_logo_url && (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Users className="h-4 w-4" />{isAr ? "شعار المنظم" : "Organizer Logo"}</CardTitle></CardHeader>
        <CardContent>
          <ImagePreviewEditor label={isAr ? "شعار المنظم" : "Organizer Logo"} value={details.organizer_logo_url} fieldKey="organizer_logo_url" onUpdate={onFieldUpdate || (() => {})} aspectRatio="square" isAr={isAr} readOnly={!editing && !onFieldUpdate} />
        </CardContent>
      </Card>
    )}
    {details.gallery_urls && details.gallery_urls.length > 0 && (
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            {isAr ? "معرض الصور" : "Gallery"}
            <Badge variant="secondary" className="text-[12px]">{details.gallery_urls.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {details.gallery_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-xl overflow-hidden border bg-accent/20 hover:ring-2 hover:ring-primary/30 transition-all">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
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
