"use client";

import { useCallback, useEffect, useState } from "react";
import type { Column, Row } from "~/types/table";

interface UseTableCopyProps {
	visibleColumnsArray: Column[];
	sortedRows: Row[];
	selectedRows: Set<number>;
}

export function useTableCopy({
	visibleColumnsArray,
	sortedRows,
	selectedRows,
}: UseTableCopyProps) {
	const [copiedCell, setCopiedCell] = useState<string | null>(null);

	const copyCell = useCallback((value: string, cellId: string) => {
		navigator.clipboard.writeText(value);
		setCopiedCell(cellId);
		setTimeout(() => setCopiedCell(null), 1500);
	}, []);

	const copyRow = useCallback(
		(row: Row) => {
			const rowData = visibleColumnsArray.reduce(
				(acc, col) => {
					acc[col.name] = row[col.name];
					return acc;
				},
				{} as Record<string, unknown>
			);
			navigator.clipboard.writeText(JSON.stringify(rowData, null, 2));
		},
		[visibleColumnsArray]
	);

	const copySelectedRows = useCallback(() => {
		const selected = Array.from(selectedRows).map(i => sortedRows[i]);
		navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
	}, [selectedRows, sortedRows]);

	return {
		copiedCell,
		copyCell,
		copyRow,
		copySelectedRows,
	};
}

interface UseTableExportProps {
	visibleColumnsArray: Column[];
	sortedRows: Row[];
	tableName: string;
}

export function useTableExport({
	visibleColumnsArray,
	sortedRows,
	tableName,
}: UseTableExportProps) {
	const exportCSV = useCallback(() => {
		const headers = visibleColumnsArray.map(c => c.name).join(",");
		const csvRows = sortedRows.map(row =>
			visibleColumnsArray
				.map(col => {
					const val = row[col.name];
					if (val === null || val === undefined) return "";
					const str = String(val);
					if (str.includes(",") || str.includes('"') || str.includes("\n")) {
						return `"${str.replace(/"/g, '""')}"`;
					}
					return str;
				})
				.join(",")
		);
		const csv = [headers, ...csvRows].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${tableName}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [sortedRows, visibleColumnsArray, tableName]);

	const exportJSON = useCallback(() => {
		const data = sortedRows.map(row =>
			visibleColumnsArray.reduce(
				(acc, col) => {
					acc[col.name] = row[col.name];
					return acc;
				},
				{} as Record<string, unknown>
			)
		);
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${tableName}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, [sortedRows, visibleColumnsArray, tableName]);

	return {
		exportCSV,
		exportJSON,
	};
}

interface UseTableSelectionProps {
	sortedRows: Row[];
}

export function useTableSelection({ sortedRows }: UseTableSelectionProps) {
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	const toggleRowExpansion = useCallback((rowIndex: number) => {
		setExpandedRows(prev => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(rowIndex)) {
				newExpanded.delete(rowIndex);
			} else {
				newExpanded.add(rowIndex);
			}
			return newExpanded;
		});
	}, []);

	const toggleRowSelection = useCallback((rowIndex: number) => {
		setSelectedRows(prev => {
			const newSelected = new Set(prev);
			if (newSelected.has(rowIndex)) {
				newSelected.delete(rowIndex);
			} else {
				newSelected.add(rowIndex);
			}
			return newSelected;
		});
	}, []);

	const toggleAllRows = useCallback(() => {
		setSelectedRows(prev => {
			if (prev.size === sortedRows.length) {
				return new Set();
			}
			return new Set(sortedRows.map((_, i) => i));
		});
	}, [sortedRows]);

	const clearSelection = useCallback(() => {
		setSelectedRows(new Set());
	}, []);

	return {
		selectedRows,
		expandedRows,
		toggleRowExpansion,
		toggleRowSelection,
		toggleAllRows,
		clearSelection,
	};
}

interface UseTableSortProps {
	initialColumn?: string;
	initialDirection?: "asc" | "desc";
}

