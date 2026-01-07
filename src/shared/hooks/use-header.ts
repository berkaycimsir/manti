"use client";

import {
	type HeaderConfig,
	useHeaderDispatch,
} from "@shared/context/header-context";
import { useLayoutEffect } from "react";

/**
 * Hook for pages to register their header configuration
 * The header will be rendered by the layout, not the page itself
 *
 * Note: We intentionally don't clear the header on unmount because
 * parent layouts may have their own useHeader that should take over.
 * Each page/layout just overrides the previous config.
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
	const setHeaderConfig = useHeaderDispatch();

	// Sync config immediately to prevent flash of missing header
	useLayoutEffect(() => {
		setHeaderConfig(config);
	}, [
		// We can't really depend on deep equality of config object
		// But passing specific fields helps prevent loop if config is created in render
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
}

// Re-export types
export type { HeaderConfig, TabConfig } from "@shared/context/header-context";
