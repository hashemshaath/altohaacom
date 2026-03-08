import { memo } from "react";
import { Award, Image } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { CertificateDesign, LogoItem } from "./types";
import { getVerificationUrl } from "@/lib/qrCode";

interface CertificatePreviewProps {
  design: CertificateDesign;
  zoom: number;
  previewData: {
    recipientName: string;
    eventName: string;
    eventLocation: string;
    eventDate: string;
    achievement: string;
    certificateNumber: string;
    verificationCode: string;
  };
}

export function CertificatePreview({ design, zoom, previewData }: CertificatePreviewProps) {
  const isRtl = design.certificateLanguage === "ar";

  const getDimensions = () => {
    const sizes: Record<string, [number, number]> = { a4: [210, 297], letter: [216, 279], a3: [297, 420] };
    const [w, h] = sizes[design.paperSize] || sizes.a4;
    const baseW = design.orientation === "landscape" ? h : w;
    const baseH = design.orientation === "landscape" ? w : h;
    const scale = zoom / 100;
    return { width: baseW * 2.6 * scale, height: baseH * 2.6 * scale };
  };

  const { width: pw, height: ph } = getDimensions();
  const s = (px: number) => px * (zoom / 100);

  const replaceVars = (text: string) =>
    text
      .replace(/\{\{recipient_name\}\}/g, previewData.recipientName)
      .replace(/\{\{event_name\}\}/g, previewData.eventName)
      .replace(/\{\{event_location\}\}/g, previewData.eventLocation)
      .replace(/\{\{event_date\}\}/g, previewData.eventDate)
      .replace(/\{\{achievement\}\}/g, previewData.achievement)
      .replace(/\{\{certificate_number\}\}/g, previewData.certificateNumber)
      .replace(/\{\{verification_code\}\}/g, previewData.verificationCode);

  const getBgPattern = () => {
    switch (design.backgroundPattern) {
      case "subtle": return "background-image: radial-gradient(circle at 20% 50%, rgba(0,0,0,0.02) 0%, transparent 50%)";
      case "elegant": return "background-image: linear-gradient(135deg, rgba(0,0,0,0.015) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.015) 50%, rgba(0,0,0,0.015) 75%, transparent 75%); background-size: 60px 60px;";
      case "ornate": return "background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 20px 20px;";
      case "damask": return "background-image: radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, transparent 70%); background-size: 40px 40px;";
      case "geometric": return "background-image: linear-gradient(30deg, rgba(0,0,0,0.015) 12%, transparent 12.5%, transparent 87%, rgba(0,0,0,0.015) 87.5%); background-size: 40px 40px;";
      default: return "";
    }
  };

  const getOuterBorder = () => {
    switch (design.borderStyle) {
      case "simple": return { border: `${design.borderWidth}px solid ${design.borderColor}` };
      case "double": return { border: `${design.borderWidth}px double ${design.borderColor}` };
      case "ornate": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `inset 0 0 0 ${design.borderWidth + 2}px ${design.backgroundColor}, inset 0 0 0 ${design.borderWidth + 4}px ${design.borderColor}80` };
      case "gold": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `0 0 15px ${design.borderColor}30, inset 0 0 0 ${design.borderWidth + 3}px ${design.backgroundColor}, inset 0 0 0 ${design.borderWidth + 5}px ${design.borderColor}50, inset 0 0 40px ${design.borderColor}08` };
      case "classic": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `inset 0 0 0 2px ${design.backgroundColor}, inset 0 0 0 4px ${design.borderColor}60, inset 0 0 0 8px ${design.backgroundColor}, inset 0 0 0 9px ${design.borderColor}30` };
      case "modern": return { border: `${design.borderWidth}px solid ${design.borderColor}`, borderRadius: "4px" };
      default: return {};
    }
  };

  // Group logos by position
  const getLogos = (position: string) => design.logos.filter(l => l.position === position).sort((a, b) => a.order - b.order);

  const renderLogoGroup = (logos: LogoItem[], justify: string) => {
    if (logos.length === 0) return null;
    return (
      <div className="flex items-center gap-2" style={{ justifyContent: justify }}>
        {logos.map(logo => (
          <div key={logo.id} style={{ width: s(logo.width), height: s(logo.height) }} className="flex items-center justify-center">
            {logo.url ? (
              <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-muted/20 rounded flex items-center justify-center">
                <Image className="text-muted-foreground/30" style={{ width: "40%", height: "40%" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const headerLeft = getLogos("header-left");
  const headerCenter = getLogos("header-center");
  const headerRight = getLogos("header-right");
  const footerLeft = getLogos("footer-left");
  const footerCenter = getLogos("footer-center");
  const footerRight = getLogos("footer-right");
  const hasHeader = headerLeft.length > 0 || headerCenter.length > 0 || headerRight.length > 0;
  const hasFooter = footerLeft.length > 0 || footerCenter.length > 0 || footerRight.length > 0;

  return (
    <div
      data-certificate-preview
      className="relative shadow-2xl transition-all duration-300"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        width: pw,
        height: ph,
        backgroundColor: design.backgroundColor,
        ...getOuterBorder(),
        backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" ref={el => { if (el) el.style.cssText = getBgPattern(); }} />

      {/* Watermark */}
      {design.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: design.watermarkOpacity / 100 }}>
          <span className="text-muted-foreground font-bold tracking-[0.3em] rotate-[-30deg]" style={{ fontSize: s(60) }}>
            {design.watermarkText}
          </span>
        </div>
      )}

      {/* Corner ornaments */}
      {design.cornerOrnament && design.borderStyle !== "none" && (
        <>
          {[
            { top: s(8), left: s(8) },
            { top: s(8), right: s(8) },
            { bottom: s(8), left: s(8) },
            { bottom: s(8), right: s(8) },
          ].map((pos, i) => (
            <div key={i} className="absolute" style={{ ...pos, width: s(20), height: s(20) }}>
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d={i === 0 ? "M0 20 Q0 0 20 0" : i === 1 ? "M0 0 Q20 0 20 20" : i === 2 ? "M0 0 Q0 20 20 20" : "M20 0 Q0 0 0 20"}
                  stroke={design.borderColor}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* Inner content with margins */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: s(design.marginTop),
          paddingBottom: s(design.marginBottom),
          paddingLeft: s(design.marginLeft),
          paddingRight: s(design.marginRight),
        }}
      >
        {/* Inner border */}
        {design.innerBorderWidth > 0 && design.borderStyle !== "none" && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: s(design.marginTop - 4),
              bottom: s(design.marginBottom - 4),
              left: s(design.marginLeft - 4),
              right: s(design.marginRight - 4),
              border: `${design.innerBorderWidth}px solid ${design.borderColor}50`,
            }}
          />
        )}

        {/* Padded content */}
        <div className="flex flex-col h-full" style={{ padding: s(design.innerPadding) }}>
          {/* Header Logos */}
          {hasHeader && (
            <div className="flex justify-between items-center shrink-0" style={{ marginBottom: s(8) }}>
              {renderLogoGroup(headerLeft, "flex-start")}
              {renderLogoGroup(headerCenter, "center")}
              {renderLogoGroup(headerRight, "flex-end")}
              {/* Placeholder if empty on sides */}
              {headerLeft.length === 0 && headerRight.length === 0 && headerCenter.length === 0 && (
                <>
                  <div className="bg-muted/20 rounded flex items-center justify-center" style={{ width: s(70), height: s(70) }}>
                    <Image className="text-muted-foreground/30" style={{ width: "40%", height: "40%" }} />
                  </div>
                  <div className="bg-muted/20 rounded flex items-center justify-center" style={{ width: s(70), height: s(70) }}>
                    <Image className="text-muted-foreground/30" style={{ width: "40%", height: "40%" }} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Decorative line */}
          <div className="shrink-0 mx-auto" style={{ width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${design.borderColor}40, transparent)`, marginBottom: s(6) }} />

          {/* Award Icon */}
          {design.showAwardIcon && (
            <div className="flex justify-center shrink-0" style={{ marginBottom: s(4) }}>
              <Award style={{ color: design.awardIconColor, width: s(design.awardIconSize), height: s(design.awardIconSize) }} />
            </div>
          )}

          {/* Dynamic Lines */}
          <div className="flex-1 flex flex-col justify-center">
            {design.lines.map(line => (
              <div
                key={line.id}
                style={{
                  textAlign: line.alignment,
                  marginBottom: s(line.marginBottom),
                }}
              >
                <p
                  style={{
                    fontFamily: line.font,
                    fontSize: s(line.fontSize),
                    color: line.color,
                    fontWeight: line.fontWeight,
                    letterSpacing: `${line.letterSpacing}px`,
                    lineHeight: line.lineHeight,
                  }}
                >
                  {line.isVariable ? replaceVars(line.text) : line.text}
                </p>
              </div>
            ))}
          </div>

          {/* Signatures */}
          {design.signatures.length > 0 && (
            <div className="shrink-0 flex justify-center gap-8" style={{ marginTop: s(10) }}>
              {design.signatures.map(sig => (
                <div key={sig.id} className="text-center" style={{ width: s(design.signatureLineWidth) }}>
                  {sig.signatureUrl ? (
                    <img src={sig.signatureUrl} alt="" className="mx-auto mb-1" style={{ height: s(30), objectFit: "contain" }} loading="lazy" />
                  ) : (
                    <div style={{ height: s(20) }} />
                  )}
                  <div style={{ width: "100%", height: 1, background: design.signatureLineColor, marginBottom: s(3) }} />
                  <p style={{ fontSize: s(10), color: "#1a1a1a", fontWeight: 600 }}>{sig.name}</p>
                  <p style={{ fontSize: s(8), color: "#6b7280" }}>{sig.title}</p>
                  {sig.organization && <p style={{ fontSize: s(7), color: "#9ca3af" }}>{sig.organization}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Footer Logos */}
          {hasFooter && (
            <div className="flex justify-between items-center shrink-0" style={{ marginTop: s(8) }}>
              {renderLogoGroup(footerLeft, "flex-start")}
              {renderLogoGroup(footerCenter, "center")}
              {renderLogoGroup(footerRight, "flex-end")}
            </div>
          )}

          {/* Certificate Number, Verification Code & QR */}
          {(design.showCertificateNumber || design.showVerificationCode) && (
            <div className="shrink-0 flex justify-between items-end" style={{ marginTop: s(6) }}>
              <div className="flex flex-col">
                {design.showCertificateNumber && (
                  <span style={{ fontSize: s(7), color: "#9ca3af", fontFamily: "monospace" }}>
                    {previewData.certificateNumber}
                  </span>
                )}
                {design.showVerificationCode && (
                  <span style={{ fontSize: s(7), color: "#9ca3af", fontFamily: "monospace" }}>
                    {isRtl ? "كود التحقق" : "Verify"}: {previewData.verificationCode}
                  </span>
                )}
              </div>
              {design.showVerificationCode && (
                <div style={{ width: s(45), height: s(45) }}>
                  <QRCodeSVG
                    value={getVerificationUrl(previewData.verificationCode)}
                    size={s(45)}
                    level="M"
                    bgColor="transparent"
                    fgColor="#6b7280"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
