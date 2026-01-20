"use client";

import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Input } from "@shared/components/ui/input";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import type { Column } from "@shared/types/table";
import { Palette, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTableColumnStore } from "../../stores/column-store";

interface TextViewAppearanceDropdownProps {
	dbName: string;
	tableName: string;
	columns: Column[];
}

export function   TextViewAppearanceDropdown({
	dbName,
	tableName,
	columns,
}: TextViewAppearanceDropdownProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const setColumnColor = useTableColumnStore(state => state.setColumnColor);
	
	// Memoize the key to avoid recreating it
	const storeKey = useMemo(() => `${dbName}-${tableName}`, [dbName, tableName]);
	
	// Select columnColors directly without defaulting to {} in the selector
	const columnColors = useTableColumnStore(
		state => state.columnColors[storeKey]
	);
	
	// Use an empty object only when needed for lookups (not in the selector)
	const safeColumnColors = columnColors || {};

	const filteredColumns = useMemo(() => {
		if (!searchQuery) return columns;
		const query = searchQuery.toLowerCase();
		return columns.filter(col => col.name.toLowerCase().includes(query));
	}, [columns, searchQuery]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2 bg-transparent">
					<Palette className="h-4 w-4" />
					Colors
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<DropdownMenuLabel>Column Colors</DropdownMenuLabel>
				<div className="px-2 py-1">
					<div className="relative">
						<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search columns..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="h-9 pl-9"
						/>
					</div>
				</div>
				<DropdownMenuSeparator />
				<ScrollArea className="h-[300px]">
					<div className="space-y-1 p-2">
						{filteredColumns.length === 0 ? (
							<div className="py-4 text-center text-muted-foreground text-sm">
								No columns found
							</div>
						) : (
							filteredColumns.map(col => (
								<div
									key={col.name}
									className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/50"
								>
									<span
										className="flex-1 truncate font-medium text-sm"
										style={{
											color: safeColumnColors[col.name],
											// If no color selected, use default text color but maybe slightly muted to indicate "default" in list?
											// actually let's keep it inheriting
										}}
									>
										{col.name}
									</span>
									<div className="flex items-center gap-1">
										<div
											className="relative h-6 w-6 overflow-hidden rounded-full border border-input shadow-sm transition-transform hover:scale-105 active:scale-95"
											title="Pick color"
										>
											<input
												type="color"
												value={safeColumnColors[col.name] || "#000000"}
												onChange={e =>
													setColumnColor(
														dbName,
														tableName,
														col.name,
														e.target.value
													)
												}
												// Opacity 0 makes the native input invisible but clickable over the div
												className="absolute top-0 left-0 h-full w-full cursor-pointer opacity-0"
											/>
											{/* Visible color indicator */}
											<div
												className="h-full w-full"
												style={{
													backgroundColor:
														safeColumnColors[col.name] || "transparent",
												}}
											/>
											{/* Show a pseudo-color wheel or placeholder if transparent/default */}
									{!safeColumnColors[col.name] && (
												<div
													className="h-full w-full opacity-75"
													style={{
														background:
															"conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)",
													}}
												/>
											)}
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-muted-foreground hover:text-foreground"
											onClick={() =>
												setColumnColor(dbName, tableName, col.name, null)
											}
											disabled={!safeColumnColors[col.name]}
											title="Reset to default"
										>
											<RotateCcw className="h-3 w-3" />
										</Button>
									</div>
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
