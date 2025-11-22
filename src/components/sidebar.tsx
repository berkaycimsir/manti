"use client";

import { Database, Plus, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import ToggleThemeButton from "~/components/toggle-theme-button";

interface Connection {
	id: number;
	name: string;
	host: string | null;
	port: number | null;
	database: string | null;
	isActive: boolean | null;
}

interface SidebarProps {
	connections: Connection[];
	selectedConnection: number | null;
	onSelectConnection: (id: number | null) => void;
	onAddConnection: () => void;
}

export default function Sidebar({
	connections,
	selectedConnection,
	onSelectConnection,
	onAddConnection,
}: SidebarProps) {
	return (
		<aside className="flex h-screen w-64 flex-col border-sidebar-border border-r bg-sidebar">
			{/* Logo */}
			<div className="border-sidebar-border border-b p-6">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Image
							src="/manti.png"
							alt="manti PostgreSQL interface"
							width={36}
							height={36}
						/>
						<h1 className="font-bold text-lg text-sidebar-foreground">manti</h1>
					</div>
					<ToggleThemeButton />
				</div>
			</div>

			{/* Connections List */}
			<div className="flex-1 overflow-auto p-4">
				<div className="mb-4">
					<p className="mb-3 font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
						Connections
					</p>
					<Button
						onClick={onAddConnection}
						variant="outline"
						className="w-full justify-start gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
					>
						<Plus className="h-4 w-4" />
						New Connection
					</Button>
				</div>

				<div className="space-y-2">
					{connections.map((connection) => (
						<button
							type="button"
							key={connection.id}
							onClick={() => onSelectConnection(connection.id)}
							className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
								selectedConnection === connection.id
									? "bg-sidebar-primary text-sidebar-primary-foreground"
									: "text-sidebar-foreground hover:bg-sidebar-accent"
							}`}
						>
							<div className="flex items-center gap-2">
								<Database className="h-4 w-4 shrink-0" />
								<div className="min-w-0">
									<p className="truncate font-medium text-sm">
										{connection.name}
									</p>
									<p className="truncate text-xs opacity-75">
										{connection.host}
									</p>
								</div>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Footer */}
			<div className="space-y-2 border-sidebar-border border-t p-4">
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sidebar-foreground text-sm transition-colors hover:bg-sidebar-accent"
				>
					<Settings className="h-4 w-4" />
					Settings
				</button>
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sidebar-foreground text-sm transition-colors hover:bg-sidebar-accent"
				>
					<LogOut className="h-4 w-4" />
					Logout
				</button>
			</div>
		</aside>
	);
}
