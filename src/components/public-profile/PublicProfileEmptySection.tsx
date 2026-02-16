import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PublicProfileEmptySectionProps {
  icon: LucideIcon;
  label: string;
  description: string;
  isAr: boolean;
}

export function PublicProfileEmptySection({ icon: Icon, label, description, isAr }: PublicProfileEmptySectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-serif text-base font-bold">{label}</h2>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <Card className="rounded-2xl border-dashed border-border/40 bg-muted/20">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-xs text-muted-foreground/60">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
