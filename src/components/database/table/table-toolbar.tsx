"use client";

import {
	AlignJustify,
	Download,
	Eye,
	EyeOff,
	FileJson,
	FileSpreadsheet,
	Filter,
	Grid3x3,
	Maximize2,
	Minimize2,
	Rows,
	Search,
	Settings2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { DensityMode, ViewMode } from "~/stores/table-view-store";
import type { Column } from "~/types/table";

interface TableToolbarProps {
	columns: Column[];
	visibleColumns: Set<string>;
	hiddenColumns: string[];
	sortedRowsCount: number;
	totalRowsCount: number;
	selectedRowsCount: number;
	activeFiltersCount: number;
	globalSearch: string;
	densityMode: DensityMode;
	viewMode: ViewMode;
	showRowNumbers: boolean;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
	setGlobalSearch: (value: string) => void;
	setDensityMode: (mode: DensityMode) => void;
	setViewMode: (mode: ViewMode) => void;
	setShowRowNumbers: (value: boolean) => void;
	setZebraStriping: (value: boolean) => void;
	setWordWrap: (value: boolean) => void;
	setShowNullDistinct: (value: boolean) => void;
	setFullWidth: (value: boolean) => void;
	toggleColumnVisibility: (columnName: string) => void;
	setHiddenColumns: (columns: string[]) => void;
	copySelectedRows: () => void;
	exportCSV: () => void;
	exportJSON: () => void;
}

export function TableToolbar({
	columns,
	visibleColumns,
	hiddenColumns,
	sortedRowsCount,
	totalRowsCount,
	selectedRowsCount,
	activeFiltersCount,
	globalSearch,
	densityMode,
	viewMode,
	showRowNumbers,
	zebraStriping,
	wordWrap,
	showNullDistinct,
	fullWidth,
	setGlobalSearch,
	setDensityMode,
	setViewMode,
	setShowRowNumbers,
	setZebraStriping,
	setWordWrap,
	setShowNullDistinct,
	setFullWidth,
	toggleColumnVisibility,
	setHiddenColumns,
	copySelectedRows,
	exportCSV,
	exportJSON,
}: TableToolbarProps) {
	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex flex-1 items-center gap-2">
				{/* Global Search */}
				<div className="relative max-w-md flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search all columns..."
						value={globalSearch}
						onChange={(e) => setGlobalSearch(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Active filters indicator */}
				{activeFiltersCount > 0 && (
					<div className="flex items-center gap-1 text-muted-foreground text-sm">
						<Filter className="h-4 w-4" />
						<span>
							{activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
							active
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center gap-2">
				{/* Row count indicator */}
				<span className="mr-2 text-muted-foreground text-sm">
					{sortedRowsCount === totalRowsCount
						? `${totalRowsCount} rows`
						: `${sortedRowsCount} of ${totalRowsCount} rows`}
					{selectedRowsCount > 0 && ` (${selectedRowsCount} selected)`}
				</span>

				{/* View Mode Toggle */}
				<div className="flex rounded-md border">
					<Button
						variant={viewMode === "grid" ? "default" : "ghost"}
						size="sm"
						className="rounded-r-none"
						onClick={() => setViewMode("grid")}
					>
						<Grid3x3 className="mr-1 h-4 w-4" />
						Grid
					</Button>
					<Button
						variant={viewMode === "transpose" ? "default" : "ghost"}
						size="sm"
						className="rounded-l-none"
						onClick={() => setViewMode("transpose")}
					>
						<Rows className="mr-1 h-4 w-4" />
						Transpose
					</Button>
				</div>

				{/* Density */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<AlignJustify className="mr-2 h-4 w-4" />
							Density
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setDensityMode("compact")}>
							<Minimize2 className="mr-2 h-4 w-4" />
							Compact
							{densityMode === "compact" && " ✓"}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setDensityMode("default")}>
							<Grid3x3 className="mr-2 h-4 w-4" />
							Default
							{densityMode === "default" && " ✓"}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setDensityMode("comfortable")}>
							<Maximize2 className="mr-2 h-4 w-4" />
							Comfortable
							{densityMode === "comfortable" && " ✓"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Column Visibility */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<Eye className="mr-2 h-4 w-4" />
							Columns
							{hiddenColumns.length > 0 && (
								<span className="ml-1 text-muted-foreground">
									({columns.length - hiddenColumns.length}/{columns.length})
								</span>
							)}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="max-h-80 w-56 overflow-auto"
					>
						<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => setHiddenColumns([])}>
							<Eye className="mr-2 h-4 w-4" />
							Show All
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setHiddenColumns(columns.map((c) => c.name))}
						>
							<EyeOff className="mr-2 h-4 w-4" />
							Hide All
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						{columns.map((col) => (
							<DropdownMenuCheckboxItem
								key={col.name}
								checked={visibleColumns.has(col.name)}
								onCheckedChange={() => toggleColumnVisibility(col.name)}
							>
								<div className="flex flex-col">
									<span className="truncate">{col.name}</span>
									<span className="text-muted-foreground text-xs">
										{col.type}
									</span>
								</div>
							</DropdownMenuCheckboxItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Options */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<Settings2 className="mr-2 h-4 w-4" />
							Options
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>Display Options</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuCheckboxItem
							checked={showRowNumbers}
							onCheckedChange={setShowRowNumbers}
						>
							Show Row Numbers
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={zebraStriping}
							onCheckedChange={setZebraStriping}
						>
							Zebra Striping
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={wordWrap}
							onCheckedChange={setWordWrap}
						>
							Word Wrap
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={showNullDistinct}
							onCheckedChange={setShowNullDistinct}
						>
							Show NULL Distinctly
						</DropdownMenuCheckboxItem>
						<DropdownMenuCheckboxItem
							checked={fullWidth}
							onCheckedChange={setFullWidth}
						>
							Full Width
						</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Export */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<Download className="mr-2 h-4 w-4" />
							Export
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={exportCSV}>
							<FileSpreadsheet className="mr-2 h-4 w-4" />
							Export CSV
						</DropdownMenuItem>
						<DropdownMenuItem onClick={exportJSON}>
							<FileJson className="mr-2 h-4 w-4" />
							Export JSON
						</DropdownMenuItem>
						{selectedRowsCount > 0 && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={copySelectedRows}>
									Copy {selectedRowsCount} Selected Rows
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
