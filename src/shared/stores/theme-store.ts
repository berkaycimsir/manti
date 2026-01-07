import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ThemeColor } from "~/config/theme-config";
export type { ThemeColor };

interface ThemeState {
	color: ThemeColor;
	setColor: (color: ThemeColor) => void;
	overrideColor: ThemeColor | null;
	setOverrideColor: (color: ThemeColor | null) => void;
}

export const useThemeStore = create<ThemeState>()(
	persist(
		set => ({
			color: "zinc",
			setColor: color => set({ color }),
			overrideColor: null,
			setOverrideColor: color => set({ overrideColor: color }),
		}),
		{
			name: "theme-storage", // unique name for localStorage
		}
	)
);
