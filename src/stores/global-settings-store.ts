import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	DensityMode,
	TableOptions,
	TextViewOptions,
} from "./table-view-store";

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

export const defaultGlobalTableOptions: TableOptions = {
	showRowNumbers: true,
	zebraStriping: true,
	wordWrap: false,
	showNullDistinct: true,
	fullWidth: false,
};

export const defaultGlobalTextViewOptions: TextViewOptions = {
	maxCharacters: 100,
	alignmentMode: "freeText",
};

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
	persist(
		(set, _) => ({
			defaultDensity: "default",
			defaultTableOptions: defaultGlobalTableOptions,
			defaultTextViewOptions: defaultGlobalTextViewOptions,
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
