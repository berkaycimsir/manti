"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { THEME_COLORS } from "~/config/theme-config";
import { useDashboardTabs } from "~/hooks/use-dashboard-tabs";
import { useHeader } from "~/hooks/use-header";
import { useGlobalSettingsStore } from "~/stores/global-settings-store";
import { api } from "~/trpc/react";

export default function ConnectionSettingsPage() {
	const params = useParams();
	const dbname = params?.dbname as string;
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	const utils = api.useUtils();
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const connection = connections.find(c => c.id === connectionId);

	const { data: schemas = [] } = api.database.getSchemas.useQuery(
		{ connectionId },
		{ enabled: connectionId > 0 }
	);

	const updateMutation = api.database.updateConnection.useMutation({
		onSuccess: () => {
			utils.database.listConnections.invalidate();
		},
	});

	// Global settings
	const { useConnectionThemeColor, setUseConnectionThemeColor } =
		useGlobalSettingsStore();

	// Form state
	const [name, setName] = useState("");
	const [color, setColor] = useState("blue");
	const [defaultSchema, setDefaultSchema] = useState<string | null>(null);
	const [queryTimeoutSeconds, setQueryTimeoutSeconds] = useState(60);
	const [rowLimit, setRowLimit] = useState(500);
	const [isReadOnly, setIsReadOnly] = useState(false);
	const [confirmDestructive, setConfirmDestructive] = useState(true);
	const [keepAliveSeconds, setKeepAliveSeconds] = useState(0);
	const [autoReconnect, setAutoReconnect] = useState(true);

	// Load values when connection data arrives
	useEffect(() => {
		if (connection) {
			setName(connection.name);
			setColor(connection.color || "blue");
			setDefaultSchema(connection.defaultSchema || null);
			setQueryTimeoutSeconds(connection.queryTimeoutSeconds || 60);
			setRowLimit(connection.rowLimit || 500);
			setIsReadOnly(connection.isReadOnly || false);
			setConfirmDestructive(connection.confirmDestructive !== false);
			setKeepAliveSeconds(connection.keepAliveSeconds || 0);
			setAutoReconnect(connection.autoReconnect !== false);
		}
	}, [connection]);

	const handleSave = async () => {
		await updateMutation.mutateAsync({
			id: connectionId,
			name,
			color,
			defaultSchema,
			queryTimeoutSeconds,
			rowLimit,
			isReadOnly,
			confirmDestructive,
			keepAliveSeconds,
			autoReconnect,
		});
	};

	// Get shared tabs configuration
	const { tabs, handleTabChange } = useDashboardTabs(dbname);

	// Register header actions
	useHeader({
		title: "Connection Settings",
		subtitle: connection?.name || "Configure database connection",
		tabs,
		activeTab: "settings",
		onTabChange: handleTabChange,
		actions: (
			<Button
				onClick={() => handleSave()}
				disabled={updateMutation.isPending}
				size="sm"
				className="gap-2"
			>
				{updateMutation.isPending && (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				)}
				Save Changes
			</Button>
		),
	});

	if (!connection) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8 pb-10">
			{/* General Settings */}
			<section className="space-y-4">
				<div className="flex items-center justify-between border-b pb-2">
					<h3 className="font-semibold text-lg tracking-tight">General</h3>
					<p className="text-muted-foreground text-sm">
						Display and interface preferences
					</p>
				</div>
				<Card className="border-border/50 shadow-sm">
					<CardContent className="grid gap-6 p-6">
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Connection Name</Label>
								<Input
									id="name"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="My Database"
									className="border-border/50 bg-background/50"
								/>
							</div>
							<div className="space-y-2">
								<Label>Connection Color</Label>
								<div className="flex flex-wrap gap-2">
									{THEME_COLORS.map(c => (
										<button
											key={c.value}
											type="button"
											onClick={() => setColor(c.value)}
											className={`h-9 w-9 rounded-full ${c.class} ring-2 ring-offset-2 ring-offset-background transition-all hover:scale-105 ${
												color === c.value
													? "scale-105 shadow-md ring-primary"
													: "ring-transparent hover:ring-muted-foreground/30"
											}`}
											title={c.label}
										/>
									))}
								</div>
							</div>
						</div>

						<div className="grid gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Default Schema</Label>
								<Select
									value={defaultSchema || "_none"}
									onValueChange={v =>
										setDefaultSchema(v === "_none" ? null : v)
									}
								>
									<SelectTrigger className="border-border/50 bg-background/50">
										<SelectValue placeholder="No default schema" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="_none">No default schema</SelectItem>
										{schemas.map(s => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									Default search path for queries.
								</p>
							</div>

							<div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3">
								<div className="space-y-0.5">
									<Label className="text-sm">Use Connection Color</Label>
									<p className="line-clamp-1 text-muted-foreground text-xs">
										Apply this color to the app theme.
									</p>
								</div>
								<Switch
									checked={useConnectionThemeColor}
									onCheckedChange={setUseConnectionThemeColor}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Query Behavior */}
			<section className="space-y-4">
				<div className="flex items-center justify-between border-b pb-2">
					<h3 className="font-semibold text-lg tracking-tight">Execution</h3>
					<p className="text-muted-foreground text-sm">Query runtime limits</p>
				</div>
				<Card className="border-border/50 shadow-sm">
					<CardContent className="grid gap-6 p-6 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="timeout">Query Timeout (seconds)</Label>
							<Input
								id="timeout"
								type="number"
								min={1}
								max={3600}
								value={queryTimeoutSeconds}
								onChange={e =>
									setQueryTimeoutSeconds(Number.parseInt(e.target.value) || 60)
								}
								className="border-border/50 bg-background/50"
							/>
							<p className="text-muted-foreground text-xs">
								Hard limit on query execution time.
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="rowLimit">Table View Limit</Label>
							<Select
								value={String(rowLimit)}
								onValueChange={v => setRowLimit(Number.parseInt(v))}
							>
								<SelectTrigger className="border-border/50 bg-background/50">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="100">100 rows</SelectItem>
									<SelectItem value="500">500 rows</SelectItem>
									<SelectItem value="1000">1,000 rows</SelectItem>
									<SelectItem value="5000">5,000 rows</SelectItem>
									<SelectItem value="10000">10,000 rows</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-muted-foreground text-xs">
								Initial row count for table data.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Safety & Connection */}
			<div className="grid gap-8 md:grid-cols-2">
				{/* Safety */}
				<section className="space-y-4">
					<div className="flex items-center justify-between border-b pb-2">
						<h3 className="font-semibold text-lg tracking-tight">Safety</h3>
					</div>
					<Card className="h-full border-border/50 shadow-sm">
						<CardContent className="space-y-6 p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Read-only Mode</Label>
									<p className="text-muted-foreground text-xs">
										Block INSERT, UPDATE, DELETE.
									</p>
								</div>
								<Switch checked={isReadOnly} onCheckedChange={setIsReadOnly} />
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Confirm Destructive</Label>
									<p className="text-muted-foreground text-xs">
										Warn before DROP/TRUNCATE.
									</p>
								</div>
								<Switch
									checked={confirmDestructive}
									onCheckedChange={setConfirmDestructive}
								/>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* Connection */}
				<section className="space-y-4">
					<div className="flex items-center justify-between border-b pb-2">
						<h3 className="font-semibold text-lg tracking-tight">Network</h3>
					</div>
					<Card className="h-full border-border/50 shadow-sm">
						<CardContent className="space-y-6 p-6">
							<div className="space-y-2">
								<Label htmlFor="keepAlive">Keep-alive (seconds)</Label>
								<div className="flex gap-4">
									<Input
										id="keepAlive"
										type="number"
										min={0}
										max={3600}
										value={keepAliveSeconds}
										onChange={e =>
											setKeepAliveSeconds(Number.parseInt(e.target.value) || 0)
										}
										className="border-border/50 bg-background/50"
									/>
									<div className="flex flex-col justify-center">
										<Label className="text-xs">Auto-reconnect</Label>
										<Switch
											className="mt-1"
											checked={autoReconnect}
											onCheckedChange={setAutoReconnect}
										/>
									</div>
								</div>
								<p className="text-muted-foreground text-xs">
									Ping interval and reconnection strategy.
								</p>
							</div>
						</CardContent>
					</Card>
				</section>
			</div>
		</div>
	);
}
