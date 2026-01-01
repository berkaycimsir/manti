"use client";

import { useEffect, useLayoutEffect } from "react";
import { type HeaderConfig, useHeaderStore } from "~/stores/header-store";

/**
 * Hook for pages to register their header configuration
 * The header will be rendered by the layout, not the page itself
 *
 * @example
 * useHeader({
 *   title: "Edit Query",
 *   subtitle: `Connection: ${connectionName}`,
 *   backHref: `/home/${dbname}/query`,
 *   actions: <Button>Run</Button>
 * });
 */
export function useHeader(config: HeaderConfig) {
	const setHeaderConfig = useHeaderStore((state) => state.setHeaderConfig);

	// Sync config immediately to prevent flash of missing header
	useLayoutEffect(() => {
		setHeaderConfig(config);
	}, [
		config.title,
		config.subtitle,
		config.backHref,
		config.onBack,
		config.actions,
		config.floatingActions,
		config.tabs,
		config.activeTab,
		setHeaderConfig,
	]);

	// Clear header when unmounting
	useEffect(() => {
		return () => {
			setHeaderConfig(null);
		};
	}, [setHeaderConfig]);
}

// Re-export types
export type { HeaderConfig, TabConfig } from "~/stores/header-store";
