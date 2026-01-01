"use client";

import { Download, FileJson, FileSpreadsheet, Search, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Flex } from "~/components/ui/flex";
import { Input } from "~/components/ui/input";
import { Muted } from "~/components/ui/muted";

interface TableToolbarProps {
	totalRows: number;
	totalColumns: number;
	selectedCount: number;
	globalSearch: string;
	onSearchChange: (value: string) => void;
	onExportCSV: () => void;
	onExportJSON: () => void;
}

/**
 * Table toolbar with search, row/column info, and export functionality.
 */
export function TableToolbar({
	totalRows,
	totalColumns,
	selectedCount,
	globalSearch,
	onSearchChange,
	onExportCSV,
	onExportJSON,
}: TableToolbarProps) {
	return (
		<Flex justify="between" className="flex-wrap gap-4">
			{/* Left: Row/Column Info */}
			<div>
				<Muted size="sm">
					{totalRows} rows • {totalColumns} columns
					{selectedCount > 0 && (
						<span className="ml-2 text-primary">
							• {selectedCount} selected
						</span>
					)}
				</Muted>
			</div>

			{/* Right: Search and Export */}
			<Flex gap={2}>
				{/* Global Search */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search all columns..."
						value={globalSearch}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-9 w-64 bg-transparent pl-9"
					/>
					{globalSearch && (
						<Button
							variant="ghost"
							size="sm"
							className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6 p-0"
							onClick={() => onSearchChange("")}
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>

				{/* Export */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="gap-2 bg-transparent"
						>
							<Download className="h-4 w-4" />
							Export
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onExportCSV}>
							<FileSpreadsheet className="mr-2 h-4 w-4" />
							Export as CSV
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onExportJSON}>
							<FileJson className="mr-2 h-4 w-4" />
							Export as JSON
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</Flex>
		</Flex>
	);
}
