import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ReportBuilder } from "@/components/admin/ReportBuilder";
import { FileText } from "lucide-react";

export default function ReportsAdmin() {
  return (
    <div className="space-y-6">
      <AdminPageHeader icon={FileText} title="Reports" description="Build and export reports" />
      <ReportBuilder />
    </div>
  );
}