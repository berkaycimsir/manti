"use client";

import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * Skeleton for query show page - mimics query details layout.
 */
export function QueryDetailSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-6">
			{/* SQL Query Card Skeleton */}
			<Card className="border-muted bg-muted/50 p-4">
				<div className="mb-2 flex items-center gap-2">
					<Skeleton className="h-3 w-3" />
					<Skeleton className="h-3 w-16" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-4/5" />
					<Skeleton className="h-4 w-3/5" />
				</div>
			</Card>

			{/* Stats bar skeleton */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-6 w-24" />
				<Skeleton className="h-6 w-20" />
			</div>

			{/* Table skeleton */}
			<Card className="flex-1 p-4">
				<div className="space-y-3">
					{/* Header row */}
					<div className="flex gap-4 border-border border-b pb-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={`header-${i}`} className="h-5 flex-1" />
						))}
					</div>
					{/* Data rows */}
					{Array.from({ length: 5 }).map((_, rowIdx) => (
						<div key={`row-${rowIdx}`} className="flex gap-4">
							{Array.from({ length: 4 }).map((_, colIdx) => (
								<Skeleton
									key={`cell-${rowIdx}-${colIdx}`}
									className="h-4 flex-1"
								/>
							))}
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
