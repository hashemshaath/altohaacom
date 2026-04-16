import { ROUTES } from "@/config/routes";
import { forwardRef, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface NavLink {
  to: string;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
}

interface DesktopNavProps {
  primaryNav: NavLink[];
  moreLinks: NavLink[];
  isJudge: boolean;
  isAr: boolean;
}

export const DesktopNav = forwardRef<HTMLElement, DesktopNavProps>(function DesktopNav(
  { primaryNav, moreLinks, isJudge, isAr },
  ref
) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/"));
  const label = (en: string, ar: string) => (isAr ? ar : en);

  const colSize = Math.ceil(moreLinks.length / 3);
  const col1 = moreLinks.slice(0, colSize);
  const col2 = moreLinks.slice(colSize, colSize * 2);
  const col3 = moreLinks.slice(colSize * 2);

  const anyMoreActive = moreLinks.some((l) => isActive(l.to));

  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const openMega = useCallback(() => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 150);
  }, []);

  return (
    <nav
      ref={ref}
      className="hidden items-center lg:flex flex-1 justify-center"
      style={{ gap: "32px" }}
      aria-label="Primary navigation"
    >
      {primaryNav.map((link) => {
        const active = isActive(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "relative py-[20px] text-[0.9375rem] font-medium transition-colors duration-150 whitespace-nowrap",
              active ? "font-semibold" : ""
            )}
            style={{
              color: active ? "#1C1C1A" : "#6B6560",
              borderBottom: active ? "2px solid #C05B2E" : "2px solid transparent",
              marginBottom: "-1px",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "#1C1C1A";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "#6B6560";
            }}
          >
            {label(link.labelEn, link.labelAr)}
          </Link>
        );
      })}

      {/* Chef's Table */}
      {(() => {
        const active = isActive("/chefs-table");
        return (
          <Link
            to={ROUTES.chefsTable}
            className={cn(
              "relative py-[20px] text-[0.9375rem] font-medium transition-colors duration-150 whitespace-nowrap",
              active ? "font-semibold" : ""
            )}
            style={{
              color: active ? "#1C1C1A" : "#6B6560",
              borderBottom: active ? "2px solid #C05B2E" : "2px solid transparent",
              marginBottom: "-1px",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "#1C1C1A";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "#6B6560";
            }}
          >
            {label("Chef's Table", "طاولة الشيف")}
          </Link>
        );
      })()}

      {/* Explore mega dropdown */}
      <div
        className="relative"
        onMouseEnter={openMega}
        onMouseLeave={closeMega}
      >
        <button
          className={cn(
            "flex items-center gap-1.5 py-[20px] text-[0.9375rem] font-medium transition-colors duration-150 whitespace-nowrap",
            (anyMoreActive || megaOpen) ? "font-semibold" : ""
          )}
          style={{
            color: (anyMoreActive || megaOpen) ? "#1C1C1A" : "#6B6560",
            borderBottom: anyMoreActive ? "2px solid #C05B2E" : "2px solid transparent",
            marginBottom: "-1px",
          }}
          aria-expanded={megaOpen}
          aria-haspopup="true"
        >
          {label("Explore", "اكتشف")}
          <ChevronDown
            className={cn(
              "h-3 w-3 opacity-60 transition-transform duration-200",
              megaOpen && "rotate-180"
            )}
          />
        </button>

        {/* Mega Dropdown */}
        <div
          className={cn(
            "absolute top-full pt-2 z-50",
            isAr ? "right-1/2 translate-x-1/2" : "left-1/2 -translate-x-1/2",
            megaOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-1 pointer-events-none"
          )}
          style={{ transition: "opacity 150ms ease, transform 150ms ease" }}
          onMouseEnter={openMega}
          onMouseLeave={closeMega}
        >
          <div
            className="w-[680px] rounded-xl p-6"
            style={{
              background: "#FEFCF8",
              border: "1px solid rgba(28,28,26,0.1)",
              boxShadow: "0 8px 32px rgba(28,28,26,0.12)",
            }}
          >
            <p
              className="text-label font-semibold uppercase tracking-[0.08em] mb-4"
              style={{ color: "#9E9890" }}
            >
              {label("Explore the Platform", "اكتشف المنصة")}
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1">
              {[col1, col2, col3].map((col, ci) => (
                <div key={ci} className="space-y-0.5">
                  {col.map((link) => {
                    const active = isActive(link.to);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 group/item"
                        style={{
                          background: active ? "rgba(192,91,46,0.06)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = "#F5F0E8";
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                          style={{
                            background: active ? "rgba(192,91,46,0.1)" : "#F5F0E8",
                            color: active ? "#C05B2E" : "#9E9890",
                          }}
                        >
                          <Icon className="h-[16px] w-[16px]" />
                        </div>
                        <span
                          className="text-[0.875rem] font-medium transition-colors"
                          style={{ color: active ? "#C05B2E" : "#1C1C1A" }}
                        >
                          {label(link.labelEn, link.labelAr)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
});

DesktopNav.displayName = "DesktopNav";
