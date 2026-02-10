import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

interface PrintableInvoiceProps {
  invoice: {
    invoice_number: string;
    title?: string | null;
    title_ar?: string | null;
    description?: string | null;
    description_ar?: string | null;
    currency: string;
    subtotal: number | null;
    tax_rate: number | null;
    tax_amount: number | null;
    amount: number | null;
    status?: string | null;
    created_at: string;
    due_date?: string | null;
    paid_at?: string | null;
    payment_method?: string | null;
    payment_reference?: string | null;
    notes?: string | null;
    notes_ar?: string | null;
    items?: unknown;
  };
  company?: {
    name: string;
    name_ar?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
  showPrintButton?: boolean;
}

export default function PrintableInvoice({ invoice, company, showPrintButton = true }: PrintableInvoiceProps) {
  const { language } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);
  const items = (invoice.items || []) as InvoiceItem[];

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${language === "ar" ? "rtl" : "ltr"}">
      <head>
        <title>${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .brand { font-size: 24px; font-weight: 700; color: #10b981; }
          .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .invoice-title { text-align: ${language === "ar" ? "left" : "right"}; }
          .invoice-title h2 { font-size: 28px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-number { font-size: 14px; color: #6b7280; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 600; }
          .meta-section p { font-size: 14px; line-height: 1.6; }
          .meta-section .name { font-weight: 600; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead th { background: #f3f4f6; padding: 10px 12px; text-align: ${language === "ar" ? "right" : "left"}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          thead th.num { text-align: ${language === "ar" ? "left" : "right"}; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
          tbody td.num { text-align: ${language === "ar" ? "left" : "right"}; }
          .item-desc { font-size: 12px; color: #6b7280; }
          .totals { display: flex; justify-content: flex-end; margin-top: 10px; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.total { font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 6px; }
          .label { color: #6b7280; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-sent, .status-pending { background: #fef3c7; color: #92400e; }
          .status-draft { background: #f3f4f6; color: #6b7280; }
          .status-overdue, .status-cancelled { background: #fee2e2; color: #991b1b; }
          .notes { margin-top: 30px; padding: 16px; background: #f9fafb; border-radius: 8px; }
          .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = {
      paid: "status-paid",
      sent: "status-sent",
      pending: "status-pending",
      draft: "status-draft",
      overdue: "status-overdue",
      cancelled: "status-cancelled",
    };
    return map[s] || "status-draft";
  };

  const statusLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" },
      pending: { en: "Pending", ar: "قيد الانتظار" },
      sent: { en: "Sent", ar: "مرسلة" },
      paid: { en: "Paid", ar: "مدفوعة" },
      overdue: { en: "Overdue", ar: "متأخرة" },
      cancelled: { en: "Cancelled", ar: "ملغاة" },
    };
    const l = labels[s] || labels.draft;
    return language === "ar" ? l.ar : l.en;
  };

  return (
    <div>
      {showPrintButton && (
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            {language === "ar" ? "طباعة / تحميل PDF" : "Print / Download PDF"}
          </Button>
        </div>
      )}

      <div ref={printRef}>
        {/* Header */}
        <div className="header">
          <div>
            <div className="brand">Altohaa</div>
            <div className="brand-sub">
              {language === "ar" ? "منصة الطهاة المحترفين" : "Professional Culinary Platform"}
            </div>
          </div>
          <div className="invoice-title">
            <h2>{language === "ar" ? "فاتورة" : "Invoice"}</h2>
            <div className="invoice-number">{invoice.invoice_number}</div>
            <div style={{ marginTop: "8px" }}>
              <span className={`status-badge ${statusClass(invoice.status || "draft")}`}>
                {statusLabel(invoice.status || "draft")}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="meta-grid">
          <div className="meta-section">
            <h3>{language === "ar" ? "فاتورة إلى" : "Bill To"}</h3>
            {company ? (
              <>
                <p className="name">{language === "ar" && company.name_ar ? company.name_ar : company.name}</p>
                {company.email && <p>{company.email}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.address && <p>{company.address}</p>}
              </>
            ) : (
              <p style={{ color: "#9ca3af" }}>{language === "ar" ? "—" : "—"}</p>
            )}
          </div>
          <div className="meta-section" style={{ textAlign: language === "ar" ? "left" : "right" }}>
            <h3>{language === "ar" ? "تفاصيل الفاتورة" : "Invoice Details"}</h3>
            <p>
              <span className="label">{language === "ar" ? "التاريخ: " : "Date: "}</span>
              {formatDate(invoice.created_at)}
            </p>
            {invoice.due_date && (
              <p>
                <span className="label">{language === "ar" ? "الاستحقاق: " : "Due: "}</span>
                {formatDate(invoice.due_date)}
              </p>
            )}
            {invoice.paid_at && (
              <p>
                <span className="label">{language === "ar" ? "تم الدفع: " : "Paid: "}</span>
                {formatDate(invoice.paid_at)}
              </p>
            )}
          </div>
        </div>

        {/* Title */}
        {(invoice.title || invoice.description) && (
          <div style={{ marginBottom: "20px" }}>
            {invoice.title && <p style={{ fontWeight: 600 }}>{invoice.title}</p>}
            {invoice.description && <p style={{ color: "#6b7280", fontSize: "13px" }}>{invoice.description}</p>}
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{language === "ar" ? "الصنف" : "Item"}</th>
                <th className="num">{language === "ar" ? "الكمية" : "Qty"}</th>
                <th className="num">{language === "ar" ? "السعر" : "Price"}</th>
                <th className="num">{language === "ar" ? "المجموع" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {item.name}
                    {item.description && <div className="item-desc">{item.description}</div>}
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{Number(item.unit_price).toLocaleString()}</td>
                  <td className="num" style={{ fontWeight: 500 }}>{(item.quantity * item.unit_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="totals">
          <div className="totals-box">
            <div className="totals-row">
              <span className="label">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            {Number(invoice.tax_amount || 0) > 0 && (
              <div className="totals-row">
                <span className="label">{language === "ar" ? "الضريبة" : "Tax"} ({invoice.tax_rate || 0}%)</span>
                <span>{Number(invoice.tax_amount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="totals-row total">
              <span>{language === "ar" ? "الإجمالي" : "Total"}</span>
              <span>{Number(invoice.amount || 0).toLocaleString()} {invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paid_at && (invoice.payment_method || invoice.payment_reference) && (
          <div className="notes" style={{ marginTop: "20px" }}>
            <h4>{language === "ar" ? "معلومات الدفع" : "Payment Information"}</h4>
            {invoice.payment_method && <p>{language === "ar" ? "الطريقة: " : "Method: "}{invoice.payment_method}</p>}
            {invoice.payment_reference && <p>{language === "ar" ? "المرجع: " : "Reference: "}{invoice.payment_reference}</p>}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="notes">
            <h4>{language === "ar" ? "ملاحظات" : "Notes"}</h4>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>{language === "ar" ? "شكراً لتعاملكم معنا" : "Thank you for your business"}</p>
          <p style={{ marginTop: "4px" }}>Altohaa Platform • altohaa.com</p>
        </div>
      </div>
    </div>
  );
}
