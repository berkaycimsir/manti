"use client";

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	type DropAnimation,
	PointerSensor,
	closestCorners,
	defaultDropAnimationSideEffects,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, GripVertical, Pencil, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { KanbanQueryCard } from "./kanban-query-card";

// --- Types ---
type SortOption = "name" | "createdAt" | "lastRunAt" | "rowCount";

interface Tab {
	id: number;
	name: string;
	position?: number | null;
}

interface KanbanBoardProps {
	tabs: Tab[];
	queries: any[];
	onMoveQuery: (queryId: number, tabId: number | null) => void;
	onReorderTabs: (reorderedTabs: Tab[]) => void;
	onExecute: (id: number) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onEditTab?: (tab: { id: number; name: string }) => void;
	isExecutingId?: number;
	isDeletingId?: number;
}

// --- Main Component ---
export function KanbanBoard({
	tabs,
	queries,
	onMoveQuery,
	onReorderTabs,
	onExecute,
	onEdit,
	onDelete,
	onEditTab,
	isExecutingId,
	isDeletingId,
}: KanbanBoardProps) {
	const [activeId, setActiveId] = useState<string | number | null>(null);
	const [activeType, setActiveType] = useState<"query" | "column" | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("name");
	const [sortAsc, setSortAsc] = useState(true);

	// Local state for optimistic column reordering
	const [localTabs, setLocalTabs] = useState<Tab[]>([]);

	// Sync local tabs with props
	useEffect(() => {
		const sorted = [...tabs].sort(
			(a, b) => (a.position ?? 0) - (b.position ?? 0),
		);
		setLocalTabs(sorted);
	}, [tabs]);

	// Filter queries based on search
	const filteredQueries = useMemo(() => {
		if (!searchQuery.trim()) return queries;
		const lowerSearch = searchQuery.toLowerCase();
		return queries.filter(
			(q) =>
				q.name.toLowerCase().includes(lowerSearch) ||
				q.query.toLowerCase().includes(lowerSearch),
		);
	}, [queries, searchQuery]);

	// Sort queries
	const sortedQueries = useMemo(() => {
		const sorted = [...filteredQueries].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "createdAt":
					comparison =
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case "lastRunAt": {
					const aTime = a.lastRunAt ? new Date(a.lastRunAt).getTime() : 0;
					const bTime = b.lastRunAt ? new Date(b.lastRunAt).getTime() : 0;
					comparison = aTime - bTime;
					break;
				}
				case "rowCount":
					comparison = (a.rowCount ?? 0) - (b.rowCount ?? 0);
					break;
			}
			return sortAsc ? comparison : -comparison;
		});
		return sorted;
	}, [filteredQueries, sortBy, sortAsc]);

	// Column IDs for dnd-kit (uncategorized is always first and not draggable)
	const columnIds = useMemo(
		() => ["tab-uncategorized", ...localTabs.map((t) => `tab-${t.id}`)],
		[localTabs],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		const activeIdStr = String(active.id);

		if (activeIdStr.startsWith("tab-") && activeIdStr !== "tab-uncategorized") {
			setActiveType("column");
			setActiveId(activeIdStr);
		} else {
			setActiveType("query");
			setActiveId(Number(active.id));
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		const currentActiveType = activeType;
		setActiveId(null);
		setActiveType(null);

		if (!over) return;

		const activeIdStr = String(active.id);
		const overIdStr = String(over.id);

		// Handle column drag
		if (currentActiveType === "column") {
			if (activeIdStr === overIdStr) return;

			// Find indices in localTabs (not including uncategorized)
			const activeTabId = Number(activeIdStr.replace("tab-", ""));
			const overTabId =
				overIdStr === "tab-uncategorized"
					? null
					: Number(overIdStr.replace("tab-", ""));

			const oldIndex = localTabs.findIndex((t) => t.id === activeTabId);

			let newIndex: number;
			if (overTabId === null) {
				// Dropped on uncategorized - move to first position
				newIndex = 0;
			} else {
				newIndex = localTabs.findIndex((t) => t.id === overTabId);
			}

			if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
				console.log("Tab reorder: oldIndex=", oldIndex, "newIndex=", newIndex);
				// Optimistically reorder locally
				const reorderedTabs = arrayMove(localTabs, oldIndex, newIndex);

				// Update local state with new positions
				const tabsWithPositions = reorderedTabs.map((tab, index) => ({
					...tab,
					position: index,
				}));

				console.log("Setting local tabs:", tabsWithPositions);
				setLocalTabs(tabsWithPositions);

				// Notify parent to persist changes
				console.log("Calling onReorderTabs");
				onReorderTabs(tabsWithPositions);
			} else {
				console.log(
					"Tab reorder skipped: oldIndex=",
					oldIndex,
					"newIndex=",
					newIndex,
				);
			}
			return;
		}

		// Handle query drag
		const activeQueryId = Number(active.id);
		let targetTabId: number | null = null;

		if (overIdStr === "tab-uncategorized") {
			targetTabId = null;
		} else if (overIdStr.startsWith("tab-")) {
			targetTabId = Number(overIdStr.replace("tab-", ""));
		} else {
			const overQuery = queries.find((q) => q.id === Number(over.id));
			if (overQuery) {
				targetTabId = overQuery.tabId ?? null;
			} else {
				return;
			}
		}

		const currentQuery = queries.find((q) => q.id === activeQueryId);
		if (currentQuery) {
			const currentTab = currentQuery.tabId ?? null;
			const targetTab = targetTabId ?? null;

			if (currentTab !== targetTab) {
				onMoveQuery(activeQueryId, targetTab);
			}
		}
	};

	const activeQuery =
		activeType === "query" ? queries.find((q) => q.id === activeId) : null;
	const activeTab =
		activeType === "column" && typeof activeId === "string"
			? localTabs.find((t) => `tab-${t.id}` === activeId)
			: null;

	const toggleSort = (option: SortOption) => {
		if (sortBy === option) {
			setSortAsc(!sortAsc);
		} else {
			setSortBy(option);
			setSortAsc(true);
		}
	};

	return (
		<div className="space-y-4">
			{/* Search and Sort Controls */}
			<div className="flex items-center gap-3">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search queries..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="gap-2">
							<ArrowUpDown className="h-4 w-4" />
							Sort
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Sort by</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => toggleSort("name")}>
							Name {sortBy === "name" && (sortAsc ? "↑" : "↓")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => toggleSort("createdAt")}>
							Date Created {sortBy === "createdAt" && (sortAsc ? "↑" : "↓")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => toggleSort("lastRunAt")}>
							Last Run {sortBy === "lastRunAt" && (sortAsc ? "↑" : "↓")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => toggleSort("rowCount")}>
							Row Count {sortBy === "rowCount" && (sortAsc ? "↑" : "↓")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{searchQuery && (
					<Badge variant="secondary" className="text-xs">
						{filteredQueries.length} result{filteredQueries.length !== 1 && "s"}
					</Badge>
				)}
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={columnIds}
					strategy={horizontalListSortingStrategy}
				>
					<div className="flex h-[calc(100vh-280px)] gap-4 overflow-x-auto pb-4">
						{/* Uncategorized Column - Not draggable */}
						<Column
							id="tab-uncategorized"
							title="Uncategorized"
							queries={sortedQueries.filter((q) => !q.tabId)}
							onExecute={onExecute}
							onEdit={onEdit}
							onDelete={onDelete}
							isExecutingId={isExecutingId}
							isDeletingId={isDeletingId}
							isDraggable={false}
						/>

						{/* Tab Columns - Draggable */}
						{localTabs.map((tab) => (
							<SortableColumn
								key={tab.id}
								id={`tab-${tab.id}`}
								title={tab.name}
								tab={tab}
								queries={sortedQueries.filter((q) => q.tabId === tab.id)}
								onExecute={onExecute}
								onEdit={onEdit}
								onDelete={onDelete}
								onEditTab={onEditTab}
								isExecutingId={isExecutingId}
								isDeletingId={isDeletingId}
							/>
						))}
					</div>
				</SortableContext>

				{typeof window !== "undefined" &&
					createPortal(
						<DragOverlay dropAnimation={dropAnimationConfig}>
							{activeQuery ? (
								<QueryCardItem query={activeQuery} isOverlay />
							) : activeTab ? (
								<div className="w-[320px] rounded-lg border-2 border-primary bg-card p-4 shadow-xl">
									<div className="flex items-center gap-2">
										<GripVertical className="h-4 w-4 text-muted-foreground" />
										<h3 className="font-semibold text-sm">{activeTab.name}</h3>
									</div>
								</div>
							) : null}
						</DragOverlay>,
						document.body,
					)}
			</DndContext>
		</div>
	);
}

