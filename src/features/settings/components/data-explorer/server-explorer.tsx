"use client";

import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import {
	Archive,
	Database,
	Laptop,
	type LucideIcon,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { api } from "~/trpc/react";

interface ServerStatProps {
	label: string;
	count: number;
	icon: LucideIcon;
	onClear: () => void;
	loading: boolean;
}

function ServerStat({
	label,
	count,
	icon: Icon,
	onClear,
	loading,
}: ServerStatProps) {
	return (
		<div className="flex flex-col justify-between bg-card p-4 transition-colors hover:bg-muted/50">
			<div className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
				<Icon className="h-4 w-4" />
				{label}
			</div>
			<div className="mt-4 flex items-end justify-between">
				<span className="font-bold text-2xl tracking-tight">{count}</span>
				{count > 0 && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground opacity-50 hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
						onClick={onClear}
						disabled={loading}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

export function ServerDataExplorer() {
	const utils = api.useUtils();
	const { data: connections, isLoading } =
		api.userData.getDetailedUsage.useQuery();

	const clearConnectionDataMutation =
		api.userData.clearConnectionData.useMutation(
			useMutationFactory({
				successMessage: "Data cleared for connection",
				onSuccess: () => {
					utils.userData.getDetailedUsage.invalidate();
					utils.userData.getSummary.invalidate();
				},
			})
		);

	const handleClear = async (
		connectionId: number,
		type: "queries" | "tabs" | "filters" | "transformations"
	) => {
		if (confirm(`Delete all ${type} for this connection?`)) {
			clearConnectionDataMutation.mutate({ connectionId, type });
		}
	};

	if (isLoading)
		return (
			<div className="flex h-full items-center justify-center p-8">
				<RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);

	if (!connections?.length)
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
				<Database className="h-12 w-12 opacity-20" />
				<p>No cloud data found.</p>
			</div>
		);

	return (
		<ScrollArea className="h-full">
			<div className="grid gap-6 p-6 sm:grid-cols-1 lg:grid-cols-2">
				{connections.map(conn => (
					<div
						key={conn.id}
						className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
					>
						<div className="flex items-center justify-between border-b bg-muted/30 p-4">
							<div className="flex items-center gap-3 font-semibold">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Database className="h-4 w-4" />
								</div>
								{conn.name}
							</div>
							<Badge variant="secondary" className="font-mono text-xs">
								{conn.connectionType}
							</Badge>
						</div>
						<div className="grid flex-1 grid-cols-2 gap-px bg-border p-px">
							<ServerStat
								label="Saved Queries"
								count={conn.stats.queries}
								icon={Archive}
								onClear={() => handleClear(conn.id, "queries")}
								loading={clearConnectionDataMutation.isPending}
							/>
							<ServerStat
								label="Query Tabs"
								count={conn.stats.tabs}
								icon={Laptop}
								onClear={() => handleClear(conn.id, "tabs")}
								loading={clearConnectionDataMutation.isPending}
							/>
							<ServerStat
								label="Column Filters"
								count={conn.stats.filters}
								icon={RefreshCw}
								onClear={() => handleClear(conn.id, "filters")}
								loading={clearConnectionDataMutation.isPending}
							/>
							<ServerStat
								label="Transformations"
								count={conn.stats.transformations}
								icon={RefreshCw}
								onClear={() => handleClear(conn.id, "transformations")}
								loading={clearConnectionDataMutation.isPending}
							/>
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
