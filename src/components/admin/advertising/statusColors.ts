export const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  pending_approval: "bg-warning/10 text-warning border-warning/20",
  pending_review: "bg-warning/10 text-warning border-warning/20",
  under_review: "bg-primary/10 text-primary border-primary/20",
  approved: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  active: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  paused: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  completed: "bg-muted text-muted-foreground border-border",
  draft: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};
