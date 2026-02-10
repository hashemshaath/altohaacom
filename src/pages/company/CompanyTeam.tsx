import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Mail, Phone, Building } from "lucide-react";

export default function CompanyTeam() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["companyContacts", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_contacts")
        .select("*")
        .eq("company_id", companyId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {language === "ar" ? "فريق العمل" : "Team Members"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === "ar" ? "إدارة جهات الاتصال والممثلين" : "Manage contacts and representatives"}
          </p>
        </div>
        {!isLoading && contacts && (
          <Badge variant="secondary" className="text-sm">
            {contacts.length} {language === "ar" ? "عضو" : "members"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, index) => (
            <Card
              key={contact.id}
              className="animate-fade-in overflow-hidden hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {contact.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{contact.name}</h3>
                      {contact.is_primary && (
                        <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5">
                          {language === "ar" ? "رئيسي" : "Primary"}
                        </Badge>
                      )}
                    </div>
                    {contact.title && (
                      <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
                    )}
                    {contact.department && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>{contact.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t pt-3">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد جهات اتصال" : "No contacts found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
