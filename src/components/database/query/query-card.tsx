"use client";

import {
	ChevronDown,
	ChevronRight,
	Clock,
	Eye,
	Loader2,
	Pencil,
	Play,
	RowsIcon,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type * as React from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

type SavedQuery = RouterOutputs["database"]["listSavedQueries"][number];

interface QueryCardProps {
	query: SavedQuery;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onExecute: (e: React.MouseEvent) => void;
	onEdit: () => void;
	onDelete: (e: React.MouseEvent) => void;
	isExecuting: boolean;
	isDeleting: boolean;
	dragHandleProps?: React.HTMLAttributes<HTMLElement>;
	className?: string;
}

export function QueryCard({
	query,
	isExpanded,
	onToggleExpand,
	onExecute,
	onEdit,
	onDelete,
	isExecuting,
	isDeleting,
	dragHandleProps,
	className,
}: QueryCardProps) {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;
	const results = query.lastResult as Array<Record<string, unknown>> | null;

	const formatDate = (date: Date | null) => {
		if (!date) return "Never";
		return new Date(date).toLocaleString();
	};

	const formatValue = (value: unknown): string => {
		if (value === null || value === undefined) return "∅";
		if (typeof value === "object") return JSON.stringify(value);
		return String(value);
	};

	return (
		<Card className={cn("overflow-hidden", className)}>
			{/* Query header - clickable to expand/collapse */}
			<button
				type="button"
				onClick={onToggleExpand}
				className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-muted/50"
			>
				<div className="flex items-center gap-3 overflow-hidden">
					{/* Drag Handle or Expand Icon */}
					<div className="flex items-center" {...(dragHandleProps || {})}>
						{isExpanded ? (
							<ChevronDown className="h-5 w-5 text-muted-foreground" />
						) : (
							<ChevronRight className="h-5 w-5 text-muted-foreground" />
						)}
					</div>

					<div className="min-w-0 flex-1">
						<h4 className="truncate font-medium text-foreground">
							{query.name}
						</h4>
						<p className="line-clamp-1 font-mono text-muted-foreground text-xs">
							{query.query}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{/* Stats */}
					<div className="hidden items-center gap-4 text-muted-foreground text-sm sm:flex">
						{query.rowCount !== null && (
							<span className="flex items-center gap-1">
								<RowsIcon className="h-3.5 w-3.5" />
								{query.rowCount}
							</span>
						)}
						{query.executionTimeMs !== null && (
							<span className="flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" />
								{query.executionTimeMs}ms
							</span>
						)}
					</div>

					{/* Actions */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/home/${dbname}/query/show?id=${query.id}`);
							}}
							title="View details"
						>
							<Eye className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={(e) => {
								e.stopPropagation();
								onExecute(e);
							}}
							disabled={isExecuting}
							title="Run query"
						>
							{isExecuting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Play className="h-4 w-4" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
							title="Edit query"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:text-destructive"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(e);
							}}
							disabled={isDeleting}
							title="Delete query"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</button>
			isExpanded && (
			<div className="border-border border-t bg-muted/30">
				{/* Query text */}
				<div className="border-border border-b p-4">
					<p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
						Query
					</p>
					<pre className="overflow-x-auto rounded bg-muted p-3 font-mono text-foreground text-sm">
						{query.query}
					</pre>
				</div>

				{/* Execution info */}
				{query.lastExecutedAt && (
					<div className="flex items-center gap-6 border-border border-b px-4 py-2 text-muted-foreground text-sm">
						<span>Last run: {formatDate(query.lastExecutedAt)}</span>
						{query.rowCount !== null && <span>{query.rowCount} rows</span>}
						{query.executionTimeMs !== null && (
							<span>{query.executionTimeMs}ms</span>
						)}
					</div>
				)}

				{/* Results table */}
				{results && results.length > 0 ? (
					<div className="max-h-80 overflow-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-muted">
								<tr className="border-border border-b">
									{Object.keys(results[0] || {}).map((col) => (
										<th
											key={col}
											className="px-4 py-2 text-left font-semibold text-foreground"
										>
											{col}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{results.slice(0, 20).map((row, rowIndex) => (
									<tr
										key={`row-${query.id}-${rowIndex}`}
										className="border-border border-b hover:bg-muted/30"
									>
										{Object.entries(row).map(([colKey, value]) => (
											<td
												key={`cell-${query.id}-${rowIndex}-${colKey}`}
												className="max-w-xs truncate px-4 py-2 font-mono text-foreground"
											>
												{formatValue(value)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
						{results.length > 20 && (
							<div className="bg-muted/50 px-4 py-2 text-center text-muted-foreground text-sm">
								Showing first 20 of {results.length} rows.{" "}
								<button
									type="button"
									onClick={() => onEdit()}
									className="text-primary underline"
								>
									Open in editor
								</button>{" "}
								to see all results.
							</div>
						)}
					</div>
				) : query.lastExecutedAt ? (
					<div className="p-6 text-center text-muted-foreground">
						No rows returned
					</div>
				) : (
					<div className="p-6 text-center text-muted-foreground">
						Query has not been executed yet.{" "}
						<button
							type="button"
							onClick={(e) => onExecute(e)}
							className="text-primary underline"
						>
							Run now
						</button>
					</div>
				)}
			</div>
			);
		</Card>
	);
}
