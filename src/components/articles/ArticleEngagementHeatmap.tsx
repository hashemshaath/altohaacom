import { useState, useEffect, useRef, memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, BarChart3, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionData {
  id: string;
  title: string;
  timeSpent: number; // seconds
  scrollDepth: number; // 0-100
}

interface Props {
  content: string;
  isAr: boolean;
}

const STORAGE_KEY = "article-heatmap";

function getSectionHeadings(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) headings.push(match[1].trim());
  }
  return headings.length > 0 ? headings : ["Introduction", "Main Content", "Conclusion"];
}

function getHeatColor(intensity: number): string {
  if (intensity >= 0.8) return "bg-red-500/80";
  if (intensity >= 0.6) return "bg-orange-500/70";
  if (intensity >= 0.4) return "bg-amber-500/60";
  if (intensity >= 0.2) return "bg-yellow-500/50";
  return "bg-emerald-500/30";
}

function getHeatLabel(intensity: number, isAr: boolean): string {
  if (intensity >= 0.8) return isAr ? "🔥 الأكثر قراءة" : "🔥 Most Read";
  if (intensity >= 0.6) return isAr ? "شائع" : "Popular";
  if (intensity >= 0.4) return isAr ? "متوسط" : "Moderate";
  return isAr ? "سريع" : "Quick Scan";
}

export const ArticleEngagementHeatmap = memo(function ArticleEngagementHeatmap({ content, isAr }: Props) {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const timersRef = useRef<Record<string, number>>({});
  const activeSection = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const headings = getSectionHeadings(content);

  // Initialize sections
  useEffect(() => {
    const initial = headings.map((h, i) => ({
      id: `section-${i}`,
      title: h,
      timeSpent: 0,
      scrollDepth: 0,
    }));
    setSections(initial);

    // Track which section is visible
    const handleScroll = () => {
      if (!isTracking) return;
      const scrollPct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      const sectionIdx = Math.min(Math.floor((scrollPct / 100) * headings.length), headings.length - 1);
      const sectionId = `section-${sectionIdx}`;
      
      if (activeSection.current !== sectionId) {
        activeSection.current = sectionId;
      }
      
      // Update scroll depth
      setSections(prev => prev.map((s, i) => ({
        ...s,
        scrollDepth: i <= sectionIdx ? 100 : s.scrollDepth,
      })));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Increment time for active section
    intervalRef.current = setInterval(() => {
      if (activeSection.current && isTracking) {
        const id = activeSection.current;
        timersRef.current[id] = (timersRef.current[id] || 0) + 1;
        setSections(prev => prev.map(s => 
          s.id === id ? { ...s, timeSpent: timersRef.current[id] } : s
        ));
      }
    }, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, isTracking]);

  const maxTime = Math.max(...sections.map(s => s.timeSpent), 1);
  const totalTime = sections.reduce((sum, s) => sum + s.timeSpent, 0);

  if (sections.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-orange-500" />
            {isAr ? "خريطة التفاعل" : "Engagement Map"}
          </p>
          <Badge variant="outline" className="text-[12px] rounded-lg px-2 py-0 h-5 border-border/40">
            <Clock className="h-2.5 w-2.5 me-1" />
            {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, "0")}
          </Badge>
        </div>

        {/* Heatmap bars */}
        <div className="space-y-2">
          {sections.map((section) => {
            const intensity = section.timeSpent / maxTime;
            return (
              <div key={section.id} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-medium text-muted-foreground truncate flex-1">
                    {section.title}
                  </span>
                  <span className="text-[12px] text-muted-foreground/60 tabular-nums shrink-0">
                    {section.timeSpent}s
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-y-0 start-0 rounded-full transition-all duration-700 ease-out",
                      getHeatColor(intensity)
                    )}
                    style={{ width: `${Math.max(intensity * 100, 4)}%` }}
                  />
                </div>
                {intensity >= 0.5 && (
                  <span className="text-[12px] text-muted-foreground/50 mt-0.5 block">
                    {getHeatLabel(intensity, isAr)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/20">
          <span className="text-[12px] text-muted-foreground/50">{isAr ? "أقل" : "Less"}</span>
          {["bg-emerald-500/30", "bg-yellow-500/50", "bg-amber-500/60", "bg-orange-500/70", "bg-red-500/80"].map((c, i) => (
            <div key={i} className={cn("h-2 w-4 rounded-sm", c)} />
          ))}
          <span className="text-[12px] text-muted-foreground/50">{isAr ? "أكثر" : "More"}</span>
        </div>
      </CardContent>
    </Card>
  );
});
