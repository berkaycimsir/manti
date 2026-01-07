import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import {
	type TextViewAlignmentMode,
	type TextViewOptions,
	defaultTextViewOptions,
} from "@shared/types/table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export for backward compatibility
export type {
	TextViewAlignmentMode,
	TextViewOptions,
} from "@shared/types/table";

interface TextViewOptionsState {
	options: Record<string, TextViewOptions>;
	setMaxCharacters: (dbName: string, tableName: string, value: number) => void;
	setAlignmentMode: (
		dbName: string,
		tableName: string,
		mode: TextViewAlignmentMode
	) => void;
	getOptions: (dbName: string, tableName: string) => TextViewOptions;
}

export const useTextViewOptionsStore = create<TextViewOptionsState>()(
	persist(
		(set, get) => ({
			options: {},
			setMaxCharacters: (dbName, tableName, value) =>
				set(state => {
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
				set(state => {
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
				get().options[`${dbName}-${tableName}`] ??
				useGlobalSettingsStore.getState().defaultTextViewOptions,
		}),
		{ name: "text-view-options-storage" }
	)
);
