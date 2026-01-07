"use client";

import { Button } from "@shared/components/ui/button";
import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import type { DensityMode, ViewMode } from "@shared/types/table";
import { type Column, DENSITY_STYLES, type Row } from "@shared/types/table";
import { Copy, Filter, X } from "lucide-react";
import {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useState,
} from "react";
import { applyFilter, applyTransformation } from "~/features/column-rules";
import type { FilterConfig } from "~/features/column-rules";
import type { TransformationConfig } from "~/features/column-rules";
import {
	useTableCopy,
	useTableExport,
	useTableKeyboardShortcuts,
	useTableResize,
	useTableSelection,
	useTableSort,
} from "../hooks/use-table-actions";
import {
	useTableColumnStore,
	useTableDensityStore,
	useTableOptionsStore,
	useTableViewModeStore,
	useTextViewOptionsStore,
} from "../stores";
import { useTableStore } from "../stores/table-store";
import {
	ColumnVisibilityDropdown,
	DensityDropdown,
	DisplayOptionsDropdown,
	GridView,
	TableFooter,
	TableHeader,
	TextView,
	TransposeView,
	ViewModeToggle,
} from "./table-viewer/index";

interface AdvancedTableViewerProps {
	dbName: string;
	tableName: string;
	columns: Column[];
	rows: Row[];
	transformations?: TransformationConfig[];
	filters?: FilterConfig[];
}

const EMPTY_ARRAY: string[] = [];

export interface AdvancedTableViewerRef {
	exportCSV: () => void;
	exportJSON: () => void;
}

export const AdvancedTableViewer = forwardRef<
	AdvancedTableViewerRef,
	AdvancedTableViewerProps & {
		searchQuery?: string;
		onSearchChange?: (query: string) => void;
	}