export function useTableSort({
	initialColumn,
	initialDirection,
}: UseTableSortProps = {}) {
	const [sortConfig, setSortConfig] = useState<{
		column: string;
		direction: "asc" | "desc";
	} | null>(
		initialColumn
			? { column: initialColumn, direction: initialDirection ?? "asc" }
			: null
	);

	const handleSort = useCallback((columnName: string) => {
		setSortConfig(prev => {
			if (prev?.column === columnName) {
				if (prev.direction === "asc") {
					return { column: columnName, direction: "desc" };
				}
				return null;
			}
			return { column: columnName, direction: "asc" };
		});
	}, []);

	return {
		sortConfig,
		handleSort,
	};
}

export function useTableResize(
	dbName: string,
	tableName: string,
	setColumnWidth: (
		dbName: string,
		tableName: string,
		colName: string,
		width: number
	) => void,
	setRowHeight: (
		dbName: string,
		tableName: string,
		rowKey: string,
		height: number
	) => void
) {
	const [resizingCol, setResizingCol] = useState<string | null>(null);
	const [resizingRow, setResizingRow] = useState<string | null>(null);
	const [resizeStartPos, setResizeStartPos] = useState(0);
	const [resizeStartSize, setResizeStartSize] = useState(0);

	// Handle resize events
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (resizingCol) {
				const diff = e.clientX - resizeStartPos;
				const newWidth = Math.max(50, resizeStartSize + diff);
				setColumnWidth(dbName, tableName, resizingCol, newWidth);
			} else if (resizingRow) {
				const diff = e.clientY - resizeStartPos;
				const newHeight = Math.max(30, resizeStartSize + diff);
				setRowHeight(dbName, tableName, resizingRow, newHeight);
			}
		};

		const handleMouseUp = () => {
			setResizingCol(null);
			setResizingRow(null);
			document.body.style.cursor = "default";
		};

		if (resizingCol || resizingRow) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [
		resizingCol,
		resizingRow,
		resizeStartPos,
		resizeStartSize,
		dbName,
		tableName,
		setColumnWidth,
		setRowHeight,
	]);

	const startColumnResize = useCallback(
		(e: React.MouseEvent, colName: string) => {
			e.preventDefault();
			e.stopPropagation();
			const header = (e.target as HTMLElement).closest("th");
			if (!header) return;
			const currentWidth = header.getBoundingClientRect().width;

			setResizingCol(colName);
			setResizeStartPos(e.clientX);
			setResizeStartSize(currentWidth);
			document.body.style.cursor = "col-resize";
		},
		[]
	);

	const startRowResize = useCallback((e: React.MouseEvent, rowKey: string) => {
		e.preventDefault();
		e.stopPropagation();
		const cell = (e.target as HTMLElement).closest("td");
		if (!cell) return;
		const currentHeight = cell.getBoundingClientRect().height;

		setResizingRow(rowKey);
		setResizeStartPos(e.clientY);
		setResizeStartSize(currentHeight);
		document.body.style.cursor = "row-resize";
	}, []);

	return {
		startColumnResize,
		startRowResize,
	};
}

interface UseTableKeyboardShortcutsProps {
	selectedRows: Set<number>;
	copySelectedRows: () => void;
	toggleAllRows: () => void;
	clearSelection: () => void;
	clearSearch: () => void;
}

export function useTableKeyboardShortcuts({
	selectedRows,
	copySelectedRows,
	toggleAllRows,
	clearSelection,
	clearSearch,
}: UseTableKeyboardShortcutsProps) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey) {
				if (e.key === "c" && selectedRows.size > 0) {
					e.preventDefault();
					copySelectedRows();
				}
				if (e.key === "a" && e.shiftKey) {
					e.preventDefault();
					toggleAllRows();
				}
			}
			if (e.key === "Escape") {
				clearSelection();
				clearSearch();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		selectedRows,
		copySelectedRows,
		toggleAllRows,
		clearSelection,
		clearSearch,
	]);
}
