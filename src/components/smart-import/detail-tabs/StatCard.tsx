import React from "react";
import type { LucideIcon } from "lucide-react";

export const StatCard = React.memo(({ icon: Icon, iconClass, bgClass, label, value, sub, small }: {
  icon: LucideIcon;
  iconClass?: string;
  bgClass?: string;
  label: string;
  value: string | number;
  sub?: string;
  small?: boolean;
}) => (
  <div className={`text-center p-3 rounded-xl ${bgClass || 'bg-accent/30'}`}>
    <Icon className={`h-4 w-4 mx-auto mb-1 ${iconClass || 'text-primary'}`} />
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-${small ? 'medium' : 'bold'} ${small ? 'text-sm truncate' : 'text-lg'}`}>{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
));
StatCard.displayName = "StatCard";