const dropAnimationConfig: DropAnimation = {
	sideEffects: defaultDropAnimationSideEffects({
		styles: {
			active: {
				opacity: "0.4",
			},
		},
	}),
};

// --- Sortable Column Wrapper ---
interface SortableColumnProps {
	id: string;
	title: string;
	tab: Tab;
	queries: any[];
	onExecute: (id: number) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onEditTab?: (tab: { id: number; name: string }) => void;
	isExecutingId?: number;
	isDeletingId?: number;
}

function SortableColumn({
	id,
	title,
	tab,
	queries,
	onExecute,
	onEdit,
	onDelete,
	onEditTab,
	isExecutingId,
	isDeletingId,
}: SortableColumnProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, data: { type: "Column", tab } });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 50 : "auto",
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(isDragging && "rounded-lg ring-2 ring-primary")}
		>
			<Column
				id={id}
				title={title}
				tab={tab}
				queries={queries}
				onExecute={onExecute}
				onEdit={onEdit}
				onDelete={onDelete}
				onEditTab={onEditTab}
				isExecutingId={isExecutingId}
				isDeletingId={isDeletingId}
				isDraggable
				dragHandleProps={{ ...attributes, ...listeners }}
			/>
		</div>
	);
}

// --- Column Component ---
interface ColumnProps {
	id: string;
	title: string;
	tab?: Tab;
	queries: any[];
	onExecute: (id: number) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onEditTab?: (tab: { id: number; name: string }) => void;
	isExecutingId?: number;
	isDeletingId?: number;
	isDraggable?: boolean;
	dragHandleProps?: any;
}

