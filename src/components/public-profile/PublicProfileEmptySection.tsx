import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PublicProfileEmptySectionProps {
  icon: LucideIcon;
  label: string;
  description: string;
  isAr: boolean;
}

export function PublicProfileEmptySection({ icon: Icon, label, description }: PublicProfileEmptySectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
          <Icon className="h-4 w-4 text-primary/60" />
        </div>
        <h2 className="text-base font-bold text-foreground/70">{label}</h2>
        <div className="flex-1 h-px bg-border/25" />
      </div>
      <Card className="rounded-2xl border border-dashed border-border/30 bg-muted/10">
        <CardContent className="py-8 px-6 flex flex-col items-center justify-center text-center gap-2.5">
          <div className="h-11 w-11 rounded-full bg-muted/40 flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/50 max-w-[200px]">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
