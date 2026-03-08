import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Printer } from "lucide-react";

interface Props {
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isAr: boolean;
}

export const EntityContactCard = memo(function EntityContactCard({ email, phone, fax, address, city, country, postalCode, isAr }: Props) {
  const hasContact = email || phone || fax || address || city || country;
  if (!hasContact) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-accent/10">
            <Mail className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
          {isAr ? "معلومات الاتصال" : "Contact Information"}
        </h3>
      </div>
      <CardContent className="space-y-3 p-4 text-sm">
        {email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <a href={`mailto:${email}`} className="text-primary hover:underline truncate" dir="ltr">{email}</a>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <span dir="ltr">{phone}</span>
          </div>
        )}
        {fax && (
          <div className="flex items-center gap-3">
            <Printer className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{isAr ? "فاكس:" : "Fax:"} <span dir="ltr">{fax}</span></span>
          </div>
        )}
        {(address || city || country) && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              {address && <p>{address}</p>}
              <p className="text-muted-foreground">
                {[city, country].filter(Boolean).join(", ")}
              </p>
              {postalCode && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  {isAr ? "الرمز البريدي:" : "Postal Code:"} <span dir="ltr">{postalCode}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
