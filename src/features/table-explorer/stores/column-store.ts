import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColumnState {
	hiddenColumns: Record<string, string[]>;
	pinnedColumns: Record<string, string[]>;
	toggleColumnVisibility: (
		dbName: string,
		tableName: string,
		columnName: string
	) => void;
	setHiddenColumns: (
		dbName: string,
		tableName: string,
		columns: string[]
	) => void;
	toggleColumnPin: (
		dbName: string,
		tableName: string,
		columnName: string
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
				set(state => {
					const key = `${dbName}-${tableName}`;
					const currentHidden = state.hiddenColumns[key] || [];
					const isHidden = currentHidden.includes(columnName);

					return {
						hiddenColumns: {
							...state.hiddenColumns,
							[key]: isHidden
								? currentHidden.filter(c => c !== columnName)
								: [...currentHidden, columnName],
						},
					};
				}),
			setHiddenColumns: (dbName, tableName, columns) =>
				set(state => ({
					hiddenColumns: {
						...state.hiddenColumns,
						[`${dbName}-${tableName}`]: columns,
					},
				})),
			toggleColumnPin: (dbName, tableName, columnName) =>
				set(state => {
					const key = `${dbName}-${tableName}`;
					const currentPinned = state.pinnedColumns[key] || [];
					const isPinned = currentPinned.includes(columnName);

					return {
						pinnedColumns: {
							...state.pinnedColumns,
							[key]: isPinned
								? currentPinned.filter(c => c !== columnName)
								: [...currentPinned, columnName],
						},
					};
				}),
			getHiddenColumns: (dbName, tableName) =>
				get().hiddenColumns[`${dbName}-${tableName}`] ?? [],
			getPinnedColumns: (dbName, tableName) =>
				get().pinnedColumns[`${dbName}-${tableName}`] ?? [],
		}),
		{ name: "table-column-storage" }
	)
);
