"use client";

import { Code, Eye, Table } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { type TabConfig, useHeader } from "~/hooks/use-header";
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
	const currentConnection = connections.find((c) => c.id === connectionId);

	const handleBack = () => {
		void utils.database.listConnections.invalidate();
		router.push("/home");
	};

	// Determine active tab from pathname
	const getActiveTab = () => {
		if (pathname.includes("/query")) return "query";
		if (pathname.includes("/info")) return "info";
		if (pathname.includes("/tables")) return "tables";
		return "tables";
	};

	const activeTab = getActiveTab();

	const handleTabChange = (tab: string) => {
		if (tab === "tables") {
			router.push(`/home/${dbname}/tables`);
		} else if (tab === "query") {
			router.push(`/home/${dbname}/query`);
		} else if (tab === "info") {
			router.push(`/home/${dbname}/info`);
		}
	};

	// Check if we're on a detail page (table detail, query editor, query show)
	// These pages define their own headers
	const isDetailPage =
		(pathname.match(/\/home\/[^/]+\/[^/]+$/) &&
			!pathname.includes("/tables") &&
			!pathname.includes("/query") &&
			!pathname.includes("/info")) ||
		pathname.includes("/query/new") ||
		pathname.includes("/query/show");

	// Tab configuration for dashboard pages
	const tabs: TabConfig[] = useMemo(
		() => [
			{ key: "tables", label: "Tables", icon: <Table className="h-4 w-4" /> },
			{ key: "query", label: "Query", icon: <Code className="h-4 w-4" /> },
			{ key: "info", label: "Info", icon: <Eye className="h-4 w-4" /> },
		],
		[],
	);

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
				},
	);

	// For dashboard pages, wrap children with padding
	// Detail pages handle their own content layout
	if (isDetailPage) {
		return <>{children}</>;
	}

	return <div className="p-6">{children}</div>;
}
