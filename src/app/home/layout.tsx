"use client";

import { ArrowLeft, PanelLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "~/components/sidebar";
import ToggleThemeButton from "~/components/toggle-theme-button";
import { Button } from "~/components/ui/button";
import { useHeaderStore } from "~/stores/header-store";
import { useLayoutStore } from "~/stores/layout-store";
import { useSidebarStore } from "~/stores/sidebar-store";
import { api } from "~/trpc/react";

/**
 * PageHeader component that renders the header based on Zustand store
 */
function PageHeader() {
	const router = useRouter();
	const headerConfig = useHeaderStore(state => state.headerConfig);
	const isLayoutVisible = useLayoutStore(state => state.isLayoutVisible);

	// No header config registered - page handles its own header or none needed
	if (!headerConfig) {
		return null;
	}

	const handleBack = () => {
		if (headerConfig.onBack) {
			headerConfig.onBack();
		} else if (headerConfig.backHref) {
			router.push(headerConfig.backHref);
		}
	};

	// When layout is hidden, only show floating actions if defined
	if (!isLayoutVisible) {
		return headerConfig.floatingActions ? (
			<div className="fixed top-4 left-16 z-40 flex items-center gap-2">
				{headerConfig.floatingActions}
			</div>
		) : null;
	}

	return (
		<div className="sticky top-0 z-10 border-border border-b bg-card">
			<div className="flex items-center justify-between p-6">
				{/* Left side: Back button + Title */}
				<div className="flex items-center gap-4">
					{(headerConfig.backHref || headerConfig.onBack) && (
						<button
							type="button"
							onClick={handleBack}
							className="rounded-lg p-2 transition-colors hover:bg-muted"
						>
							<ArrowLeft className="h-5 w-5 text-muted-foreground" />
						</button>
					)}
					<div>
						<h1 className="font-bold text-2xl text-foreground">
							{headerConfig.title}
						</h1>
						{headerConfig.subtitle && (
							<div className="text-muted-foreground text-sm">
								{headerConfig.subtitle}
							</div>
						)}
					</div>
				</div>

				{/* Right side: Theme toggle + Actions */}
				<div className="flex items-center gap-2">
					<ToggleThemeButton />
					{headerConfig.actions}
				</div>
			</div>

			{/* Tab Navigation (if tabs defined) */}
			{headerConfig.tabs && headerConfig.tabs.length > 0 && (
				<div className="flex gap-1 px-6 pb-4">
					{headerConfig.tabs.map(tab => (
						<button
							key={tab.key}
							type="button"
							onClick={() => headerConfig.onTabChange?.(tab.key)}
							className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors ${
								headerConfig.activeTab === tab.key
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							{tab.icon}
							{tab.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

/**
 * Main content wrapper that handles padding when layout is hidden
 */
function ContentWrapper({ children }: { children: React.ReactNode }) {
	const headerConfig = useHeaderStore(state => state.headerConfig);
	const isLayoutVisible = useLayoutStore(state => state.isLayoutVisible);

	// Apply top padding when layout is hidden to avoid overlap with floating button
	// Only apply if there's a header config (page wants header behavior)
	const needsPadding = !isLayoutVisible && headerConfig;

	return (
		<div
			className={`relative w-full flex-1 overflow-auto ${
				needsPadding ? "pt-16" : ""
			}`}
		>
			{children}
		</div>
	);
}

export default function HomeLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const isLayoutVisible = useLayoutStore(state => state.isLayoutVisible);
	const showLayout = useLayoutStore(state => state.showLayout);

	// Fetch connections for sidebar
	const { data: connections = [] } = api.database.listConnections.useQuery();

	// Extract connection ID and dbname from pathname if on a db/table page
	const getConnectionInfo = (): {
		connectionId: number | null;
		dbname: string | null;
	} => {
		const match = pathname.match(/\/home\/([^/]+)/);
		if (match?.[1]) {
			const dbname = match[1];
			const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);
			return { connectionId: connectionId > 0 ? connectionId : null, dbname };
		}
		return { connectionId: null, dbname: null };
	};

	const { connectionId: selectedConnectionId, dbname: currentDbname } =
		getConnectionInfo();

	// Track page visits for recent pages (basic tracking - pages can override with useRecentPage)
	const addRecentPage = useSidebarStore(state => state.addRecentPage);

	useEffect(() => {
		if (!pathname || pathname === "/home" || !currentDbname) return;

		// Determine page title and icon based on path (basic fallback)
		const getPageInfo = (): {
			title: string;
			subtitle?: string;
			icon: string;
		} | null => {
			if (pathname.includes("/query/new")) {
				return { title: "New Query", subtitle: "Create", icon: "Code" };
			}
			// query/edit and query/show pages use useRecentPage hook for specific query name
			if (
				pathname.includes("/query/edit") ||
				pathname.includes("/query/show")
			) {
				return null; // Let page handle with specific title
			}
			if (pathname.includes("/query")) {
				return { title: "Saved Queries", icon: "Code" };
			}
			if (pathname.includes("/tables")) {
				return { title: "Tables", icon: "Table" };
			}
			if (pathname.includes("/info")) {
				return { title: "Database Info", icon: "Info" };
			}
			if (pathname.includes("/settings")) {
				return { title: "Settings", icon: "Settings" };
			}
			// Table view - extract table name
			const tableMatch = pathname.match(/\/home\/[^/]+\/([^/]+)$/);
			if (
				tableMatch?.[1] &&
				!["tables", "query", "info", "settings"].includes(tableMatch[1])
			) {
				return { title: tableMatch[1], subtitle: "Table", icon: "Table" };
			}
			return null;
		};

		const pageInfo = getPageInfo();
		if (pageInfo) {
			addRecentPage({
				path: pathname,
				title: pageInfo.title,
				subtitle: pageInfo.subtitle,
				icon: pageInfo.icon,
				dbname: currentDbname,
			});
		}
	}, [pathname, currentDbname, addRecentPage]);

	const handleSelectConnection = (id: number) => {
		if (id > 0) {
			const conn = connections.find(c => c.id === id);
			if (conn) {
				router.push(
					`/home/${conn.name.toLowerCase().replace(/\s+/g, "-")}-${id}/tables`
				);
			}
		}
	};

	return (
		<div className="relative flex h-screen bg-background">
			{/* Sidebar */}
			{isLayoutVisible && (
				<Sidebar
					connections={connections}
					selectedConnectionId={selectedConnectionId}
					currentDbname={currentDbname}
					onSelectConnection={handleSelectConnection}
				/>
			)}

			{/* Show Layout Button (when hidden) */}
			{!isLayoutVisible && (
				<div className="fixed top-4 left-4 z-50">
					<Button
						variant="outline"
						size="icon"
						onClick={showLayout}
						className="h-9 w-9 bg-background shadow-md"
						title="Show Sidebar"
					>
						<PanelLeft className="h-5 w-5" />
					</Button>
				</div>
			)}

			{/* Main Content Area */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Dynamic Header Slot */}
				<PageHeader />

				{/* Page Content */}
				<ContentWrapper>{children}</ContentWrapper>
			</div>
		</div>
	);
}
