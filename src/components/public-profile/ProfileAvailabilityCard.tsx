import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, DollarSign, Globe } from "lucide-react";

interface ProfileAvailabilityCardProps {
  profile: any;
  isAr: boolean;
}

export const ProfileAvailabilityCard = memo(function ProfileAvailabilityCard({ profile, isAr }: ProfileAvailabilityCardProps) {
  if (!profile.is_open_to_work) return null;
  if (profile.job_availability_visibility === "private") return null;

  const jobTypes = profile.preferred_job_types || [];
  const locations = profile.preferred_work_locations || [];
  const note = isAr ? (profile.work_availability_note_ar || profile.work_availability_note) : (profile.work_availability_note || profile.work_availability_note_ar);

  return (
    <Card className="rounded-2xl border-chart-2/20 bg-gradient-to-br from-chart-2/5 via-transparent to-chart-2/3 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-chart-2/40 via-chart-2 to-chart-2/40" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-2/15">
            <Briefcase className="h-4 w-4 text-chart-2" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-chart-2">{isAr ? "متاح للعمل" : "Open to Work"}</h3>
            <p className="text-[12px] text-muted-foreground">
              {isAr ? "يبحث عن فرص جديدة" : "Looking for new opportunities"}
            </p>
          </div>
        </div>

        {note && (
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-2.5">
            {note}
          </p>
        )}

        {jobTypes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {isAr ? "نوع العمل المفضل" : "Preferred Work Types"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {jobTypes.map((type: string) => (
                <Badge key={type} variant="secondary" className="text-[12px] rounded-lg px-2 py-0.5 capitalize">
                  {type.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {locations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {isAr ? "المواقع المفضلة" : "Preferred Locations"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {locations.map((loc: string) => (
                <Badge key={loc} variant="outline" className="text-[12px] rounded-lg px-2 py-0.5">
                  <Globe className="h-2.5 w-2.5 me-1" />
                  {loc}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(profile.salary_range_min || profile.salary_range_max) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3 text-chart-2/60" />
            {profile.salary_range_min && profile.salary_range_max
              ? `${profile.salary_range_min.toLocaleString()} - ${profile.salary_range_max.toLocaleString()}`
              : profile.salary_range_min
                ? `${isAr ? "من" : "From"} ${profile.salary_range_min.toLocaleString()}`
                : `${isAr ? "حتى" : "Up to"} ${profile.salary_range_max.toLocaleString()}`
            }
          </div>
        )}

        {profile.relocation_preference && (
          <Badge variant="outline" className="text-[12px] rounded-lg border-chart-2/20 text-chart-2 capitalize">
            {profile.relocation_preference === "willing" ? (isAr ? "مستعد للانتقال" : "Open to Relocation") :
             profile.relocation_preference === "remote_only" ? (isAr ? "عن بعد فقط" : "Remote Only") :
             (isAr ? "في الموقع" : "On-site")}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
});