function Column({
	id,
	title,
	tab,
	queries,
	onExecute,
	onEdit,
	onDelete,
	onEditTab,
	isExecutingId,
	isDeletingId,
	isDraggable,
	dragHandleProps,
}: ColumnProps) {
	const { setNodeRef } = useSortable({
		id,
		data: { type: "Column" },
		disabled: true,
	});

	return (
		<div
			ref={setNodeRef}
			className="flex h-full min-w-[320px] max-w-[320px] flex-col rounded-lg border border-border bg-muted/20"
		>
			<div className="flex items-center justify-between border-border border-b bg-muted/40 p-4">
				<div className="flex items-center gap-2">
					{isDraggable && (
						<button
							className="-ml-1 cursor-grab touch-none rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
							{...dragHandleProps}
						>
							<GripVertical className="h-4 w-4" />
						</button>
					)}
					<h3 className="font-semibold text-sm">{title}</h3>
					<Badge variant="secondary" className="text-xs">
						{queries.length}
					</Badge>
				</div>

				{tab && onEditTab && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => onEditTab(tab)}
					>
						<Pencil className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>

			<ScrollArea className="flex-1 p-3">
				<div className="flex flex-col gap-3">
					<SortableContext
						id={id}
						items={queries.map((q) => q.id)}
						strategy={verticalListSortingStrategy}
					>
						{queries.map((query) => (
							<SortableItem
								key={query.id}
								query={query}
								onExecute={onExecute}
								onEdit={onEdit}
								onDelete={onDelete}
								isExecutingId={isExecutingId}
								isDeletingId={isDeletingId}
							/>
						))}
					</SortableContext>
					{queries.length === 0 && (
						<div className="rounded border border-border border-dashed py-8 text-center text-muted-foreground text-xs">
							Drop queries here
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

// --- Sortable Item Wrapper ---
function SortableItem({
	query,
	onExecute,
	onEdit,
	onDelete,
	isExecutingId,
	isDeletingId,
}: any) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: query.id, data: { type: "Query", query } });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<QueryCardItem
				query={query}
				dragHandleProps={{ ...attributes, ...listeners }}
				onExecute={onExecute}
				onEdit={onEdit}
				onDelete={onDelete}
				isExecutingId={isExecutingId}
				isDeletingId={isDeletingId}
			/>
		</div>
	);
}

// --- Simplified Card for Kanban ---
function QueryCardItem({
	query,
	dragHandleProps,
	isOverlay,
	onExecute,
	onEdit,
	onDelete,
	isExecutingId,
	isDeletingId,
}: any) {
	return (
		<KanbanQueryCard
			query={query}
			isOverlay={isOverlay}
			onExecute={() => onExecute?.(query.id)}
			onEdit={() => onEdit?.(query.id)}
			onDelete={() => onDelete?.(query.id)}
			isExecuting={isExecutingId === query.id}
			isDeleting={isDeletingId === query.id}
			dragHandleProps={dragHandleProps}
		/>
	);
}
