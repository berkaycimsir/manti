import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import { type TableOptions, defaultTableOptions } from "@shared/types/table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export for backward compatibility
export type { TableOptions } from "@shared/types/table";

interface OptionsState {
	options: Record<string, TableOptions>;
	setOption: (
		dbName: string,
		tableName: string,
		key: keyof TableOptions,
		value: boolean
	) => void;
	getOptions: (dbName: string, tableName: string) => TableOptions;
}

export const useTableOptionsStore = create<OptionsState>()(
	persist(
		(set, get) => ({
			options: {},
			setOption: (dbName, tableName, key, value) =>
				set(state => {
					const dbKey = `${dbName}-${tableName}`;
					const currentOptions = state.options[dbKey] ?? defaultTableOptions;

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
				get().options[`${dbName}-${tableName}`] ??
				useGlobalSettingsStore.getState().defaultTableOptions,
		}),
		{ name: "table-options-storage" }
	)
);
