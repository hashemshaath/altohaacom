import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getVerificationUrl } from "@/lib/qrCode";
import { toEnglishDigits } from "@/lib/formatNumber";

interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
  weight?: string;
  sku?: string;
  barcode?: string;
  gtin?: string;
  mpn?: string;
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
  forceLanguage?: "en" | "ar";
}

export default function PrintableInvoice({ invoice, company, showPrintButton = true, forceLanguage }: PrintableInvoiceProps) {
  const { language: contextLang } = useLanguage();
  const lang = forceLanguage || contextLang;
  const isAr = lang === "ar";
  const printRef = useRef<HTMLDivElement>(null);
  const items = (invoice.items || []) as InvoiceItem[];

  // Fetch invoice settings
  const { data: settings } = useQuery({
    queryKey: ["invoice-settings-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_settings")
        .select("*")
        .is("company_id", null)
        .single();
      if (error) return null;
      return data;
    },
    staleTime: 60000,
  });

  const cfg = settings || {} as Record<string, any>;

  const primaryColor = cfg.primary_color || "#10b981";
  const mainFW = cfg.main_font_weight === "regular" ? "400" : "700";
  const subFW = cfg.sub_font_weight === "bold" ? "700" : "400";
  const logoPos = cfg.logo_position || "right";
  const logoSize = cfg.logo_size ?? 80;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}">
      <head>
        <title>${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 14px; position: relative; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
          .brand { font-size: 24px; font-weight: ${mainFW}; color: ${primaryColor}; }
          .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: ${subFW}; }
          .invoice-title { text-align: ${isAr ? "left" : "right"}; }
          .invoice-title h2 { font-size: 28px; font-weight: ${mainFW}; color: #374151; text-transform: uppercase; letter-spacing: 2px; }
          .invoice-number { font-size: 14px; color: #6b7280; margin-top: 4px; font-weight: ${subFW}; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 600; }
          .meta-section p { font-size: 14px; line-height: 1.6; font-weight: ${subFW}; }
          .meta-section .name { font-weight: ${mainFW}; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead th { background: #f3f4f6; padding: 10px 12px; text-align: ${isAr ? "right" : "left"}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
          thead th.num { text-align: ${isAr ? "left" : "right"}; }
          tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-weight: ${subFW}; }
          tbody td.num { text-align: ${isAr ? "left" : "right"}; }
          .item-desc { font-size: 12px; color: #6b7280; }
          .item-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .item-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-${isAr ? "left" : "right"}: 8px; vertical-align: middle; }
          .totals { display: flex; justify-content: flex-end; margin-top: 10px; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .totals-row.total { font-weight: ${mainFW}; font-size: 18px; border-top: 2px solid #1a1a1a; padding-top: 10px; margin-top: 6px; }
          .label { color: #6b7280; font-weight: ${subFW}; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-sent, .status-pending { background: #fef3c7; color: #92400e; }
          .status-draft { background: #f3f4f6; color: #6b7280; }
          .status-overdue, .status-cancelled { background: #fee2e2; color: #991b1b; }
          .notes { margin-top: 30px; padding: 16px; background: #f9fafb; border-radius: 8px; }
          .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
          .policy { margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .policy h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 0; }
          .stamp { position: absolute; bottom: 120px; }
          .stamp.right { right: 40px; }
          .stamp.center { left: 50%; transform: translateX(-50%); }
          .stamp.left { left: 40px; }
          .contact-info { margin-top: 10px; font-size: 12px; color: #6b7280; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const formatDate = (date: string) => {
    try {
      return toEnglishDigits(new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      }));
    } catch { return date; }
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = { paid: "status-paid", sent: "status-sent", pending: "status-pending", draft: "status-draft", overdue: "status-overdue", cancelled: "status-cancelled" };
    return map[s] || "status-draft";
  };

  const statusLabel = (s: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      draft: { en: "Draft", ar: "مسودة" }, pending: { en: "Pending", ar: "قيد الانتظار" },
      sent: { en: "Sent", ar: "مرسلة" }, paid: { en: "Paid", ar: "مدفوعة" },
      overdue: { en: "Overdue", ar: "متأخرة" }, cancelled: { en: "Cancelled", ar: "ملغاة" },
    };
    const l = labels[s] || labels.draft;
    return isAr ? l.ar : l.en;
  };

  const invoiceTitle = isAr ? (cfg.invoice_title_ar || "فاتورة") : (cfg.invoice_title || "Invoice");
  const storePrefix = isAr ? (cfg.store_name_prefix_ar || "متجر إلكتروني") : (cfg.store_name_prefix || "E-commerce store");
  const showBarcode = cfg.show_invoice_barcode !== false;

  return (
    <div>
      {showPrintButton && (
        <div className="flex justify-end mb-4 print:hidden gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            {isAr ? "طباعة / تحميل PDF" : "Print / Download PDF"}
          </Button>
          {cfg.issue_english_copy && isAr && (
            <Button onClick={() => {
              const el = document.createElement("div");
              el.style.display = "none";
              document.body.appendChild(el);
              // Re-render with English would require a separate approach
              // For now, we redirect
            }} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print in English
            </Button>
          )}
        </div>
      )}

      <div ref={printRef} style={{ position: "relative" }}>
        {/* Watermark */}
        {cfg.watermark_url && (
          <div className="watermark" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 0 }}>
            <img src={cfg.watermark_url} alt="" style={{ opacity: (cfg.watermark_opacity ?? 30) / 100, maxWidth: "400px", maxHeight: "400px" }} />
          </div>
        )}

        {/* Header */}
        <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div style={{ order: logoPos === "right" ? 2 : logoPos === "left" ? 0 : 1 }}>
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt="Logo" style={{ height: `${logoSize * 0.8}px`, maxWidth: "200px", objectFit: "contain" }} />
            ) : (
              <>
                <div className="brand" style={{ fontSize: "24px", fontWeight: mainFW, color: primaryColor }}>Altoha</div>
                <div className="brand-sub" style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", fontWeight: subFW }}>
                  {storePrefix}
                </div>
              </>
            )}
          </div>
          <div className="invoice-title" style={{ textAlign: isAr ? "left" : "right", order: logoPos === "right" ? 0 : 2 }}>
            <h2 style={{ fontSize: "28px", fontWeight: mainFW, color: "#374151", textTransform: "uppercase", letterSpacing: "2px" }}>
              {invoiceTitle}
            </h2>
            <div className="invoice-number" style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>{invoice.invoice_number}</div>
            <div style={{ marginTop: "8px" }}>
              <span className={`status-badge ${statusClass(invoice.status || "draft")}`} style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>
                {statusLabel(invoice.status || "draft")}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
          <div>
            <h3 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: "8px", fontWeight: 600 }}>
              {isAr ? "فاتورة إلى" : "Bill To"}
            </h3>
            {company ? (
              <>
                <p style={{ fontWeight: mainFW, fontSize: "15px" }}>{isAr && company.name_ar ? company.name_ar : company.name}</p>
                {company.email && <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{company.email}</p>}
                {company.phone && <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{company.phone}</p>}
                {company.address && <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{company.address}</p>}
              </>
            ) : (
              <p style={{ color: "#9ca3af" }}>—</p>
            )}
          </div>
          <div style={{ textAlign: isAr ? "left" : "right" }}>
            <h3 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#9ca3af", marginBottom: "8px", fontWeight: 600 }}>
              {isAr ? "تفاصيل الفاتورة" : "Invoice Details"}
            </h3>
            <p><span style={{ color: "#6b7280" }}>{isAr ? "التاريخ: " : "Date: "}</span>{formatDate(invoice.created_at)}</p>
            {invoice.due_date && <p><span style={{ color: "#6b7280" }}>{isAr ? "الاستحقاق: " : "Due: "}</span>{formatDate(invoice.due_date)}</p>}
            {invoice.paid_at && <p><span style={{ color: "#6b7280" }}>{isAr ? "تم الدفع: " : "Paid: "}</span>{formatDate(invoice.paid_at)}</p>}
          </div>
        </div>

        {/* Title */}
        {(invoice.title || invoice.description) && (
          <div style={{ marginBottom: "20px" }}>
            {invoice.title && <p style={{ fontWeight: mainFW }}>{isAr && invoice.title_ar ? invoice.title_ar : invoice.title}</p>}
            {invoice.description && <p style={{ color: "#6b7280", fontSize: "13px" }}>{isAr && invoice.description_ar ? invoice.description_ar : invoice.description}</p>}
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
            <thead>
              <tr>
                <th style={{ background: "#f3f4f6", padding: "10px 12px", textAlign: isAr ? "right" : "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>#</th>
                {cfg.show_product_image && (
                  <th style={{ background: "#f3f4f6", padding: "10px 12px", fontSize: "11px", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb", width: "50px" }}></th>
                )}
                <th style={{ background: "#f3f4f6", padding: "10px 12px", textAlign: isAr ? "right" : "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>{isAr ? "الصنف" : "Item"}</th>
                <th style={{ background: "#f3f4f6", padding: "10px 12px", textAlign: isAr ? "left" : "right", fontSize: "11px", textTransform: "uppercase", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>{isAr ? "الكمية" : "Qty"}</th>
                <th style={{ background: "#f3f4f6", padding: "10px 12px", textAlign: isAr ? "left" : "right", fontSize: "11px", textTransform: "uppercase", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>{isAr ? "السعر" : "Price"}</th>
                <th style={{ background: "#f3f4f6", padding: "10px 12px", textAlign: isAr ? "left" : "right", fontSize: "11px", textTransform: "uppercase", color: "#6b7280", fontWeight: 600, borderBottom: "2px solid #e5e7eb" }}>{isAr ? "المجموع" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>{idx + 1}</td>
                  {cfg.show_product_image && (
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                      {item.image_url && <img src={item.image_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />}
                    </td>
                  )}
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontWeight: subFW }}>{item.name}</span>
                    {cfg.show_product_description && item.description && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{item.description}</div>
                    )}
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                      {cfg.show_gtin_code && item.gtin && <span>GTIN: {item.gtin} </span>}
                      {cfg.show_mpn_code && item.mpn && <span>MPN: {item.mpn} </span>}
                      {cfg.show_product_weight && item.weight && <span>{isAr ? "الوزن" : "Weight"}: {item.weight} </span>}
                      {cfg.show_product_stock_number && item.sku && <span>SKU: {item.sku} </span>}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", textAlign: isAr ? "left" : "right" }}>{item.quantity}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", textAlign: isAr ? "left" : "right" }}>{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", textAlign: isAr ? "left" : "right", fontWeight: 500 }}>{(item.quantity * item.unit_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <div style={{ width: "260px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{Number(invoice.subtotal || 0).toLocaleString()}</span>
            </div>
            {Number(invoice.tax_amount || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}>
                <span style={{ color: "#6b7280" }}>{isAr ? "الضريبة" : "Tax"} ({invoice.tax_rate || 0}%)</span>
                <span>{Number(invoice.tax_amount || 0).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", fontSize: "18px", fontWeight: mainFW, borderTop: "2px solid #1a1a1a", marginTop: "6px" }}>
              <span>{isAr ? "الإجمالي" : "Total"}</span>
              <span>{Number(invoice.amount || 0).toLocaleString()} {invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paid_at && (invoice.payment_method || invoice.payment_reference) && (
          <div style={{ marginTop: "20px", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "6px" }}>
              {isAr ? "معلومات الدفع" : "Payment Information"}
            </h4>
            {invoice.payment_method && <p>{isAr ? "الطريقة: " : "Method: "}{invoice.payment_method}</p>}
            {invoice.payment_reference && <p>{isAr ? "المرجع: " : "Reference: "}{invoice.payment_reference}</p>}
          </div>
        )}

        {/* Order Note */}
        {cfg.show_order_note && invoice.notes && (
          <div style={{ marginTop: "30px", padding: "16px", background: "#f9fafb", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "6px" }}>
              {isAr ? "ملاحظات" : "Notes"}
            </h4>
            <p>{isAr && invoice.notes_ar ? invoice.notes_ar : invoice.notes}</p>
          </div>
        )}

        {/* Return Policy */}
        {cfg.show_return_policy && (cfg.return_policy_text || cfg.return_policy_text_ar) && (
          <div style={{ marginTop: "20px", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280", marginBottom: "6px" }}>
              {isAr ? "سياسة الإرجاع والاستبدال" : "Return & Exchange Policy"}
            </h4>
            <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>
              {isAr ? (cfg.return_policy_text_ar || cfg.return_policy_text) : (cfg.return_policy_text || cfg.return_policy_text_ar)}
            </p>
          </div>
        )}

        {/* Stamp */}
        {cfg.stamp_url && (
          <div style={{
            position: "absolute",
            bottom: "120px",
            ...(cfg.stamp_position === "center" ? { left: "50%", transform: "translateX(-50%)" } :
                cfg.stamp_position === "left" ? { left: "40px" } : { right: "40px" }),
          }}>
            <img src={cfg.stamp_url} alt="" style={{ width: "100px", height: "100px", objectFit: "contain", opacity: (cfg.stamp_opacity ?? 30) / 100 }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
          <div>
            <p>{isAr ? "شكراً لتعاملكم معنا" : "Thank you for your business"}</p>
            <p style={{ marginTop: "4px" }}>Altoha Platform • altoha.com</p>
            {cfg.show_store_address && cfg.store_address && (
              <p style={{ marginTop: "4px" }}>{isAr ? cfg.store_address_ar || cfg.store_address : cfg.store_address}</p>
            )}
            {cfg.show_contact_info && (cfg.contact_email || cfg.contact_phone) && (
              <p style={{ marginTop: "4px" }}>
                {cfg.contact_email && <span>{cfg.contact_email}</span>}
                {cfg.contact_email && cfg.contact_phone && <span> • </span>}
                {cfg.contact_phone && <span>{cfg.contact_phone}</span>}
              </p>
            )}
          </div>
          {showBarcode && (
            <div style={{ textAlign: "center" }}>
              <QRCodeSVG
                value={getVerificationUrl(invoice.invoice_number)}
                size={60}
                level="M"
                bgColor="transparent"
                fgColor="#9ca3af"
              />
              <p style={{ fontSize: "9px", color: "#9ca3af", marginTop: "2px" }}>
                {isAr ? "مسح للتحقق" : "Scan to verify"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
