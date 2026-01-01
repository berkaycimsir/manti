"use client";

import { useMemo } from "react";
import { EmptyState } from "~/components/ui/empty-state";
import { cn } from "~/lib/utils";
import type { TextViewAlignmentMode } from "~/stores/table-view-store";
import type { Column, DensityMode, Row } from "~/types/table";
import { DENSITY_STYLES } from "~/types/table";
import { TextField } from "./text-field";

interface TextViewProps {
	dbName: string;
	tableName: string;
	sortedRows: Row[];
	visibleColumnsArray: Column[];
	densityMode: DensityMode;
	zebraStriping: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
	maxCharacters: number;
	alignmentMode: TextViewAlignmentMode;
	formatValue: (value: unknown, columnName?: string) => string;
	isNullValue: (value: unknown) => boolean;
	getRowKey: (row: Row, index: number) => string;
	maxRowsToShow?: number;
}

export function TextView({
	dbName: _dbName,
	tableName: _tableName,
	sortedRows,
	visibleColumnsArray,
	densityMode,
	zebraStriping,
	showNullDistinct,
	fullWidth,
	maxCharacters,
	alignmentMode,
	formatValue,
	isNullValue,
	getRowKey,
	maxRowsToShow = 100,
}: TextViewProps) {
	const densityStyles = DENSITY_STYLES;
	const displayedRows = sortedRows.slice(0, maxRowsToShow);

	// Calculate max column name length for aligned mode
	const maxColumnNameLength = useMemo(() => {
		return Math.max(...visibleColumnsArray.map((col) => col.name.length));
	}, [visibleColumnsArray]);

	// Calculate content-based column widths for horizontal alignment
	// Width = longest content in that column across all displayed rows
	const columnWidths = useMemo(() => {
		const widths: Record<string, number> = {};
		for (const col of visibleColumnsArray) {
			let maxLen = col.name.length + 6; // Start with column name + ": " + minimum value space
			for (const row of displayedRows) {
				const value = row[col.name];
				const isNull = value === null || value === undefined;

				let displayLen: number;
				if (isNull) {
					displayLen = 1; // "∅" is 1 char
				} else {
					const formatted = formatValue(value, col.name);
					// Use truncated length if exceeds maxCharacters, add 3 for "..."
					displayLen =
						formatted.length > maxCharacters
							? maxCharacters + 5
							: formatted.length;
				}

				const totalLen = col.name.length + 4 + displayLen; // "name: value"
				maxLen = Math.max(maxLen, totalLen);
			}
			// Convert chars to pixels (approx 7px per char) + padding
			widths[col.name] = maxLen * 7 + 20;
		}
		return widths;
	}, [visibleColumnsArray, displayedRows, formatValue, maxCharacters]);

	// Calculate total width for horizontal aligned mode
	const totalRowWidth = useMemo(() => {
		return (
			Object.values(columnWidths).reduce((sum, w) => sum + w, 0) +
			(visibleColumnsArray.length - 1) * 12
		); // 12px = gap-3
	}, [columnWidths, visibleColumnsArray.length]);

	if (sortedRows.length === 0) {
		return <EmptyState message="No data available" />;
	}

	// Horizontal Aligned Mode: Single scrollbar for all rows
	if (alignmentMode === "horizontalAligned") {
		return (
			<div
				className={cn(
					"overflow-hidden rounded-lg border border-border",
					fullWidth && "w-full",
				)}
			>
				<div className="max-h-[70vh] overflow-auto">
					<div style={{ minWidth: totalRowWidth }}>
						<div className="divide-y divide-border">
							{displayedRows.map((row, rowIndex) => {
								const rowKey = getRowKey(row, rowIndex);
								return (
									<div
										key={rowKey}
										className={cn(
											"group transition-colors hover:bg-muted/30",
											zebraStriping && rowIndex % 2 === 1 && "bg-muted/20",
											densityStyles[densityMode].py,
											"px-2",
										)}
									>
										<div className="flex gap-3 text-sm">
											{visibleColumnsArray.map((col) => {
												const value = row[col.name];
												const formattedValue = formatValue(value, col.name);
												const isNull = isNullValue(value);

												return (
													<div
														key={`${rowKey}-${col.name}`}
														className="flex-shrink-0 overflow-hidden"
														style={{ width: columnWidths[col.name] }}
													>
														<TextField
															columnName={col.name}
															value={value}
															maxCharacters={maxCharacters}
															formattedValue={formattedValue}
															isNull={isNull}
															showNullDistinct={showNullDistinct}
														/>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Footer showing row count info */}
				{sortedRows.length > maxRowsToShow && (
					<div className="border-border border-t bg-muted/30 px-4 py-2 text-muted-foreground text-sm">
						Showing {maxRowsToShow} of {sortedRows.length} rows in text view
					</div>
				)}
			</div>
		);
	}

	// Vertical Aligned and Free Text modes
	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-border",
				fullWidth && "w-full",
			)}
		>
			<div className="max-h-[70vh] overflow-auto">
				<div className="divide-y divide-border">
					{displayedRows.map((row, rowIndex) => {
						const rowKey = getRowKey(row, rowIndex);

						if (alignmentMode === "verticalAligned") {
							// Vertical Aligned Mode: Each field on its own line with padded names
							return (
								<div
									key={rowKey}
									className={cn(
										"group transition-colors hover:bg-muted/30",
										zebraStriping && rowIndex % 2 === 1 && "bg-muted/20",
										densityStyles[densityMode].py,
										"px-4",
									)}
								>
									<div className="space-y-0.5 font-mono text-sm">
										{visibleColumnsArray.map((col) => {
											const value = row[col.name];
											const formattedValue = formatValue(value, col.name);
											const isNull = isNullValue(value);
											const paddedName = col.name.padEnd(maxColumnNameLength);

											return (
												<div key={`${rowKey}-${col.name}`} className="flex">
													<TextField
														columnName={paddedName}
														value={value}
														maxCharacters={maxCharacters}
														formattedValue={formattedValue}
														isNull={isNull}
														showNullDistinct={showNullDistinct}
													/>
												</div>
											);
										})}
									</div>
								</div>
							);
						}

						// Free Text Mode: All fields on one line, compact
						return (
							<div
								key={rowKey}
								className={cn(
									"group transition-colors hover:bg-muted/30",
									zebraStriping && rowIndex % 2 === 1 && "bg-muted/20",
									densityStyles[densityMode].py,
									"px-4",
								)}
							>
								<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
									{visibleColumnsArray.map((col, colIndex) => {
										const value = row[col.name];
										const formattedValue = formatValue(value, col.name);
										const isNull = isNullValue(value);

										return (
											<span
												key={`${rowKey}-${col.name}`}
												className="inline-flex items-center"
											>
												<TextField
													columnName={col.name}
													value={value}
													maxCharacters={maxCharacters}
													formattedValue={formattedValue}
													isNull={isNull}
													showNullDistinct={showNullDistinct}
												/>
												{colIndex < visibleColumnsArray.length - 1 && (
													<span className="ml-2 text-muted-foreground/50">
														,
													</span>
												)}
											</span>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Footer showing row count info */}
			{sortedRows.length > maxRowsToShow && (
				<div className="border-border border-t bg-muted/30 px-4 py-2 text-muted-foreground text-sm">
					Showing {maxRowsToShow} of {sortedRows.length} rows in text view
				</div>
			)}
		</div>
	);
}
