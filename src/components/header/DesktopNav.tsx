import { forwardRef, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Scale, ChevronDown, Compass } from "lucide-react";

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

  // Split moreLinks into 3 columns for mega dropdown
  const colSize = Math.ceil(moreLinks.length / 3);
  const col1 = moreLinks.slice(0, colSize);
  const col2 = moreLinks.slice(colSize, colSize * 2);
  const col3 = moreLinks.slice(colSize * 2);

  const anyMoreActive = moreLinks.some((l) => isActive(l.to));

  // Hover-triggered mega dropdown
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
              "relative text-[14px] font-medium transition-colors duration-[150ms] whitespace-nowrap",
              active
                ? "text-[var(--color-primary)] font-semibold"
                : "text-[var(--color-body)] hover:text-[var(--color-primary)]"
            )}
          >
            {label(link.labelEn, link.labelAr)}
          </Link>
        );
      })}

      {/* Chef's Table */}
      <Link
        to="/chefs-table"
        className={cn(
          "relative text-[14px] font-medium transition-colors duration-[150ms] whitespace-nowrap",
          isActive("/chefs-table")
            ? "text-[var(--color-primary)] font-semibold"
            : "text-[var(--color-body)] hover:text-[var(--color-primary)]"
        )}
      >
        {label("Chef's Table", "طاولة الشيف")}
      </Link>

      {/* Explore with mega dropdown */}
      <div
        className="relative"
        onMouseEnter={openMega}
        onMouseLeave={closeMega}
      >
        <button
          className={cn(
            "flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-[150ms] whitespace-nowrap",
            anyMoreActive || megaOpen
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-body)] hover:text-[var(--color-primary)]"
          )}
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
            className="w-[680px] rounded-b-[16px] border border-[var(--color-border-light)] border-t-0 bg-[var(--bg-white)] p-6"
            style={{
              boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            }}
          >
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)] mb-4">
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
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 transition-all duration-[var(--transition-fast)] group/item",
                          active
                            ? "bg-[var(--bg-purple-wash)]"
                            : "hover:bg-[var(--bg-surface)]"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                            active
                              ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                              : "bg-[var(--bg-purple-wash)] text-[var(--color-muted)] group-hover/item:text-[var(--color-primary)]"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "block text-[14px] font-semibold transition-colors",
                              active
                                ? "text-[var(--color-primary)]"
                                : "text-[var(--color-heading)] group-hover/item:text-[var(--color-primary)]"
                            )}
                          >
                            {label(link.labelEn, link.labelAr)}
                          </span>
                        </div>
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
