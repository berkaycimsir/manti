import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TableState {
	columnWidths: Record<string, number>; // key: `${dbName}-${tableName}-${columnName}`
	rowHeights: Record<string, number>; // key: `${dbName}-${tableName}-${rowKey}`
	setColumnWidth: (
		dbName: string,
		tableName: string,
		columnName: string,
		width: number
	) => void;
	setRowHeight: (
		dbName: string,
		tableName: string,
		rowKey: string,
		height: number
	) => void;
	getColumnWidth: (
		dbName: string,
		tableName: string,
		columnName: string
	) => number | undefined;
	getRowHeight: (
		dbName: string,
		tableName: string,
		rowKey: string
	) => number | undefined;
}

export const useTableStore = create<TableState>()(
	persist(
		(set, get) => ({
			columnWidths: {},
			rowHeights: {},
			setColumnWidth: (dbName, tableName, columnName, width) =>
				set(state => ({
					columnWidths: {
						...state.columnWidths,
						[`${dbName}-${tableName}-${columnName}`]: width,
					},
				})),
			setRowHeight: (dbName, tableName, rowKey, height) =>
				set(state => ({
					rowHeights: {
						...state.rowHeights,
						[`${dbName}-${tableName}-${rowKey}`]: height,
					},
				})),
			getColumnWidth: (dbName, tableName, columnName) =>
				get().columnWidths[`${dbName}-${tableName}-${columnName}`],
			getRowHeight: (dbName, tableName, rowKey) =>
				get().rowHeights[`${dbName}-${tableName}-${rowKey}`],
		}),
		{
			name: "table-storage",
		}
	)
);
