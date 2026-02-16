import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, Building, ExternalLink } from "lucide-react";

interface Props {
  organizerName?: string | null;
  organizerLogo?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  isAr: boolean;
}

export function ExhibitionContactCard({ organizerName, organizerLogo, email, phone, website, isAr }: Props) {
  if (!email && !phone && !website) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <Phone className="h-3.5 w-3.5 text-primary" />
          </div>
          {isAr ? "معلومات الاتصال" : "Contact Information"}
        </h3>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Organizer */}
        {organizerName && (
          <div className="flex items-center gap-3 pb-3 border-b border-border/40">
            {organizerLogo ? (
              <img src={organizerLogo} alt={organizerName} className="h-12 w-12 rounded-xl object-contain bg-muted/30 p-1 border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border">
                <Building className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isAr ? "المنظم" : "Organizer"}
              </p>
              <p className="text-sm font-bold">{organizerName}</p>
            </div>
          </div>
        )}

        {/* Contact details */}
        <div className="space-y-2.5">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 shrink-0">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="truncate text-primary group-hover:underline">{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3/5 shrink-0">
                <Phone className="h-3.5 w-3.5 text-chart-3" />
              </div>
              <span className="font-mono text-xs">{phone}</span>
            </a>
          )}
          {website && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                <Globe className="me-2 h-3.5 w-3.5" />
                {isAr ? "الموقع الرسمي" : "Official Website"}
                <ExternalLink className="ms-auto h-3 w-3 text-muted-foreground" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
