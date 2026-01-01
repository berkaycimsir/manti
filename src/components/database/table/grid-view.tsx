"use client";

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	ChevronDown,
	ChevronUp,
	Clipboard,
	Copy,
	EyeOff,
	Filter,
	Pin,
	PinOff,
	Sparkles,
	X,
} from "lucide-react";
import { Fragment } from "react";
import type { FilterConfig } from "~/components/database/filter-sidebar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { TransformationConfig } from "~/lib/transformations";
import { cn } from "~/lib/utils";
import type { Column, DensityMode, DensityStyles, Row } from "~/types/table";
import {
	CHECKBOX_WIDTH,
	EXPAND_BUTTON_WIDTH,
	ROW_NUMBER_WIDTH,
} from "~/types/table";
import { calculateColumnStats } from "./column-stats";
import { ColumnStatsPopover } from "./column-stats-popover";
import { TruncatedCell } from "./truncated-cell";

interface GridViewProps {
	dbName: string;
	tableName: string;
	columns: Column[];
	rows: Row[];
	sortedRows: Row[];
	visibleColumnsArray: Column[];
	selectedRows: Set<number>;
	expandedRows: Set<number>;
	pinnedColumns: Set<string>;
	transformations: TransformationConfig[];
	filters: FilterConfig[];
	sortConfig: { column: string; direction: "asc" | "desc" } | null;
	densityStyles: Record<DensityMode, DensityStyles>;
	densityMode: DensityMode;
	showRowNumbers: boolean;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
	copiedCell: string | null;
	getColumnWidth: (
		dbName: string,
		tableName: string,
		colName: string,
	) => number | undefined;
	getRowHeight: (
		dbName: string,
		tableName: string,
		rowKey: string,
	) => number | undefined;
	toggleAllRows: () => void;
	toggleRowSelection: (rowIndex: number) => void;
	toggleRowExpansion: (rowIndex: number) => void;
	toggleColumnVisibility: (columnName: string) => void;
	togglePinColumn: (columnName: string) => void;
	handleSort: (columnName: string) => void;
	startColumnResize: (e: React.MouseEvent, colName: string) => void;
	startRowResize: (e: React.MouseEvent, rowKey: string) => void;
	copyCell: (value: string, cellId: string) => void;
	copyRow: (row: Row) => void;
	formatValue: (value: unknown, columnName?: string) => string;
	isNullValue: (value: unknown) => boolean;
	getRowKey: (row: Row, index: number) => string;
}

