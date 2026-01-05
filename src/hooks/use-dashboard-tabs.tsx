"use client";

import { Code, Eye, Settings, Table } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { TabConfig } from "~/stores/header-store";

export function useDashboardTabs(dbname: string) {
	const router = useRouter();

	const tabs: TabConfig[] = useMemo(
		() => [
			{ key: "tables", label: "Tables", icon: <Table className="h-4 w-4" /> },
			{ key: "query", label: "Query", icon: <Code className="h-4 w-4" /> },
			{ key: "info", label: "Info", icon: <Eye className="h-4 w-4" /> },
			{
				key: "settings",
				label: "Settings",
				icon: <Settings className="h-4 w-4" />,
			},
		],
		[]
	);

	const handleTabChange = (tab: string) => {
		if (tab === "tables") {
			router.push(`/home/${dbname}/tables`);
		} else if (tab === "query") {
			router.push(`/home/${dbname}/query`);
		} else if (tab === "info") {
			router.push(`/home/${dbname}/info`);
		} else if (tab === "settings") {
			router.push(`/home/${dbname}/settings`);
		}
	};

	return { tabs, handleTabChange };
}
