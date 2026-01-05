"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ThemeColor } from "~/config/theme-config";
import { useDashboardTabs } from "~/hooks/use-dashboard-tabs";
import { useHeader } from "~/hooks/use-header";
import { useGlobalSettingsStore } from "~/stores/global-settings-store";
import { useThemeStore } from "~/stores/theme-store";
import { api } from "~/trpc/react";

export default function DatabaseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	const dbname = params?.dbname as string;
	const utils = api.useUtils();

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const currentConnection = connections.find(c => c.id === connectionId);

	const handleBack = () => {
		void utils.database.listConnections.invalidate();
		router.push("/home");
	};

	const useConnectionThemeColor = useGlobalSettingsStore(
		state => state.useConnectionThemeColor
	);
	const setOverrideColor = useThemeStore(state => state.setOverrideColor);

	useEffect(() => {
		if (useConnectionThemeColor && currentConnection?.color) {
			setOverrideColor(currentConnection.color as ThemeColor);
		} else {
			setOverrideColor(null);
		}
		return () => setOverrideColor(null);
	}, [useConnectionThemeColor, currentConnection?.color, setOverrideColor]);

	// Listen for "/" key to focus database selector
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === "/" &&
				document.activeElement?.tagName !== "INPUT" &&
				document.activeElement?.tagName !== "TEXTAREA"
			) {
				event.preventDefault();
				// TODO: Implement focus on database selector
				console.log("Focus database selector");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Determine active tab from pathname
	const getActiveTab = () => {
		if (pathname.includes("/query")) return "query";
		if (pathname.includes("/info")) return "info";
		if (pathname.includes("/settings")) return "settings";
		if (pathname.includes("/tables")) return "tables";
		return "tables";
	};

	const activeTab = getActiveTab();

	// Check if we're on a detail page (table detail, query editor, query show)
	// These pages define their own headers
	const isDetailPage =
		(pathname.match(/\/home\/[^/]+\/[^/]+$/) &&
			!pathname.includes("/tables") &&
			!pathname.includes("/query") &&
			!pathname.includes("/info") &&
			!pathname.includes("/settings")) ||
		pathname.includes("/query/new") ||
		pathname.includes("/query/show");

	// Tab configuration for dashboard pages
	const { tabs, handleTabChange } = useDashboardTabs(dbname);

	// Register header for dashboard pages (not detail pages)
	useHeader(
		isDetailPage
			? { title: "" } // Empty config - detail pages register their own
			: {
					title: "Database Inspector",
					subtitle: `Connection: ${
						currentConnection?.name || `ID: ${connectionId}`
					}`,
					onBack: handleBack,
					tabs,
					activeTab,
					onTabChange: handleTabChange,
				}
	);

	// For dashboard pages, wrap children with padding
	// Detail pages handle their own content layout
	if (isDetailPage) {
		return <>{children}</>;
	}

	return <div className="p-6">{children}</div>;
}
