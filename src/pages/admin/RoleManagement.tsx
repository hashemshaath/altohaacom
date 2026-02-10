import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ChefHat, Award, Users, Hand, Heart, Headphones, Eye } from "lucide-react";

export default function RoleManagement() {
  const { t } = useLanguage();

  const roles = [
    {
      role: "chef",
      icon: ChefHat,
      color: "bg-chart-2/10 text-chart-2",
      permissions: ["Create posts", "Join groups", "Participate in competitions"],
    },
    {
      role: "judge",
      icon: Award,
      color: "bg-chart-3/10 text-chart-3",
      permissions: ["Judge competitions", "Rate dishes", "Provide feedback"],
    },
    {
      role: "student",
      icon: Users,
      color: "bg-primary/10 text-primary",
      permissions: ["Access courses", "Submit assignments", "Join study groups"],
    },
    {
      role: "organizer",
      icon: Shield,
      color: "bg-destructive/10 text-destructive",
      permissions: ["Create competitions", "Manage events", "Admin access"],
    },
    {
      role: "volunteer",
      icon: Hand,
      color: "bg-chart-5/10 text-chart-5",
      permissions: ["Assist events", "Support participants", "Help moderation"],
    },
    {
      role: "sponsor",
      icon: Heart,
      color: "bg-chart-1/10 text-chart-1",
      permissions: ["Sponsor events", "Featured placement", "Analytics access"],
    },
    {
      role: "assistant",
      icon: Headphones,
      color: "bg-accent text-accent-foreground",
      permissions: ["Support users", "Basic moderation", "Answer queries"],
    },
    {
      role: "supervisor",
      icon: Eye,
      color: "bg-chart-4/10 text-chart-4",
      permissions: ["Full admin access", "Manage all users", "System configuration"],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">{t("rolePermissions")}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((item) => (
          <Card key={item.role}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t(item.role as any)}</CardTitle>
                  <CardDescription className="text-xs">
                    Role: {item.role.toUpperCase()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {item.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
