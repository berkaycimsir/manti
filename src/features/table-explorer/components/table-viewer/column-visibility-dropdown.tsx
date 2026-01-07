"use client";

import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import type { Column } from "@shared/types/table";
import { Eye } from "lucide-react";

interface ColumnVisibilityDropdownProps {
	columns: Column[];
	hiddenColumns: string[];
	onToggleColumn: (columnName: string) => void;
	onShowAll: () => void;
	onHideAll: () => void;
}

/**
 * Dropdown to toggle column visibility.
 */
export function ColumnVisibilityDropdown({
	columns,
	hiddenColumns,
	onToggleColumn,
	onShowAll,
	onHideAll,
}: ColumnVisibilityDropdownProps) {
	const visibleCount = columns.length - hiddenColumns.length;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2 bg-transparent">
					<Eye className="h-4 w-4" />
					Columns
					<span className="rounded-full bg-muted px-1.5 text-xs">
						{visibleCount}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-80 w-56 overflow-y-auto"
			>
				<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onShowAll}>Show All</DropdownMenuItem>
				<DropdownMenuItem onClick={onHideAll}>Hide All</DropdownMenuItem>
				<DropdownMenuSeparator />
				{columns.map(col => (
					<DropdownMenuCheckboxItem
						key={col.name}
						checked={!hiddenColumns.includes(col.name)}
						onCheckedChange={() => onToggleColumn(col.name)}
					>
						<span className="truncate">{col.name}</span>
						<span className="ml-auto text-muted-foreground text-xs">
							{col.type}
						</span>
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
