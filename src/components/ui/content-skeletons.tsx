"use client";

import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * Skeleton for the Kanban board - mimics columns and query cards.
 */
export function KanbanSkeleton({ columns = 3 }: { columns?: number }) {
	return (
		<div className="space-y-4">
			{/* Search bar skeleton */}
			<div className="flex items-center gap-3">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-20" />
			</div>

			{/* Columns */}
			<div className="flex gap-4 overflow-x-auto pb-4">
				{Array.from({ length: columns }).map((_, colIdx) => (
					<div
						key={colIdx}
						className="flex min-w-[320px] max-w-[320px] flex-col rounded-lg border border-border bg-muted/20"
					>
						{/* Column header */}
						<div className="flex items-center gap-2 border-border border-b bg-muted/40 p-4">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-5 w-6 rounded-full" />
						</div>

						{/* Cards */}
						<div className="flex flex-col gap-3 p-3">
							{Array.from({ length: colIdx === 0 ? 3 : 2 }).map(
								(_, cardIdx) => (
									<QueryCardSkeleton key={cardIdx} />
								)
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for a single query card in the kanban board.
 */
export function QueryCardSkeleton() {
	return (
		<Card className="flex flex-col gap-2 p-3">
			{/* Title and menu */}
			<div className="flex items-start justify-between gap-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-6 w-6 rounded" />
			</div>

			{/* SQL preview box */}
			<div className="rounded border border-border/50 bg-muted/40 p-2">
				<Skeleton className="mb-1 h-3 w-full" />
				<Skeleton className="mb-1 h-3 w-4/5" />
				<Skeleton className="h-3 w-3/5" />
			</div>

			{/* Footer stats */}
			<div className="mt-1 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-3 w-10" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-7 w-7 rounded" />
			</div>
		</Card>
	);
}

/**
 * Skeleton for the connections grid on the home page.
 */
export function ConnectionGridSkeleton({ cards = 6 }: { cards?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: cards }).map((_, i) => (
				<ConnectionCardSkeleton key={i} />
			))}
		</div>
	);
}

/**
 * Skeleton for a single connection card.
 */
export function ConnectionCardSkeleton() {
	return (
		<Card className="flex h-full flex-col p-6">
			{/* Header with icon and title */}
			<div className="mb-4 flex items-start justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-9 rounded-lg" />
					<div>
						<Skeleton className="mb-1 h-5 w-32" />
						<Skeleton className="h-4 w-20" />
					</div>
				</div>
				<Skeleton className="h-6 w-6 rounded" />
			</div>

			{/* Stats */}
			<div className="mb-4 flex-1 space-y-2">
				<div className="flex justify-between">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-4 w-24" />
				</div>
				<div className="flex justify-between">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
				</div>
				<div className="flex justify-between">
					<Skeleton className="h-4 w-14" />
					<Skeleton className="h-4 w-16" />
				</div>
			</div>

			{/* Status badge */}
			<Skeleton className="h-8 w-full rounded-md" />

			{/* Footer */}
			<div className="mt-4 flex items-center justify-between border-border border-t pt-4">
				<div className="flex gap-2">
					<Skeleton className="h-8 w-8 rounded" />
					<Skeleton className="h-8 w-8 rounded" />
				</div>
			</div>
		</Card>
	);
}

/**
 * Skeleton for table data page.
 */
export function TableDataSkeleton({
	rows = 8,
	columns = 5,
}: {
	rows?: number;
	columns?: number;
}) {
	return (
		<Card className="p-4">
			{/* Table header */}
			<div className="mb-3 flex gap-4 border-border border-b pb-3">
				{Array.from({ length: columns }).map((_, i) => (
					<Skeleton key={`header-${i}`} className="h-5 flex-1" />
				))}
			</div>

			{/* Table rows */}
			<div className="space-y-3">
				{Array.from({ length: rows }).map((_, rowIdx) => (
					<div key={`row-${rowIdx}`} className="flex gap-4">
						{Array.from({ length: columns }).map((_, colIdx) => (
							<Skeleton
								key={`cell-${rowIdx}-${colIdx}`}
								className="h-4 flex-1"
							/>
						))}
					</div>
				))}
			</div>
		</Card>
	);
}

/**
 * Skeleton for tables list page.
 */
export function TablesListSkeleton({ tables = 6 }: { tables?: number }) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: tables }).map((_, i) => (
				<Card key={i} className="p-6">
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-5 w-5" />
							<div>
								<Skeleton className="mb-1 h-5 w-32" />
								<Skeleton className="h-4 w-20" />
							</div>
						</div>
						<Skeleton className="h-8 w-16" />
					</div>
				</Card>
			))}
		</div>
	);
}

/**
 * Skeleton for columns loading inside a table card.
 */
export function ColumnsSkeleton({ columns = 4 }: { columns?: number }) {
	return (
		<div className="mt-3 space-y-2 border-border border-t pt-3">
			{Array.from({ length: columns }).map((_, i) => (
				<div key={i} className="flex justify-between px-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</div>
			))}
		</div>
	);
}
