import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Grid3X3, Search, Download, RotateCcw } from "lucide-react";
import { ROLE_META, ALL_ROLES, type AppRole } from "./types";
import { format } from "date-fns";

interface Permission {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

interface Props {
  permissions: Permission[];
  allRolePerms: Record<string, any>[];
  isAr: boolean;
  t: (en: string, ar: string) => string;
}

export default function MatrixTab({ permissions, allRolePerms, isAr, t }: Props) {
  const [matrixSearch, setMatrixSearch] = useState("");
  const [compareRoles, setCompareRoles] = useState<AppRole[]>([]);

  const rolesToShow = compareRoles.length >= 2 ? compareRoles : ALL_ROLES;

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    const cat = p.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const matrixData = Object.entries(grouped).map(([category, perms]) => ({
    category,
    perms: perms
      .filter((p) => !matrixSearch || p.name.toLowerCase().includes(matrixSearch.toLowerCase()) || p.code.toLowerCase().includes(matrixSearch.toLowerCase()) || (p.name_ar && p.name_ar.includes(matrixSearch)))
      .map((p) => ({
        ...p,
        roles: rolesToShow.reduce<Record<string, boolean>>((acc, role) => {
          acc[role] = allRolePerms.some((rp) => rp.role === role && rp.permission_id === p.id);
          return acc;
        }, {}),
      })),
  })).filter(g => g.perms.length > 0);

  const toggleCompareRole = (role: AppRole) => {
    setCompareRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const exportMatrixCSV = () => {
    const headers = [t("Category", "التصنيف"), t("Permission", "الصلاحية"), t("Code", "الكود"), ...rolesToShow.map(r => ROLE_META[r].labelEn)];
    const rows = matrixData.flatMap(({ category, perms }) =>
      perms.map((p) => [category, p.name, p.code, ...rolesToShow.map(r => p.roles[r] ? "✓" : "")])
    );
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permission-matrix-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute summary per role
  const roleSummary = rolesToShow.map(role => {
    const count = allRolePerms.filter((rp) => rp.role === role).length;
    return { role, count };
  });

  return (
    <div className="space-y-4">
      {/* Compare Role Selector */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium text-muted-foreground">{t("Compare roles:", "مقارنة الأدوار:")}</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ROLES.map(role => {
                const meta = ROLE_META[role];
                const Icon = meta.icon;
                const selected = compareRoles.includes(role);
                return (
                  <Button key={role} variant={selected ? "default" : "outline"} size="sm"
                    className={`h-7 text-xs gap-1 rounded-xl active:scale-[0.98] touch-manipulation ${!selected ? "opacity-50 hover:opacity-80" : ""}`}
                    onClick={() => toggleCompareRole(role)}>
                    <Icon className="h-3 w-3" />
                    {isAr ? meta.labelAr : meta.labelEn}
                  </Button>
                );
              })}
            </div>
            {compareRoles.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setCompareRoles([])}>
                <RotateCcw className="h-3 w-3" /> {t("Reset", "إعادة")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary badges */}
      {compareRoles.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          {roleSummary.map(({ role, count }) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <Badge key={role} variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                <Icon className="h-3 w-3" />
                {isAr ? meta.labelAr : meta.labelEn}: {count} {t("perms", "صلاحية")}
              </Badge>
            );
          })}
        </div>
      )}

      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              {t("Role-Permission Matrix", "مصفوفة الصلاحيات لكل دور")}
              <Badge variant="secondary" className="text-xs">{permissions.length} {t("total", "إجمالي")}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder={t("Filter...", "بحث...")} value={matrixSearch} onChange={e => setMatrixSearch(e.target.value)} className="ps-8 h-8 w-48 text-xs rounded-xl" />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl" onClick={exportMatrixCSV}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full" dir="ltr">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky start-0 bg-background z-10 w-[220px]">
                      {t("Permission", "الصلاحية")}
                    </TableHead>
                    {rolesToShow.map((role) => {
                      const meta = ROLE_META[role];
                      const Icon = meta.icon;
                      return (
                        <TableHead key={role} className="text-center w-[85px]">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.color}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium">{isAr ? meta.labelAr : meta.labelEn}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.map(({ category, perms }) => (
                    <>
                      <TableRow key={`cat-${category}`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={rolesToShow.length + 1} className="py-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</span>
                        </TableCell>
                      </TableRow>
                      {perms.map((perm) => (
                        <TableRow key={perm.id} className="hover:bg-muted/20">
                          <TableCell className="sticky start-0 bg-background z-10">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs cursor-help">{isAr ? perm.name_ar || perm.name : perm.name}</span>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <span className="font-mono text-xs">{perm.code}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          {rolesToShow.map((role) => (
                            <TableCell key={role} className="text-center">
                              {perm.roles[role] ? (
                                <CheckCircle2 className="mx-auto h-4 w-4 text-chart-2" />
                              ) : (
                                <XCircle className="mx-auto h-4 w-4 text-muted-foreground/15" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  ))}
                  {matrixData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={rolesToShow.length + 1} className="text-center py-12 text-muted-foreground text-sm">
                        {t("No permissions found", "لا توجد صلاحيات")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
