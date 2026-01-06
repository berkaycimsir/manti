"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectionSettingsSidebar } from "~/components/database/connection-settings-sidebar";
import { GlobalRulesTab } from "~/components/database/global-rules-tab";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent } from "~/components/ui/tabs";
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
		<div className="container mx-auto max-w-7xl py-6">
			<Tabs defaultValue="general" className="w-full">
				<div className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm lg:flex-row">
					<div className="w-full border-r-0 border-b bg-muted/30 lg:w-[210px] lg:border-r lg:border-b-0">
						<ConnectionSettingsSidebar className="w-full lg:w-full" />
					</div>

					<div className="flex-1 p-6 lg:p-10">
						{/* General Tab */}
						<TabsContent value="general" className="mt-0 space-y-6">
							<div>
								<h3 className="font-semibold text-lg">General</h3>
								<p className="text-muted-foreground text-sm">
									Display and interface preferences
								</p>
							</div>
							<Separator />

							<div className="space-y-6">
								<div className="grid gap-6 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="name">Connection Name</Label>
										<Input
											id="name"
											value={name}
											onChange={e => setName(e.target.value)}
											placeholder="My Database"
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
											<SelectTrigger>
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

									<div className="flex items-center justify-between rounded-lg border p-3">
										<div className="space-y-0.5">
											<Label className="text-sm">Use Connection Color</Label>
											<p className="line-clamp-1 text-muted-foreground text-xs">
												Apply this color to app theme.
											</p>
										</div>
										<Switch
											checked={useConnectionThemeColor}
											onCheckedChange={setUseConnectionThemeColor}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Execution Tab */}
						<TabsContent value="execution" className="mt-0 space-y-6">
							<div>
								<h3 className="font-semibold text-lg">Execution</h3>
								<p className="text-muted-foreground text-sm">
									Query runtime limits
								</p>
							</div>
							<Separator />

							<div className="grid gap-6 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="timeout">Query Timeout (seconds)</Label>
									<Input
										id="timeout"
										type="number"
										min={1}
										max={3600}
										value={queryTimeoutSeconds}
										onChange={e =>
											setQueryTimeoutSeconds(
												Number.parseInt(e.target.value) || 60
											)
										}
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
										<SelectTrigger>
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
							</div>
						</TabsContent>

						{/* Safety Tab */}
						<TabsContent value="safety" className="mt-0 space-y-6">
							<div>
								<h3 className="font-semibold text-lg">Safety</h3>
								<p className="text-muted-foreground text-sm">
									Protection settings
								</p>
							</div>
							<Separator />

							<div className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<Label>Read-only Mode</Label>
										<p className="text-muted-foreground text-xs">
											Block INSERT, UPDATE, DELETE queries.
										</p>
									</div>
									<Switch
										checked={isReadOnly}
										onCheckedChange={setIsReadOnly}
									/>
								</div>
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<Label>Confirm Destructive</Label>
										<p className="text-muted-foreground text-xs">
											Show warning before DROP/TRUNCATE.
										</p>
									</div>
									<Switch
										checked={confirmDestructive}
										onCheckedChange={setConfirmDestructive}
									/>
								</div>
							</div>
						</TabsContent>

						{/* Network Tab */}
						<TabsContent value="network" className="mt-0 space-y-6">
							<div>
								<h3 className="font-semibold text-lg">Network</h3>
								<p className="text-muted-foreground text-sm">
									Connection options
								</p>
							</div>
							<Separator />

							<div className="space-y-6">
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
												setKeepAliveSeconds(
													Number.parseInt(e.target.value) || 0
												)
											}
											className="max-w-[200px]"
										/>
									</div>
									<p className="text-muted-foreground text-xs">
										Ping interval (0 = disabled).
									</p>
								</div>

								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<Label>Auto-reconnect</Label>
										<p className="text-muted-foreground text-xs">
											Automatically reconnect on connection loss.
										</p>
									</div>
									<Switch
										checked={autoReconnect}
										onCheckedChange={setAutoReconnect}
									/>
								</div>
							</div>
						</TabsContent>

						{/* Global Rules Tab */}
						<TabsContent value="global-rules" className="mt-0 space-y-6">
							<GlobalRulesTab connectionId={connectionId} />
						</TabsContent>
					</div>
				</div>
			</Tabs>
		</div>
	);
}
