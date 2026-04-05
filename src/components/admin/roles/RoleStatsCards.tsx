import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Progress } from "@/components/ui/progress";
import { ROLE_META, type AppRole } from "./types";

interface Props {
  roleStats: { role: AppRole; count: number }[];
  allRolePerms: any[];
  totalPerms: number;
  activeRole: AppRole;
  activeTab: string;
  isAr: boolean;
  onSelect: (role: AppRole) => void;
}

export default function RoleStatsCards({ roleStats, allRolePerms, totalPerms, activeRole, activeTab, isAr, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
      {roleStats.map(({ role, count }) => {
        const meta = ROLE_META[role];
        const Icon = meta.icon;
        const permCount = allRolePerms.filter((rp) => rp.role === role).length;
        const permPercent = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;
        const isActive = activeRole === role && activeTab === "permissions";
        return (
          <Card
            key={role}
            className={`rounded-2xl cursor-pointer group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] touch-manipulation ${
              isActive ? "ring-2 ring-primary border-primary/40" : "border-border/40 hover:border-primary/30"
            }`}
            onClick={() => onSelect(role)}
          >
            <CardContent className="p-3 text-center space-y-1">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${meta.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold truncate">{isAr ? meta.labelAr : meta.labelEn}</p>
              <AnimatedCounter value={count} className="text-lg font-bold leading-none" />
              <Progress value={permPercent} className="h-1 mt-1" />
              <p className="text-[10px] text-muted-foreground">{permCount}/{totalPerms}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
