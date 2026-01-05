"use client";

import { Database, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { isLocalConnection, isProduction } from "~/lib/utils";

interface Connection {
	id: number;
	name: string;
	host: string | null;
	database: string | null;
}

interface DatabaseSelectorProps {
	connections: Connection[];
	selectedConnectionId: number | null;
	onSelect: (id: number) => void;
}

export function DatabaseSelector({
	connections,
	selectedConnectionId,
	onSelect,
}: DatabaseSelectorProps) {
	const router = useRouter();
	const selectedConnection = connections.find(
		c => c.id === selectedConnectionId
	);

	const handleValueChange = (value: string) => {
		if (value === "manage") {
			router.push("/home");
			return;
		}
		const id = Number.parseInt(value, 10);
		if (!Number.isNaN(id)) {
			onSelect(id);
		}
	};

	return (
		<div className="p-4">
			<p className="mb-2 font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
				Database
			</p>
			<Select
				value={selectedConnectionId?.toString() ?? ""}
				onValueChange={handleValueChange}
			>
				<SelectTrigger className="w-full border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent">
					<div className="flex items-center gap-2">
						<Database className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
						<SelectValue placeholder="Select database">
							{selectedConnection?.name ?? "Select database"}
						</SelectValue>
					</div>
				</SelectTrigger>
				<SelectContent>
					{connections.map(connection => {
						const isRestricted =
							isProduction() && isLocalConnection(connection.host);
						return (
							<SelectItem
								key={connection.id}
								value={connection.id.toString()}
								disabled={isRestricted}
							>
								<div className="flex flex-col">
									<div className="flex items-center gap-2">
										<span className="font-medium">{connection.name}</span>
										{isRestricted && (
											<span className="rounded bg-destructive/10 px-1 py-0.5 text-[10px] text-destructive uppercase">
												Local Only
											</span>
										)}
									</div>
									{connection.host && (
										<span className="block max-w-[150px] truncate font-mono text-muted-foreground text-xs">
											{connection.host}
										</span>
									)}
								</div>
							</SelectItem>
						);
					})}
					<SelectSeparator />
					<SelectItem value="manage" className="text-primary">
						<div className="flex items-center gap-2">
							<Settings2 className="h-4 w-4" />
							Manage Connections
						</div>
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
