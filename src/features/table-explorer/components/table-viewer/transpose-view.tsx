"use client";

import { cn } from "@shared/lib/utils";
import type { Column, DensityMode, Row } from "@shared/types/table";
import { DENSITY_STYLES } from "@shared/types/table";
import { TruncatedCell } from "./truncated-cell";

interface TransposeViewProps {
	dbName: string;
	tableName: string;
	sortedRows: Row[];
	visibleColumnsArray: Column[];
	densityMode: DensityMode;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
	maxRowsToShow?: number;
	getColumnWidth: (
		dbName: string,
		tableName: string,
		colName: string
	) => number | undefined;
	getRowHeight: (
		dbName: string,
		tableName: string,
		rowKey: string
	) => number | undefined;
	startColumnResize: (e: React.MouseEvent, colName: string) => void;
	startRowResize: (e: React.MouseEvent, rowKey: string) => void;
	formatValue: (value: unknown, columnName?: string) => string;
	isNullValue: (value: unknown) => boolean;
	getRowKey: (row: Row, index: number) => string;
}

export function TransposeView({
	dbName,
	tableName,
	sortedRows,
	visibleColumnsArray,
	densityMode,
	zebraStriping,
	wordWrap,
	showNullDistinct,
	fullWidth,
	maxRowsToShow = 10,
	getColumnWidth,
	getRowHeight,
	startColumnResize,
	startRowResize,
	formatValue,
	isNullValue,
	getRowKey,
}: TransposeViewProps) {
	const densityStyles = DENSITY_STYLES;
	const displayedRows = sortedRows.slice(0, maxRowsToShow);

	if (sortedRows.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No data available
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-border",
				fullWidth && "w-full"
			)}
		>
			<div className="max-h-[70vh] overflow-auto">
				<table className="w-full">
					<thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
						<tr className="border-border border-b">
							{/* Field name column header */}
							<th
								className={cn(
									"group sticky left-0 z-20 border-border border-r bg-muted/95 px-4 text-left font-semibold text-foreground",
									densityStyles[densityMode].py
								)}
								style={{
									width:
										getColumnWidth(dbName, tableName, "__transpose_field") ??
										200,
									minWidth: 150,
								}}
							>
								<div className="flex items-center gap-2">
									<span>Field Name</span>
								</div>
								<div
									className="absolute top-0 right-0 z-50 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary"
									onMouseDown={e => startColumnResize(e, "__transpose_field")}
								/>
							</th>

							{/* Row column headers */}
							{displayedRows.map((row, colIndex) => {
								const width =
									getColumnWidth(
										dbName,
										tableName,
										`__transpose_row_${colIndex}`
									) ?? 200;

								return (
									<th
										key={getRowKey(row, colIndex)}
										className={cn(
											"group relative border-border border-r px-4 text-left font-semibold text-foreground last:border-r-0",
											densityStyles[densityMode].py
										)}
										style={{
											width,
											minWidth: 120,
											maxWidth: width,
										}}
									>
										Row {colIndex + 1}
										<div
											className="absolute top-0 right-0 z-50 h-full w-1 cursor-col-resize bg-transparent hover:bg-primary"
											onMouseDown={e =>
												startColumnResize(e, `__transpose_row_${colIndex}`)
											}
										/>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{visibleColumnsArray.map((col, rowIdx) => {
							const rowKey = `__transpose_col_${col.name}`;
							const height = getRowHeight(dbName, tableName, rowKey);

							return (
								<tr
									key={`field-${col.name}`}
									className={cn(
										"group border-border border-b transition-colors hover:bg-muted/30",
										zebraStriping && rowIdx % 2 === 1 && "bg-muted/20"
									)}
								>
									{/* Field name cell (sticky) */}
									<td
										className={cn(
											"group/field sticky left-0 z-10 border-border border-r bg-muted/50 px-4 font-semibold text-foreground",
											densityStyles[densityMode].py
										)}
										style={{ height }}
									>
										<div className="flex flex-col">
											<span className="truncate">{col.name}</span>
											<span className="font-normal text-muted-foreground text-xs">
												{col.type}
											</span>
										</div>
										<div
											className="absolute bottom-0 left-0 z-50 h-1 w-full cursor-row-resize bg-transparent hover:bg-primary"
											onMouseDown={e => startRowResize(e, rowKey)}
										/>
									</td>

									{/* Value cells for each row */}
									{displayedRows.map((row, rowIndex) => {
										const cellValue = row[col.name];
										const formattedValue = formatValue(cellValue, col.name);
										const isNull = isNullValue(cellValue);
										const width =
											getColumnWidth(
												dbName,
												tableName,
												`__transpose_row_${rowIndex}`
											) ?? 200;

										return (
											<td
												key={`transpose-${col.name}-${getRowKey(
													row,
													rowIndex
												)}`}
												className={cn(
													"border-border border-r px-4 last:border-r-0",
													densityStyles[densityMode].py,
													isNull && showNullDistinct && "bg-muted/20"
												)}
												style={{
													width,
													minWidth: 120,
													maxWidth: width,
													height,
												}}
											>
												{isNull && showNullDistinct ? (
													<span className="text-muted-foreground text-sm italic">
														∅ null
													</span>
												) : (
													<TruncatedCell
														value={formattedValue}
														wordWrap={wordWrap}
													/>
												)}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Footer showing row count info */}
			{sortedRows.length > maxRowsToShow && (
				<div className="border-border border-t bg-muted/30 px-4 py-2 text-muted-foreground text-sm">
					Showing {maxRowsToShow} of {sortedRows.length} rows in transpose view
				</div>
			)}
		</div>
	);
}
