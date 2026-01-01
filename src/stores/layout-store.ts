import { create } from "zustand";

interface LayoutState {
	isLayoutVisible: boolean;
	toggleLayout: () => void;
	showLayout: () => void;
	hideLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()((set) => ({
	isLayoutVisible: true,
	toggleLayout: () =>
		set((state) => ({ isLayoutVisible: !state.isLayoutVisible })),
	showLayout: () => set({ isLayoutVisible: true }),
	hideLayout: () => set({ isLayoutVisible: false }),
}));
