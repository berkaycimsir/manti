import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DensityMode = "compact" | "default" | "comfortable";
export type ViewMode = "grid" | "transpose" | "text";

// --- Text View Options Store ---
export type TextViewAlignmentMode =
	| "freeText"
	| "verticalAligned"
	| "horizontalAligned";

export interface TextViewOptions {
	maxCharacters: number;
	alignmentMode: TextViewAlignmentMode;
}

const defaultTextViewOptions: TextViewOptions = {
	maxCharacters: 100,
	alignmentMode: "freeText",
};

interface TextViewOptionsState {
	options: Record<string, TextViewOptions>;
	setMaxCharacters: (dbName: string, tableName: string, value: number) => void;
	setAlignmentMode: (
		dbName: string,
		tableName: string,
		mode: TextViewAlignmentMode,
	) => void;
	getOptions: (dbName: string, tableName: string) => TextViewOptions;
}

export const useTextViewOptionsStore = create<TextViewOptionsState>()(
	persist(
		(set, get) => ({
			options: {},
			setMaxCharacters: (dbName, tableName, value) =>
				set((state) => {
					const key = `${dbName}-${tableName}`;
					const current = state.options[key] ?? defaultTextViewOptions;
					return {
						options: {
							...state.options,
							[key]: { ...current, maxCharacters: value },
						},
					};
				}),
			setAlignmentMode: (dbName, tableName, mode) =>
				set((state) => {
					const key = `${dbName}-${tableName}`;
					const current = state.options[key] ?? defaultTextViewOptions;
					return {
						options: {
							...state.options,
							[key]: { ...current, alignmentMode: mode },
						},
					};
				}),
			getOptions: (dbName, tableName) =>
				get().options[`${dbName}-${tableName}`] ?? defaultTextViewOptions,
		}),
		{ name: "text-view-options-storage" },
	),
);

// --- Density Store ---
interface DensityState {
	densityModes: Record<string, DensityMode>;
	setDensityMode: (
		dbName: string,
		tableName: string,
		mode: DensityMode,
	) => void;
	getDensityMode: (dbName: string, tableName: string) => DensityMode;
}

export const useTableDensityStore = create<DensityState>()(
	persist(
		(set, get) => ({
			densityModes: {},
			setDensityMode: (dbName, tableName, mode) =>
				set((state) => ({
					densityModes: {
						...state.densityModes,
						[`${dbName}-${tableName}`]: mode,
					},
				})),
			getDensityMode: (dbName, tableName) =>
				get().densityModes[`${dbName}-${tableName}`] ?? "default",
		}),
		{ name: "table-density-storage" },
	),
);

// --- View Mode Store ---
interface ViewModeState {
	viewModes: Record<string, ViewMode>;
	setViewMode: (dbName: string, tableName: string, mode: ViewMode) => void;
	getViewMode: (dbName: string, tableName: string) => ViewMode;
}

export const useTableViewModeStore = create<ViewModeState>()(
	persist(
		(set, get) => ({
			viewModes: {},
			setViewMode: (dbName, tableName, mode) =>
				set((state) => ({
					viewModes: {
						...state.viewModes,
						[`${dbName}-${tableName}`]: mode,
					},
				})),
			getViewMode: (dbName, tableName) =>
				get().viewModes[`${dbName}-${tableName}`] ?? "grid",
		}),
		{ name: "table-view-mode-storage" },
	),
);

// --- Column Visibility & Pinning Store ---
interface ColumnState {
	hiddenColumns: Record<string, string[]>;
	pinnedColumns: Record<string, string[]>;
	toggleColumnVisibility: (
		dbName: string,
		tableName: string,
		columnName: string,
	) => void;
	setHiddenColumns: (
		dbName: string,
		tableName: string,
		columns: string[],
	) => void;
	toggleColumnPin: (
		dbName: string,
		tableName: string,
		columnName: string,
	) => void;
	getHiddenColumns: (dbName: string, tableName: string) => string[];
	getPinnedColumns: (dbName: string, tableName: string) => string[];
}

export const useTableColumnStore = create<ColumnState>()(
	persist(
		(set, get) => ({
			hiddenColumns: {},
			pinnedColumns: {},
			toggleColumnVisibility: (dbName, tableName, columnName) =>
				set((state) => {
					const key = `${dbName}-${tableName}`;
					const currentHidden = state.hiddenColumns[key] || [];
					const isHidden = currentHidden.includes(columnName);

					return {
						hiddenColumns: {
							...state.hiddenColumns,
							[key]: isHidden
								? currentHidden.filter((c) => c !== columnName)
								: [...currentHidden, columnName],
						},
					};
				}),
			setHiddenColumns: (dbName, tableName, columns) =>
				set((state) => ({
					hiddenColumns: {
						...state.hiddenColumns,
						[`${dbName}-${tableName}`]: columns,
					},
				})),
			toggleColumnPin: (dbName, tableName, columnName) =>
				set((state) => {
					const key = `${dbName}-${tableName}`;
					const currentPinned = state.pinnedColumns[key] || [];
					const isPinned = currentPinned.includes(columnName);

					return {
						pinnedColumns: {
							...state.pinnedColumns,
							[key]: isPinned
								? currentPinned.filter((c) => c !== columnName)
								: [...currentPinned, columnName],
						},
					};
				}),
			getHiddenColumns: (dbName, tableName) =>
				get().hiddenColumns[`${dbName}-${tableName}`] ?? [],
			getPinnedColumns: (dbName, tableName) =>
				get().pinnedColumns[`${dbName}-${tableName}`] ?? [],
		}),
		{ name: "table-column-storage" },
	),
);

// --- Table Options Store ---
export interface TableOptions {
	showRowNumbers: boolean;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
}

const defaultOptions: TableOptions = {
	showRowNumbers: true,
	zebraStriping: true,
	wordWrap: false,
	showNullDistinct: true,
	fullWidth: false,
};

interface OptionsState {
	options: Record<string, TableOptions>;
	setOption: (
		dbName: string,
		tableName: string,
		key: keyof TableOptions,
		value: boolean,
	) => void;
	getOptions: (dbName: string, tableName: string) => TableOptions;
}

export const useTableOptionsStore = create<OptionsState>()(
	persist(
		(set, get) => ({
			options: {},
			setOption: (dbName, tableName, key, value) =>
				set((state) => {
					const dbKey = `${dbName}-${tableName}`;
					const currentOptions = state.options[dbKey] ?? defaultOptions;

					return {
						options: {
							...state.options,
							[dbKey]: {
								...currentOptions,
								[key]: value,
							},
						},
					};
				}),
			getOptions: (dbName, tableName) =>
				get().options[`${dbName}-${tableName}`] ?? defaultOptions,
		}),
		{ name: "table-options-storage" },
	),
);
