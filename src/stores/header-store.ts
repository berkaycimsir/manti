import type { ReactNode } from "react";
import { create } from "zustand";

export interface HeaderConfig {
	/** Main title displayed in the header */
	title: string;
	/** Subtitle or additional context (e.g., connection name) */
	subtitle?: string | ReactNode;
	/** If set, shows a back button that navigates to this path */
	backHref?: string;
	/** Custom back handler (overrides backHref navigation) */
	onBack?: () => void;
	/** Action buttons displayed on the right side of the header */
	actions?: ReactNode;
	/** Tab configuration for dashboard-style pages */
	tabs?: TabConfig[];
	/** Active tab key (when using tabs) */
	activeTab?: string;
	/** Callback when tab changes */
	onTabChange?: (tab: string) => void;
	/** Extra floating actions when layout is hidden (e.g., filter buttons) */
	floatingActions?: ReactNode;
}

export interface TabConfig {
	key: string;
	label: string;
	icon?: ReactNode;
}

interface HeaderState {
	headerConfig: HeaderConfig | null;
	setHeaderConfig: (config: HeaderConfig | null) => void;
}

export const useHeaderStore = create<HeaderState>()(set => ({
	headerConfig: null,
	setHeaderConfig: config => set({ headerConfig: config }),
}));
