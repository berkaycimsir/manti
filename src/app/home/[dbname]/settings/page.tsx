"use client";

import { Button } from "@shared/components/ui/button";
import { Tabs, TabsContent } from "@shared/components/ui/tabs";
import { useHeader } from "@shared/hooks/use-header";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalRulesTab } from "~/features/column-rules";
import {
	ConnectionSettingsSidebar,
	ExecutionSettingsTab,
	GeneralSettingsTab,
	NetworkSettingsTab,
	SafetySettingsTab,
} from "~/features/connections";
import { useDashboardTabs } from "~/features/saved-queries";
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

	const updateMutation = api.database.updateConnection.useMutation(
		useMutationFactory({
			successMessage: "Connection settings updated",
			onSuccess: () => {
				utils.database.listConnections.invalidate();
			},
		})
	);

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
						<TabsContent value="general" className="mt-0">
							<GeneralSettingsTab
								name={name}
								onNameChange={setName}
								color={color}
								onColorChange={setColor}
								defaultSchema={defaultSchema}
								onDefaultSchemaChange={setDefaultSchema}
								schemas={schemas}
								useConnectionThemeColor={useConnectionThemeColor}
								onUseConnectionThemeColorChange={setUseConnectionThemeColor}
							/>
						</TabsContent>

						<TabsContent value="execution" className="mt-0">
							<ExecutionSettingsTab
								queryTimeoutSeconds={queryTimeoutSeconds}
								onQueryTimeoutChange={setQueryTimeoutSeconds}
								rowLimit={rowLimit}
								onRowLimitChange={setRowLimit}
							/>
						</TabsContent>

						<TabsContent value="safety" className="mt-0">
							<SafetySettingsTab
								isReadOnly={isReadOnly}
								onReadOnlyChange={setIsReadOnly}
								confirmDestructive={confirmDestructive}
								onConfirmDestructiveChange={setConfirmDestructive}
							/>
						</TabsContent>

						<TabsContent value="network" className="mt-0">
							<NetworkSettingsTab
								keepAliveSeconds={keepAliveSeconds}
								onKeepAliveChange={setKeepAliveSeconds}
								autoReconnect={autoReconnect}
								onAutoReconnectChange={setAutoReconnect}
							/>
						</TabsContent>

						<TabsContent value="global-rules" className="mt-0 space-y-6">
							<GlobalRulesTab connectionId={connectionId} />
						</TabsContent>
					</div>
				</div>
			</Tabs>
		</div>
	);
}
