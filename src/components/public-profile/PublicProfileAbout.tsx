import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Briefcase, Sparkles } from "lucide-react";

interface Props {
  profile: any;
  bio: string | null;
  specialization: string | null;
  userSpecialties: any[];
  isAr: boolean;
}

export function PublicProfileAbout({ profile, bio, specialization, userSpecialties, isAr }: Props) {
  if (!bio && !specialization) return null;

  return (
    <Card className="rounded-2xl border-border/30 bg-card/90">
      <CardContent className="p-5 space-y-4">
        {bio && <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{bio}</p>}
        
        {specialization && (
          <>
            {bio && <Separator className="bg-border/20" />}
            <div>
              <h4 className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <ChefHat className="h-3 w-3 text-primary" />
                {isAr ? "التخصص" : "Specialization"}
              </h4>
              <p className="text-sm font-medium mb-2">{specialization}</p>
              {userSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {userSpecialties.map((us: any) => (
                    <Badge key={us.id} variant="secondary" className="text-[10px] h-5 rounded-xl">
                      {isAr ? us.specialties?.name_ar || us.specialties?.name : us.specialties?.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {profile.offers_services && (
          <>
            <Separator className="bg-border/20" />
            <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-3.5 border border-primary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold flex items-center gap-1">
                  {isAr ? "متاح للعمل والخدمات" : "Available for Services"}
                  <Sparkles className="h-3 w-3 text-primary" />
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isAr ? (profile.services_description_ar || profile.services_description || "متاح للعمل")
                    : (profile.services_description || "Available for hire")}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
