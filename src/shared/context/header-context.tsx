"use client";

import { type ReactNode, createContext, useContext, useState } from "react";

export interface TabConfig {
	key: string;
	label: string;
	icon?: ReactNode;
}

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

// Split context to prevent re-renders in consumers that only set config
const HeaderStateContext = createContext<HeaderConfig | null>(null);
const HeaderDispatchContext = createContext<
	((config: HeaderConfig | null) => void) | null
>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
	const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);

	return (
		<HeaderDispatchContext.Provider value={setHeaderConfig}>
			<HeaderStateContext.Provider value={headerConfig}>
				{children}
			</HeaderStateContext.Provider>
		</HeaderDispatchContext.Provider>
	);
}

export function useHeaderContext() {
	const headerConfig = useContext(HeaderStateContext);
	const setHeaderConfig = useContext(HeaderDispatchContext);

	// This is the combined hook for backward compatibility within this file if needed,
	// but better to expose granular hooks.
	// However, for PageHeader component, we might want both or just config.
	// For legacy reasons, I removed the old `useHeaderContext` export that returned both,
	// effectively breaking the previous file (layout.tsx) I just wrote using `useHeaderContext`.

	// I should restore `useHeaderContext` to return both, BUT beware that using it will subscribe to updates.

	if (setHeaderConfig === null) {
		throw new Error("useHeaderContext must be used within a HeaderProvider");
	}

	return { headerConfig, setHeaderConfig };
}

export function useHeaderState() {
	const context = useContext(HeaderStateContext);
	// Context can be null (initial state)
	return context;
}

export function useHeaderDispatch() {
	const context = useContext(HeaderDispatchContext);
	if (!context) {
		throw new Error("useHeaderDispatch must be used within a HeaderProvider");
	}
	return context;
}
