import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import type { DensityMode } from "@shared/types/table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DensityState {
	densityModes: Record<string, DensityMode>;
	setDensityMode: (
		dbName: string,
		tableName: string,
		mode: DensityMode
	) => void;
	getDensityMode: (dbName: string, tableName: string) => DensityMode;
}

export const useTableDensityStore = create<DensityState>()(
	persist(
		(set, get) => ({
			densityModes: {},
			setDensityMode: (dbName, tableName, mode) =>
				set(state => ({
					densityModes: {
						...state.densityModes,
						[`${dbName}-${tableName}`]: mode,
					},
				})),
			getDensityMode: (dbName, tableName) =>
				get().densityModes[`${dbName}-${tableName}`] ??
				useGlobalSettingsStore.getState().defaultDensity,
		}),
		{ name: "table-density-storage" }
	)
);
