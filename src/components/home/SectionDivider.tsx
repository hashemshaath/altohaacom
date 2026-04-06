import { cn } from "@/lib/utils";

/**
 * SVG wave/curve divider between homepage sections.
 * Renders a soft transition shape between two background colors.
 */
type DividerVariant = "wave" | "curve" | "angle" | "swoop";

interface SectionDividerProps {
  variant?: DividerVariant;
  /** Fill color — use CSS variable or hex. Defaults to background */
  fillClass?: string;
  /** Whether to flip vertically */
  flip?: boolean;
  className?: string;
}

const PATHS: Record<DividerVariant, string> = {
  wave: "M0,64 C320,120 640,0 960,64 C1280,128 1600,0 1920,64 L1920,0 L0,0 Z",
  curve: "M0,96 Q960,0 1920,96 L1920,0 L0,0 Z",
  angle: "M0,80 L1920,0 L1920,0 L0,0 Z",
  swoop: "M0,0 L0,64 Q480,96 960,64 T1920,64 L1920,0 Z",
};

export function SectionDivider({
  variant = "curve",
  fillClass = "fill-background",
  flip = false,
  className,
}: SectionDividerProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden leading-[0] -mt-px",
        flip && "rotate-180",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className={cn("block w-full h-8 sm:h-12 md:h-16", fillClass)}
        viewBox="0 0 1920 128"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={PATHS[variant]} />
      </svg>
    </div>
  );
}
