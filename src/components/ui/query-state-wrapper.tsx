import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StaleDataBanner } from "@/components/ui/stale-data-banner";
import { LastUpdated } from "@/components/ui/LastUpdated";
import { DataErrorFallback } from "@/components/DataErrorFallback";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface QueryStateWrapperProps<T> {
  /** TanStack Query isLoading */
  isLoading: boolean;
  /** TanStack Query isError */
  isError: boolean;
  /** TanStack Query isFetching */
  isFetching?: boolean;
  /** Query data */
  data: T | undefined;
  /** Refetch function for retry */
  refetch?: () => void;
  /** Children receive the guaranteed data */
  children: (data: T) => React.ReactNode;

  /* ─── Skeleton config ─── */
  /** Skeleton variant to show during initial load */
  skeletonVariant?: "list" | "grid" | "detail" | "form" | "dashboard";
  skeletonCount?: number;
  /** Custom skeleton element (overrides variant) */
  skeleton?: React.ReactNode;

  /* ─── Empty state config ─── */
  /** Function to determine if data is "empty" */
  isEmpty?: (data: T) => boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  /* ─── Error config ─── */
  errorVariant?: "network" | "auth" | "unknown";

  /* ─── Stale / freshness indicator ─── */
  isAr?: boolean;
  /** dataUpdatedAt from TanStack Query — shows "last updated X ago" */
  dataUpdatedAt?: number;
}

/**
 * Wraps a TanStack Query result with standardized loading, error, empty, and stale states.
 *
 * ```tsx
 * <QueryStateWrapper
 *   isLoading={isLoading} isError={isError} isFetching={isFetching}
 *   data={competitions} refetch={refetch}
 *   skeletonVariant="grid" skeletonCount={6}
 *   isEmpty={(d) => d.length === 0}
 *   emptyTitle="No competitions found"
 *   emptyIcon={Trophy}
 * >
 *   {(data) => <CompetitionGrid items={data} />}
 * </QueryStateWrapper>
 * ```
 */
export function QueryStateWrapper<T>({
  isLoading,
  isError,
  isFetching = false,
  data,
  refetch,
  children,
  skeletonVariant = "list",
  skeletonCount = 6,
  skeleton,
  isEmpty,
  emptyIcon = Inbox,
  emptyTitle = "No data found",
  emptyDescription,
  emptyAction,
  errorVariant = "unknown",
  isAr = false,
  dataUpdatedAt,
}: QueryStateWrapperProps<T>) {
  // Loading state
  if (isLoading) {
    return <>{skeleton ?? <PageSkeleton variant={skeletonVariant} count={skeletonCount} />}</>;
  }

  // Error state
  if (isError) {
    return <DataErrorFallback variant={errorVariant} onRetry={refetch} />;
  }

  // Data not available
  if (data === undefined || data === null) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // Empty data
  if (isEmpty?.(data)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // Stale data indicator + content
  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <StaleDataBanner isRevalidating={isFetching && !isLoading} isAr={isAr} />
        {dataUpdatedAt ? <LastUpdated updatedAt={dataUpdatedAt} /> : null}
      </div>
      {children(data)}
    </>
  );
}