>(
	(
		{
			dbName,
			tableName,
			columns,
			rows,
			transformations = [],
			filters = [],
			searchQuery: externalSearchQuery,
			onSearchChange: externalOnSearchChange,
		},
		ref
	) => {
		const { getColumnWidth, setColumnWidth, getRowHeight, setRowHeight } =
			useTableStore();

		// Resize handling via hook
		const { startColumnResize, startRowResize } = useTableResize(
			dbName,
			tableName,
			setColumnWidth,
			setRowHeight
		);

		// Global Defaults (Reactive)
		const { defaultDensity, defaultTableOptions, defaultTextViewOptions } =
			useGlobalSettingsStore();

		// View state (Persisted)
		const densityModeRaw = useTableDensityStore(
			state => state.densityModes[`${dbName}-${tableName}`]
		);
		const densityMode = densityModeRaw ?? defaultDensity;

		const setDensityModeStore = useTableDensityStore(
			state => state.setDensityMode
		);

		const viewMode = useTableViewModeStore(
			state => state.viewModes[`${dbName}-${tableName}`] ?? "grid"
		);
		const setViewModeStore = useTableViewModeStore(state => state.setViewMode);

		const hiddenColumns = useTableColumnStore(
			state => state.hiddenColumns[`${dbName}-${tableName}`] ?? EMPTY_ARRAY
		);
		const pinnedColumnsList = useTableColumnStore(
			state => state.pinnedColumns[`${dbName}-${tableName}`] ?? EMPTY_ARRAY
		);
		const toggleColumnVisibilityStore = useTableColumnStore(
			state => state.toggleColumnVisibility
		);
		const setHiddenColumnsStore = useTableColumnStore(
			state => state.setHiddenColumns
		);
		const toggleColumnPinStore = useTableColumnStore(
			state => state.toggleColumnPin
		);

		const tableOptionsRaw = useTableOptionsStore(
			state => state.options[`${dbName}-${tableName}`]
		);
		const tableOptions = tableOptionsRaw ?? defaultTableOptions;
		const setOption = useTableOptionsStore(state => state.setOption);

		// Text View options (Persisted)
		const textViewOptionsRaw = useTextViewOptionsStore(
			state => state.options[`${dbName}-${tableName}`]
		);
		const textViewOptions = textViewOptionsRaw ?? defaultTextViewOptions;
		const setMaxCharactersStore = useTextViewOptionsStore(
			state => state.setMaxCharacters
		);
		const setAlignmentModeStore = useTextViewOptionsStore(
			state => state.setAlignmentMode
		);

		const {
			showRowNumbers,
			zebraStriping,
			wordWrap,
			showNullDistinct,
			fullWidth,
		} = tableOptions;

		const { maxCharacters, alignmentMode } = textViewOptions;

		// Wrappers for store actions
		const setDensityMode = useCallback(
			(mode: DensityMode) => setDensityModeStore(dbName, tableName, mode),
			[dbName, tableName, setDensityModeStore]
		);
		const setViewMode = useCallback(
			(mode: ViewMode) => setViewModeStore(dbName, tableName, mode),
			[dbName, tableName, setViewModeStore]
		);
		const toggleColumnVisibility = useCallback(
			(columnName: string) =>
				toggleColumnVisibilityStore(dbName, tableName, columnName),
			[dbName, tableName, toggleColumnVisibilityStore]
		);
		const setHiddenColumns = useCallback(
			(cols: string[]) => setHiddenColumnsStore(dbName, tableName, cols),
			[dbName, tableName, setHiddenColumnsStore]
		);
		const togglePinColumn = useCallback(
			(columnName: string) =>
				toggleColumnPinStore(dbName, tableName, columnName),
			[dbName, tableName, toggleColumnPinStore]
		);

		const setShowRowNumbers = useCallback(
			(val: boolean) => setOption(dbName, tableName, "showRowNumbers", val),
			[dbName, tableName, setOption]
		);
		const setZebraStriping = useCallback(
			(val: boolean) => setOption(dbName, tableName, "zebraStriping", val),
			[dbName, tableName, setOption]
		);
		const setWordWrap = useCallback(
			(val: boolean) => setOption(dbName, tableName, "wordWrap", val),
			[dbName, tableName, setOption]
		);
		const setShowNullDistinct = useCallback(
			(val: boolean) => setOption(dbName, tableName, "showNullDistinct", val),
			[dbName, tableName, setOption]
		);
		const setFullWidth = useCallback(
			(val: boolean) => setOption(dbName, tableName, "fullWidth", val),
			[dbName, tableName, setOption]
		);

		// Text View option setters
		const setMaxCharacters = useCallback(
			(val: number) => setMaxCharactersStore(dbName, tableName, val),
			[dbName, tableName, setMaxCharactersStore]
		);
		const setAlignmentMode = useCallback(
			(mode: "freeText" | "verticalAligned" | "horizontalAligned") =>
				setAlignmentModeStore(dbName, tableName, mode),
			[dbName, tableName, setAlignmentModeStore]
		);

		// Sorting via hook
		const { sortConfig, handleSort } = useTableSort();

		// Global Search
		const [internalSearch, setInternalSearch] = useState("");
		const globalSearch = externalSearchQuery ?? internalSearch;
		const setGlobalSearch = externalOnSearchChange ?? setInternalSearch;

		// Derived state
		const visibleColumns = useMemo(() => {
			const hiddenSet = new Set(hiddenColumns);
			return new Set(
				columns.filter(c => !hiddenSet.has(c.name)).map(c => c.name)
			);
		}, [columns, hiddenColumns]);

		const pinnedColumns = useMemo(
			() => new Set(pinnedColumnsList),
			[pinnedColumnsList]
		);

		const visibleColumnsArray = useMemo(() => {
			const visible = columns.filter(c => visibleColumns.has(c.name));
			// Sort pinned columns first
			return [...visible].sort((a, b) => {
				const aPinned = pinnedColumns.has(a.name);
				const bPinned = pinnedColumns.has(b.name);
				if (aPinned && !bPinned) return -1;
				if (!aPinned && bPinned) return 1;
				return 0;
			});
		}, [columns, visibleColumns, pinnedColumns]);

		// Filter rows based on global search and column filters
		const filteredRows = useMemo(() => {
			let filtered = [...rows];

			// Global search
			if (globalSearch) {
				const searchLower = globalSearch.toLowerCase();
				filtered = filtered.filter(row =>
					Object.values(row).some(val =>
						String(val ?? "")
							.toLowerCase()
							.includes(searchLower)
					)
				);
			}

			// Apply saved column filters
			const enabledFilters = filters.filter(f => f.isEnabled);
			for (const filter of enabledFilters) {
				filtered = filtered.filter(row => {
					const value = row[filter.columnName];
					return applyFilter(value, filter);
				});
			}

			return filtered;
		}, [rows, globalSearch, filters]);

		// Sort filtered rows
		const sortedRows = useMemo(() => {
			const sorted = [...filteredRows];
			if (sortConfig) {
				sorted.sort((a, b) => {
					const aVal = a[sortConfig.column];
					const bVal = b[sortConfig.column];
					if (aVal === null || aVal === undefined) return 1;
					if (bVal === null || bVal === undefined) return -1;
					if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
					if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
					return 0;
				});
			}
			return sorted;
		}, [filteredRows, sortConfig]);

		// Selection hook
		const {
			selectedRows,
			expandedRows,
			toggleRowExpansion,
			toggleRowSelection,
			toggleAllRows,
			clearSelection,
		} = useTableSelection({ sortedRows });

		// Copy hook
		const { copiedCell, copyCell, copyRow, copySelectedRows } = useTableCopy({
			visibleColumnsArray,
			sortedRows,
			selectedRows,
		});

		// Export hook
		const { exportCSV, exportJSON } = useTableExport({
			visibleColumnsArray,
			sortedRows,
			tableName,
		});

		useImperativeHandle(ref, () => ({
			exportCSV,
			exportJSON,
		}));

		// Keyboard shortcuts hook
		useTableKeyboardShortcuts({
			selectedRows,
			copySelectedRows,
			toggleAllRows,
			clearSelection,
			clearSearch: useCallback(() => setGlobalSearch(""), [setGlobalSearch]),
		});

		const formatValue = useCallback(
			(value: unknown, columnName?: string): string => {
				// Check if there's a transformation for this column
				if (columnName) {
					const transformation = transformations.find(
						t => t.columnName === columnName && t.isEnabled
					);
					if (transformation) {
						return applyTransformation(
							value,
							transformation.transformationType,
							transformation.options
						);
					}
				}

				// Default formatting
				if (value === null || value === undefined) return "∅";
				if (typeof value === "object") return JSON.stringify(value);
				return String(value);
			},
			[transformations]
		);

		const isNullValue = useCallback((value: unknown): boolean => {
			return value === null || value === undefined;
		}, []);

		const getRowKey = useCallback((row: Row, index: number): string => {
			const id = row.id ?? row._id ?? row.uuid ?? row.key;
			if (id !== undefined && id !== null) return String(id);
			return `row-${index}`;
		}, []);

		// Active filters count (from saved filters prop)
		const activeFiltersCount = filters.filter(f => f.isEnabled).length;

		// Show toolbar only if using internal search state
		const showInternalToolbar = externalSearchQuery === undefined;

		return (
			<div className="space-y-4">
				{/* Header */}
				{showInternalToolbar && (
					<div className="flex flex-col gap-4">
						<TableHeader
							globalSearch={globalSearch}
							onSearchChange={setGlobalSearch}
							onExportCSV={exportCSV}
							onExportJSON={exportJSON}
						/>
					</div>
				)}

				{/* Controls Row */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Column Visibility */}
					<ColumnVisibilityDropdown
						columns={columns}
						hiddenColumns={hiddenColumns}
						onToggleColumn={toggleColumnVisibility}
						onShowAll={() => setHiddenColumns([])}
						onHideAll={() => setHiddenColumns(columns.map(c => c.name))}
					/>

					{/* Active Filters Indicator */}
					{activeFiltersCount > 0 && (
						<div className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5 text-primary text-sm">
							<Filter className="h-4 w-4" />
							{activeFiltersCount} filter(s) active
						</div>
					)}

					{/* Divider */}
					<div className="mx-1 h-6 w-px bg-border" />

					{/* View Mode */}
					<ViewModeToggle value={viewMode} onValueChange={setViewMode} />

					{/* Density */}
					<DensityDropdown value={densityMode} onChange={setDensityMode} />

					{/* Display Options */}
					<DisplayOptionsDropdown
						viewMode={viewMode}
						showRowNumbers={showRowNumbers}
						zebraStriping={zebraStriping}
						wordWrap={wordWrap}
						showNullDistinct={showNullDistinct}
						fullWidth={fullWidth}
						maxCharacters={maxCharacters}
						alignmentMode={alignmentMode}
						onShowRowNumbersChange={setShowRowNumbers}
						onZebraStripingChange={setZebraStriping}
						onWordWrapChange={setWordWrap}
						onShowNullDistinctChange={setShowNullDistinct}
						onFullWidthChange={setFullWidth}
						onMaxCharactersChange={setMaxCharacters}
						onAlignmentModeChange={setAlignmentMode}
					/>

					{/* Selected rows actions */}
					{selectedRows.size > 0 && (
						<>
							<div className="mx-1 h-6 w-px bg-border" />
							<Button
								variant="outline"
								size="sm"
								className="gap-2 bg-transparent"
								onClick={copySelectedRows}
							>
								<Copy className="h-4 w-4" />
								Copy {selectedRows.size} row(s)
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2"
								onClick={clearSelection}
							>
								<X className="h-4 w-4" />
								Clear
							</Button>
						</>
					)}
				</div>

				{/* Table */}
				{viewMode === "grid" ? (
					<GridView
						dbName={dbName}
						tableName={tableName}
						columns={columns}
						rows={rows}
						sortedRows={sortedRows}
						visibleColumnsArray={visibleColumnsArray}
						selectedRows={selectedRows}
						expandedRows={expandedRows}
						pinnedColumns={pinnedColumns}
						transformations={transformations}
						filters={filters}
						sortConfig={sortConfig}
						densityStyles={DENSITY_STYLES}
						densityMode={densityMode}
						showRowNumbers={showRowNumbers}
						zebraStriping={zebraStriping}
						wordWrap={wordWrap}
						showNullDistinct={showNullDistinct}
						fullWidth={fullWidth}
						copiedCell={copiedCell}
						getColumnWidth={getColumnWidth}
						getRowHeight={getRowHeight}
						toggleAllRows={toggleAllRows}
						toggleRowSelection={toggleRowSelection}
						toggleRowExpansion={toggleRowExpansion}
						toggleColumnVisibility={toggleColumnVisibility}
						togglePinColumn={togglePinColumn}
						handleSort={handleSort}
						startColumnResize={startColumnResize}
						startRowResize={startRowResize}
						copyCell={copyCell}
						copyRow={copyRow}
						formatValue={formatValue}
						isNullValue={isNullValue}
						getRowKey={getRowKey}
					/>
				) : viewMode === "transpose" ? (
					<TransposeView
						dbName={dbName}
						tableName={tableName}
						sortedRows={sortedRows}
						visibleColumnsArray={visibleColumnsArray}
						densityMode={densityMode}
						zebraStriping={zebraStriping}
						wordWrap={wordWrap}
						showNullDistinct={showNullDistinct}
						fullWidth={fullWidth}
						getColumnWidth={getColumnWidth}
						getRowHeight={getRowHeight}
						startColumnResize={startColumnResize}
						startRowResize={startRowResize}
						formatValue={formatValue}
						isNullValue={isNullValue}
						getRowKey={getRowKey}
					/>
				) : (
					<TextView
						dbName={dbName}
						tableName={tableName}
						sortedRows={sortedRows}
						visibleColumnsArray={visibleColumnsArray}
						densityMode={densityMode}
						zebraStriping={zebraStriping}
						showNullDistinct={showNullDistinct}
						fullWidth={fullWidth}
						maxCharacters={maxCharacters}
						alignmentMode={alignmentMode}
						formatValue={formatValue}
						isNullValue={isNullValue}
						getRowKey={getRowKey}
					/>
				)}

				{/* Footer */}
				<TableFooter
					totalRows={rows.length}
					filteredRows={sortedRows.length}
					sortConfig={sortConfig}
				/>
			</div>
		);
	}
);
AdvancedTableViewer.displayName = "AdvancedTableViewer";
