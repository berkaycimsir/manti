import {
	type DensityMode,
	type TableOptions,
	type TextViewOptions,
	defaultTableOptions,
	defaultTextViewOptions,
} from "@shared/types/table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalSettingsState {
	// Defaults for tables
	defaultDensity: DensityMode;
	defaultTableOptions: TableOptions;
	defaultTextViewOptions: TextViewOptions;
	useConnectionThemeColor: boolean;

	setDefaultDensity: (density: DensityMode) => void;
	setDefaultTableOptions: (options: Partial<TableOptions>) => void;
	setDefaultTextViewOptions: (options: Partial<TextViewOptions>) => void;
	setUseConnectionThemeColor: (use: boolean) => void;
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
	persist(
		(set, _) => ({
			defaultDensity: "default",
			defaultTableOptions: defaultTableOptions,
			defaultTextViewOptions: defaultTextViewOptions,
			useConnectionThemeColor: true,

			setDefaultDensity: density => set({ defaultDensity: density }),
			setDefaultTableOptions: options =>
				set(state => ({
					defaultTableOptions: { ...state.defaultTableOptions, ...options },
				})),
			setDefaultTextViewOptions: options =>
				set(state => ({
					defaultTextViewOptions: {
						...state.defaultTextViewOptions,
						...options,
					},
				})),
			setUseConnectionThemeColor: use => set({ useConnectionThemeColor: use }),
		}),
		{
			name: "global-settings-storage",
		}
	)
);
