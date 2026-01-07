"use client";

import { DatabaseSelector } from "./database-selector";
import { QuickLinks } from "./quick-links";
import { RecentPages } from "./recent-pages";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";

interface Connection {
	id: number;
	name: string;
	host: string | null;
	database: string | null;
}

interface SidebarProps {
	connections: Connection[];
	selectedConnectionId: number | null;
	currentDbname: string | null;
	onSelectConnection: (id: number) => void;
}

export function Sidebar({
	connections,
	selectedConnectionId,
	currentDbname,
	onSelectConnection,
}: SidebarProps) {
	return (
		<aside className="flex h-screen w-64 flex-col border-sidebar-border border-r bg-sidebar">
			<SidebarHeader />

			<DatabaseSelector
				connections={connections}
				selectedConnectionId={selectedConnectionId}
				onSelect={onSelectConnection}
			/>

			{currentDbname && (
				<>
					<QuickLinks dbname={currentDbname} />
					<div className="mx-4 border-sidebar-border border-t" />
				</>
			)}

			{/* RecentPages fills available space */}
			<div className="flex-1 overflow-hidden">
				<RecentPages />
			</div>

			{/* Footer fixed at bottom */}
			<SidebarFooter />
		</aside>
	);
}

export default Sidebar;