export function GridView({
	dbName,
	tableName,
	rows,
	sortedRows,
	visibleColumnsArray,
	selectedRows,
	expandedRows,
	pinnedColumns,
	transformations,
	filters,
	sortConfig,
	densityStyles,
	densityMode,
	showRowNumbers,
	zebraStriping,
	wordWrap,
	showNullDistinct,
	fullWidth,
	copiedCell,
	getColumnWidth,
	getRowHeight,
	toggleAllRows,
	toggleRowSelection,
	toggleRowExpansion,
	toggleColumnVisibility,
	togglePinColumn,
	handleSort,
	startColumnResize,
	startRowResize,
	copyCell,
	copyRow,
	formatValue,
	isNullValue,
	getRowKey,
}: GridViewProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-border",
				fullWidth && "w-full",
			)}
		>
			<div className="max-h-[70vh] overflow-auto">
				<table className="w-full">
					<thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
						<tr className="border-border border-b">
							{/* Row selection checkbox */}
							<th
								className={cn(
									"bg-muted/95 px-2",
									densityStyles[densityMode].py,
								)}
								style={{ width: CHECKBOX_WIDTH, minWidth: CHECKBOX_WIDTH }}
							>
								<Checkbox
									checked={
										selectedRows.size === sortedRows.length &&
										sortedRows.length > 0
									}
									onCheckedChange={toggleAllRows}
								/>
							</th>

							{/* Row number header */}
							{showRowNumbers && (
								<th
									className={cn(
										"bg-muted/95 px-2 text-center font-medium text-muted-foreground",
										densityStyles[densityMode].py,
										densityStyles[densityMode].text,
									)}
									style={{
										width: ROW_NUMBER_WIDTH,
										minWidth: ROW_NUMBER_WIDTH,
									}}
								>
									#
								</th>
							)}

							{/* Expand button header */}
							<th
								className={cn(
									"bg-muted/95 px-2",
									densityStyles[densityMode].py,
								)}
								style={{
									width: EXPAND_BUTTON_WIDTH,
									minWidth: EXPAND_BUTTON_WIDTH,
								}}
							/>

							{/* Column headers */}
							{visibleColumnsArray.map((col) => {
								const hasTransformation = transformations.some(
									(t) => t.columnName === col.name && t.isEnabled,
								);
								const isPinned = pinnedColumns.has(col.name);
								const isSorted = sortConfig?.column === col.name;
								const stats = calculateColumnStats(rows, col.name, col.type);
								const width =
									getColumnWidth(dbName, tableName, col.name) ?? "auto";

								return (
									<th
										key={col.name}
										className={cn(
											"group relative border-border border-r px-3 py-1 text-left font-semibold text-foreground last:border-r-0",
											isPinned && "sticky bg-muted/95",
										)}
										style={{
											width,
											minWidth: width === "auto" ? 150 : width,
											maxWidth: width === "auto" ? 300 : width,
										}}
									>
										<div className="flex items-center gap-1 overflow-hidden">
											{/* Main column info */}
											<button
												type="button"
												className="flex min-w-0 flex-1 cursor-pointer flex-col overflow-hidden text-left"
												onClick={() => handleSort(col.name)}
											>
												<div
													className={cn(
														"flex min-w-0 items-center gap-1.5",
														densityStyles[densityMode].text,
													)}
												>
													<span className="truncate">{col.name}</span>
													{hasTransformation && (
														<span
															title="Has transformation"
															className="shrink-0"
														>
															<Sparkles className="h-3 w-3 text-primary" />
														</span>
													)}
													{isPinned && (
														<Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
													)}
												</div>
												<span className="truncate font-normal text-muted-foreground text-xs">
													{col.type}
												</span>
											</button>

											{/* Sort indicator */}
											{isSorted ? (
												sortConfig?.direction === "asc" ? (
													<ArrowUp className="h-4 w-4 shrink-0 text-primary" />
												) : (
													<ArrowDown className="h-4 w-4 shrink-0 text-primary" />
												)
											) : (
												<ArrowUpDown className="hidden h-4 w-4 shrink-0 opacity-50 group-hover:block" />
											)}

											{/* Filter indicator (if column has active filter) */}
											{filters.some(
												(f) => f.columnName === col.name && f.isEnabled,
											) && (
												<span title="Has filter" className="shrink-0">
													<Filter className="h-3 w-3 text-primary" />
												</span>
											)}

											{/* Stats button */}
											<ColumnStatsPopover stats={stats} columnName={col.name} />

											{/* Column menu */}
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="hidden h-5 w-5 shrink-0 p-0 group-hover:inline-flex"
													>
														<ChevronDown className="h-3 w-3" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-44">
													<DropdownMenuItem
														onClick={() => handleSort(col.name)}
													>
														{isSorted ? (
															sortConfig?.direction === "asc" ? (
																<>
																	<ArrowDown className="mr-2 h-4 w-4" />
																	Sort Descending
																</>
															) : (
																<>
																	<X className="mr-2 h-4 w-4" />
																	Clear Sort
																</>
															)
														) : (
															<>
																<ArrowUp className="mr-2 h-4 w-4" />
																Sort Ascending
															</>
														)}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => togglePinColumn(col.name)}
													>
														{isPinned ? (
															<>
																<PinOff className="mr-2 h-4 w-4" />
																Unpin Column
															</>
														) : (
															<>
																<Pin className="mr-2 h-4 w-4" />
																Pin Column
															</>
														)}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => toggleColumnVisibility(col.name)}
													>
														<EyeOff className="mr-2 h-4 w-4" />
														Hide Column
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										<div
											className="absolute top-0 right-0 z-50 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary"
											onMouseDown={(e) => startColumnResize(e, col.name)}
										/>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{sortedRows.map((row, rowIndex) => {
							const rowKey = getRowKey(row, rowIndex);
							const isSelected = selectedRows.has(rowIndex);
							const isExpanded = expandedRows.has(rowIndex);

							return (
								<Fragment key={rowKey}>
									<tr
										className={cn(
											"group border-border border-b transition-colors",
											isSelected && "bg-primary/10",
											!isSelected &&
												zebraStriping &&
												rowIndex % 2 === 1 &&
												"bg-muted/30",
											!isSelected && "hover:bg-muted/50",
										)}
									>
										{/* Selection checkbox */}
										<td
											className={cn(
												"bg-inherit px-2",
												densityStyles[densityMode].py,
											)}
											style={{
												width: CHECKBOX_WIDTH,
												minWidth: CHECKBOX_WIDTH,
											}}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => toggleRowSelection(rowIndex)}
											/>
										</td>

										{/* Row number */}
										{showRowNumbers && (
											<td
												className={cn(
													"group/row-header relative bg-inherit px-2 text-center font-mono text-muted-foreground",
													densityStyles[densityMode].py,
													densityStyles[densityMode].text,
												)}
												style={{
													width: ROW_NUMBER_WIDTH,
													minWidth: ROW_NUMBER_WIDTH,
													height: getRowHeight(dbName, tableName, rowKey),
												}}
											>
												<div className="flex h-full w-full items-center justify-center">
													{rowIndex + 1}
												</div>
												<div
													className="absolute bottom-0 left-0 z-50 h-1 w-full cursor-row-resize bg-transparent hover:bg-primary"
													onMouseDown={(e) => startRowResize(e, rowKey)}
												/>
											</td>
										)}

										{/* Expand button */}
										<td
											className={cn(
												"bg-inherit px-2",
												densityStyles[densityMode].py,
											)}
											style={{
												width: EXPAND_BUTTON_WIDTH,
												minWidth: EXPAND_BUTTON_WIDTH,
											}}
										>
											<div className="flex h-full w-full items-center justify-center">
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => toggleRowExpansion(rowIndex)}
												>
													{isExpanded ? (
														<ChevronUp className="h-4 w-4" />
													) : (
														<ChevronDown className="h-4 w-4" />
													)}
												</Button>
											</div>
										</td>

										{/* Data cells */}
										{visibleColumnsArray.map((col) => {
											const cellValue = row[col.name];
											const formattedValue = formatValue(cellValue, col.name);
											const cellId = `${rowKey}-${col.name}`;
											const isPinned = pinnedColumns.has(col.name);
											const isNull = isNullValue(cellValue);
											const width =
												getColumnWidth(dbName, tableName, col.name) ?? "auto";

											return (
												<td
													key={cellId}
													className={cn(
														"group/cell relative overflow-hidden border-border border-r px-3 last:border-r-0",
														densityStyles[densityMode].py,
														isPinned && "sticky bg-inherit",
														isNull && showNullDistinct && "bg-muted/20",
													)}
													style={{
														width,
														minWidth: width === "auto" ? 150 : width,
														maxWidth: width === "auto" ? 300 : width,
													}}
													onDoubleClick={() => copyCell(formattedValue, cellId)}
													title="Double-click to copy"
												>
													<div className="flex h-full items-center gap-1">
														<div className="min-w-0 flex-1">
															{isNull && showNullDistinct ? (
																<span
																	className={cn(
																		"text-muted-foreground italic",
																		densityStyles[densityMode].text,
																	)}
																>
																	∅ null
																</span>
															) : (
																<TruncatedCell
																	value={formattedValue}
																	wordWrap={wordWrap}
																/>
															)}
														</div>
														{/* Copy indicator */}
														{copiedCell === cellId && (
															<Check className="h-3 w-3 text-green-500" />
														)}
														{/* Copy button on hover */}
														<Button
															variant="ghost"
															size="sm"
															className="h-5 w-5 p-0 opacity-0 group-hover/cell:opacity-100"
															onClick={() => copyCell(formattedValue, cellId)}
														>
															<Copy className="h-3 w-3" />
														</Button>
													</div>
												</td>
											);
										})}
									</tr>

									{/* Expanded Row Detail View */}
									{isExpanded && (
										<tr className="border-border border-b bg-muted/20">
											<td
												colSpan={
													3 +
													visibleColumnsArray.length +
													(showRowNumbers ? 1 : 0)
												}
												className="px-4 py-4"
											>
												<div className="space-y-3">
													<div className="flex items-center justify-between">
														<div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
															Row {rowIndex + 1} Details
														</div>
														<Button
															variant="outline"
															size="sm"
															className="h-7"
															onClick={() => copyRow(row)}
														>
															<Clipboard className="mr-2 h-3 w-3" />
															Copy Row
														</Button>
													</div>
													<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
														{visibleColumnsArray.map((col) => (
															<div
																key={`detail-${rowKey}-${col.name}`}
																className="rounded border border-border bg-background p-3"
															>
																<div className="mb-1 flex items-center justify-between">
																	<span className="font-semibold text-muted-foreground text-xs">
																		{col.name}
																	</span>
																	<span className="text-muted-foreground text-xs">
																		{col.type}
																	</span>
																</div>
																<div className="wrap-anywhere whitespace-pre-wrap rounded bg-muted/30 p-2 font-mono text-sm">
																	{formatValue(row[col.name], col.name)}
																</div>
															</div>
														))}
													</div>
												</div>
											</td>
										</tr>
									)}
								</Fragment>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
