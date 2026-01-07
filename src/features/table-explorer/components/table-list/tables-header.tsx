"use client";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import { cn } from "@shared/lib/utils";
import { ArrowDownAZ, ArrowUpAZ, LayoutGrid, List, Search } from "lucide-react";
import {
	type TablesSortBy,
	useTableListStore,
} from "../../stores/table-list-store";

interface TablesHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	schemas: string[];
	selectedSchema: string;
	onSchemaChange: (schema: string) => void;
	tableCount: number;
}

export function TablesHeader({
	searchQuery,
	onSearchChange,
	schemas,
	selectedSchema,
	onSchemaChange,
	tableCount,
}: TablesHeaderProps) {
	const {
		viewMode,
		setViewMode,
		sortBy,
		sortOrder,
		setSortBy,
		toggleSortOrder,
		groupBySchema,
		setGroupBySchema,
	} = useTableListStore();

	return (
		<div className="space-y-4">
			{/* Top row: Search and View Controls */}
			<div className="flex items-center gap-4">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search tables..."
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Schema Filter */}
				<Select value={selectedSchema} onValueChange={onSchemaChange}>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder="All Schemas" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Schemas</SelectItem>
						{schemas.map(schema => (
							<SelectItem key={schema} value={schema}>
								{schema}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Sort */}
				<div className="flex items-center gap-1">
					<Select
						value={sortBy}
						onValueChange={v => setSortBy(v as TablesSortBy)}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="name">Name</SelectItem>
							<SelectItem value="columns">Columns</SelectItem>
							<SelectItem value="schema">Schema</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleSortOrder}
						title={sortOrder === "asc" ? "Ascending" : "Descending"}
					>
						{sortOrder === "asc" ? (
							<ArrowDownAZ className="h-4 w-4" />
						) : (
							<ArrowUpAZ className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* View Toggle */}
				<div className="flex items-center rounded-lg border border-border p-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setViewMode("grid")}
						className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-muted")}
						title="Grid View"
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setViewMode("list")}
						className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-muted")}
						title="List View"
					>
						<List className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Bottom row: Group toggle and count */}
			<div className="flex items-center justify-between text-sm">
				<label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
					<input
						type="checkbox"
						checked={groupBySchema}
						onChange={e => setGroupBySchema(e.target.checked)}
						className="h-4 w-4 rounded border-border"
					/>
					Group by Schema
				</label>
				<span className="text-muted-foreground">
					{tableCount} {tableCount === 1 ? "table" : "tables"}
				</span>
			</div>
		</div>
	);
}
