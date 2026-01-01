"use client";

import { Loader2 } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

/**
 * Full-page loading skeleton with centered spinner and message.
 */
export function PageLoadingSkeleton({
	message = "Loading...",
	className,
}: {
	message?: string;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"flex flex-col items-center justify-center p-12 text-center",
				className,
			)}
		>
			<div className="mb-4">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
			<p className="text-muted-foreground">{message}</p>
		</Card>
	);
}

/**
 * Skeleton for card content with configurable lines.
 */
export function CardSkeleton({
	lines = 3,
	className,
}: {
	lines?: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton
					key={i}
					className={cn("h-4", i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-2/3")}
				/>
			))}
		</div>
	);
}

/**
 * Skeleton for connection card content.
 */
export function ConnectionCardSkeleton() {
	return (
		<div className="mb-4 space-y-2">
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-4 w-28" />
		</div>
	);
}

/**
 * Skeleton for table data.
 */
export function TableSkeleton({
	rows = 5,
	columns = 4,
	className,
}: {
	rows?: number;
	columns?: number;
	className?: string;
}) {
	return (
		<div className={cn("space-y-3", className)}>
			{/* Header row */}
			<div className="flex gap-4">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={`header-${i}`} className="h-6 flex-1" />
				))}
			</div>
			{/* Data rows */}
			{Array.from({ length: rows }).map((_, rowIdx) => (
				<div key={`row-${rowIdx}`} className="flex gap-4">
					{Array.from({ length: columns }).map((_, colIdx) => (
						<Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-5 flex-1" />
					))}
				</div>
			))}
		</div>
	);
}

/**
 * Inline spinner for buttons and small loading indicators.
 */
export function SpinnerIcon({ className }: { className?: string }) {
	return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}
