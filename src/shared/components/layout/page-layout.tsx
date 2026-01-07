"use client";

import {
	type HeaderConfig,
	type TabConfig,
	useHeaderDispatch,
} from "@shared/context/header-context";
import { type ReactNode, useLayoutEffect } from "react";

export interface PageLayoutProps {
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
	/** Page content */
	children: ReactNode;
}

/**
 * PageLayout provides an explicit, prop-based way to configure page headers.
 *
 * This is an alternative to the useHeader() hook pattern which requires
 * imperative calls that are easy to forget.
 *
 * @example
 * ```tsx
 * export default function TablesPage() {
 *   return (
 *     <PageLayout
 *       title="Tables"
 *       subtitle="database-name"
 *       actions={<Button>Export</Button>}
 *     >
 *       <TableList />
 *     </PageLayout>
 *   );
 * }
 * ```
 */
export function PageLayout({
	title,
	subtitle,
	backHref,
	onBack,
	actions,
	tabs,
	activeTab,
	onTabChange,
	floatingActions,
	children,
}: PageLayoutProps) {
	const setHeaderConfig = useHeaderDispatch();

	// Sync header config on mount and when props change
	useLayoutEffect(() => {
		const config: HeaderConfig = {
			title,
			subtitle,
			backHref,
			onBack,
			actions,
			tabs,
			activeTab,
			onTabChange,
			floatingActions,
		};
		setHeaderConfig(config);

		// Clear header config on unmount
		return () => {
			setHeaderConfig(null);
		};
	}, [
		title,
		subtitle,
		backHref,
		onBack,
		actions,
		tabs,
		activeTab,
		onTabChange,
		floatingActions,
		setHeaderConfig,
	]);

	return <>{children}</>;
}
