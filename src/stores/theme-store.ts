import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor =
	| "zinc"
	| "red"
	| "blue"
	| "green"
	| "orange"
	| "violet"
	| "yellow";

interface ThemeState {
	color: ThemeColor;
	setColor: (color: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			color: "zinc",
			setColor: (color) => set({ color }),
		}),
		{
			name: "theme-storage", // unique name for localStorage
		},
	),
);
