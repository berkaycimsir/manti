"use client";

import {
	Clock,
	Eye,
	Loader2,
	MoreHorizontal,
	Pencil,
	Play,
	RowsIcon,
	Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type * as React from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";
import { SqlPreview } from "./sql-preview";

type SavedQuery = RouterOutputs["database"]["listSavedQueries"][number];

interface KanbanQueryCardProps {
	query: SavedQuery;
	onExecute: (e: React.MouseEvent) => void;
	onEdit: () => void;
	onDelete: (e: React.MouseEvent) => void;
	isExecuting: boolean;
	isDeleting: boolean;
	dragHandleProps?: any;
	isOverlay?: boolean;
}

export function KanbanQueryCard({
	query,
	onExecute,
	onEdit,
	onDelete,
	isExecuting,
	dragHandleProps,
	isOverlay,
}: KanbanQueryCardProps) {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;

	const handleCardClick = (e: React.MouseEvent) => {
		// Don't navigate if clicking on buttons/dropdown
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest('[role="menuitem"]')) {
			return;
		}
		router.push(`/home/${dbname}/query/show?id=${query.id}`);
	};

	return (
		<Card
			className={cn(
				"group relative flex flex-col gap-2 p-3 transition-all",
				isOverlay
					? "cursor-grabbing shadow-xl ring-2 ring-primary"
					: "cursor-pointer bg-card hover:border-primary/50 hover:shadow-md",
				"touch-none", // Important for dnd-kit pointer sensors
			)}
			onClick={handleCardClick}
			{...dragHandleProps}
		>
			{/* Header: Name and Menu */}
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<h4 className="truncate font-medium text-sm" title={query.name}>
						{query.name}
					</h4>
				</div>
				<div className="flex shrink-0">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="-mr-1 h-6 w-6 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
								onClick={(e) => {
									e.stopPropagation();
								}}
								onPointerDown={(e) => e.stopPropagation()}
								onMouseDown={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									router.push(`/home/${dbname}/query/show?id=${query.id}`);
								}}
							>
								<Eye className="mr-2 h-4 w-4" /> View Details
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onEdit();
								}}
							>
								<Pencil className="mr-2 h-4 w-4" /> Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									onDelete(e as any);
								}}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" /> Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Query Snippet */}
			<div className="rounded border border-border/50 bg-muted/40 p-2">
				<SqlPreview sql={query.query} maxLines={10} variant="compact" />
			</div>

			{/* Footer: Stats & Execute */}
			<div className="mt-1 flex items-center justify-between">
				<div className="flex items-center gap-3 text-muted-foreground text-xs">
					{query.rowCount !== null && (
						<div
							className="flex items-center gap-1"
							title={`${query.rowCount} rows`}
						>
							<RowsIcon className="h-3 w-3" />
							<span>{query.rowCount}</span>
						</div>
					)}
					{query.executionTimeMs !== null && (
						<div
							className="flex items-center gap-1"
							title={`${query.executionTimeMs} ms`}
						>
							<Clock className="h-3 w-3" />
							<span>{query.executionTimeMs}ms</span>
						</div>
					)}
				</div>

				<Button
					size="icon"
					variant="ghost"
					className="h-7 w-7 transition-colors hover:bg-primary/10 hover:text-primary"
					onClick={(e) => {
						e.stopPropagation();
						onExecute(e);
					}}
					onPointerDown={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
					disabled={isExecuting}
					title="Run Query"
				>
					{isExecuting ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Play className="h-3.5 w-3.5" />
					)}
				</Button>
			</div>
		</Card>
	);
}
