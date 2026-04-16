/**
 * SearchBarLazy — code-split wrapper around SearchBar.
 * Renders a static input shell as Suspense fallback so there's no layout shift
 * while the JS bundle loads.
 */
import { lazy, Suspense } from "react";
import { Search } from "lucide-react";
import type { SearchBarProps } from "./SearchBar";

const SearchBar = lazy(() =>
  import("./SearchBar").then((m) => ({ default: m.SearchBar }))
);

function SearchBarSkeleton() {
  return (
    <div className="relative w-full max-w-[680px] mx-auto" aria-hidden="true">
      <div className="flex items-center gap-2 px-4 h-12 sm:h-14 w-full bg-background border-[1.5px] border-border/60 rounded-2xl">
        <Search className="h-5 w-5 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 h-4 rounded bg-muted/40" />
        <div className="h-10 w-10 sm:w-20 rounded-xl bg-primary/30" />
      </div>
    </div>
  );
}

export function SearchBarLazy(props: SearchBarProps) {
  return (
    <Suspense fallback={<SearchBarSkeleton />}>
      <SearchBar {...props} />
    </Suspense>
  );
}
