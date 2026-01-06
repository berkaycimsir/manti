"use client";

import { AlertCircle, CheckCircle2, Loader2, PlugZap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

interface ConnectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (connection: any) => void;
	initialData?: any;
}

type TestStatus = "idle" | "testing" | "success" | "failed";

export default function ConnectionModal({
	isOpen,
	onClose,
	onSubmit,
	initialData,
}: ConnectionModalProps) {
	const isEditing = !!initialData;
	const [activeTab, setActiveTab] = useState("manual");
	const [testStatus, setTestStatus] = useState<TestStatus>("idle");
	const [testMessage, setTestMessage] = useState("");
	const [testLatency, setTestLatency] = useState<number | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		host: "localhost",
		port: 5432,
		database: "",
		username: "",
		password: "",
		connectionString: "",
		sslMode: "disable" as "disable" | "prefer" | "require" | "verify-full",
	});

	const testConnectionMutation =
		api.database.testConnectionCredentials.useMutation();

	useEffect(() => {
		if (isOpen) {
			// Reset test status when modal opens
			setTestStatus("idle");
			setTestMessage("");
			setTestLatency(null);

			if (initialData) {
				setFormData({
					name: initialData.name || "",
					host: initialData.host || "localhost",
					port: initialData.port || 5432,
					database: initialData.database || "",
					username: initialData.username || "",
					password: "", // Don't populate password
					connectionString: "", // Don't populate encrypted string
					sslMode: initialData.sslMode || "disable",
				});
				if (initialData.connectionType) {
					setActiveTab(
						initialData.connectionType === "connection_string"
							? "connection-string"
							: "manual"
					);
				}
			} else {
				// Reset for new connection
				setFormData({
					name: "",
					host: "localhost",
					port: 5432,
					database: "",
					username: "",
					password: "",
					connectionString: "",
					sslMode: "disable",
				});
				setActiveTab("manual");
			}
		}
	}, [isOpen, initialData]);

	// Reset test status when form data changes
	useEffect(() => {
		if (testStatus !== "idle") {
			setTestStatus("idle");
			setTestMessage("");
			setTestLatency(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData, activeTab]);

	const handleTestConnection = async () => {
		setTestStatus("testing");
		setTestMessage("");
		setTestLatency(null);

		try {
			const input =
				activeTab === "manual"
					? {
							connectionType: "manual" as const,
							name: formData.name || "Test",
							host: formData.host,
							port: formData.port,
							database: formData.database,
							username: formData.username,
							password: formData.password,
							ssl: formData.sslMode !== "disable",
							sslMode: formData.sslMode,
						}
					: {
							connectionType: "connection_string" as const,
							name: formData.name || "Test",
							connectionString: formData.connectionString,
						};

			const result = await testConnectionMutation.mutateAsync(input);

			if (result.success) {
				setTestStatus("success");
				setTestMessage(result.message);
				setTestLatency(result.latencyMs);
			} else {
				setTestStatus("failed");
				setTestMessage(result.message);
				setTestLatency(result.latencyMs);
			}
		} catch (error) {
			setTestStatus("failed");
			setTestMessage(
				error instanceof Error ? error.message : "Connection test failed"
			);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (activeTab === "manual") {
			onSubmit({
				name: formData.name,
				connectionType: "manual",
				host: formData.host,
				port: formData.port,
				database: formData.database,
				username: formData.username,
				password: formData.password || undefined, // Send undefined if empty (no update)
				ssl: formData.sslMode !== "disable",
				sslMode: formData.sslMode,
			});
		} else {
			onSubmit({
				name: formData.name,
				connectionType: "connection_string",
				connectionString: formData.connectionString || undefined,
			});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Connection" : "New Connection"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update your database connection settings."
							: "Add a new PostgreSQL database connection."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="conn-name">Connection Name</Label>
						<Input
							id="conn-name"
							placeholder="My Database"
							value={formData.name}
							onChange={e => setFormData({ ...formData, name: e.target.value })}
							required
						/>
					</div>

					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="manual">Manual</TabsTrigger>
							<TabsTrigger value="connection-string">
								Connection String
							</TabsTrigger>
						</TabsList>

						<TabsContent value="manual" className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="host">Host</Label>
									<Input
										id="host"
										placeholder="localhost"
										value={formData.host}
										onChange={e =>
											setFormData({ ...formData, host: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="port">Port</Label>
									<Input
										id="port"
										type="number"
										placeholder="5432"
										value={formData.port}
										onChange={e =>
											setFormData({
												...formData,
												port: Number.parseInt(e.target.value),
											})
										}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="database">Database</Label>
								<Input
									id="database"
									placeholder="postgres"
									value={formData.database}
									onChange={e =>
										setFormData({ ...formData, database: e.target.value })
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="username">Username</Label>
								<Input
									id="username"
									placeholder="postgres"
									value={formData.username}
									onChange={e =>
										setFormData({ ...formData, username: e.target.value })
									}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder={isEditing ? "(Unchanged)" : "••••••••"}
									value={formData.password}
									onChange={e =>
										setFormData({ ...formData, password: e.target.value })
									}
									required={!isEditing}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="sslMode">SSL Mode</Label>
								<Select
									value={formData.sslMode}
									onValueChange={value =>
										setFormData({
											...formData,
											sslMode: value as typeof formData.sslMode,
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="disable">Disable - No SSL</SelectItem>
										<SelectItem value="prefer">
											Prefer - Use SSL if available
										</SelectItem>
										<SelectItem value="require">
											Require - Always use SSL
										</SelectItem>
										<SelectItem value="verify-full">
											Verify Full - SSL with certificate verification
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</TabsContent>

						<TabsContent value="connection-string" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="conn-string">Connection String</Label>
								<Input
									id="conn-string"
									type="password"
									placeholder={
										isEditing
											? "(Unchanged)"
											: "postgresql://user:password@localhost:5432/database"
									}
									value={formData.connectionString}
									onChange={e =>
										setFormData({
											...formData,
											connectionString: e.target.value,
										})
									}
									required={!isEditing}
								/>
								<p className="text-muted-foreground text-xs">
									Enter your PostgreSQL connection string.
								</p>
							</div>
						</TabsContent>
					</Tabs>

					{/* Test Connection Result */}
					{testStatus !== "idle" && (
						<div
							className={`flex items-center gap-3 rounded-lg border p-3 ${
								testStatus === "success"
									? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
									: testStatus === "failed"
										? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
										: "border-muted bg-muted/50"
							}`}
						>
							{testStatus === "testing" && (
								<>
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										Testing connection...
									</span>
								</>
							)}
							{testStatus === "success" && (
								<>
									<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
									<div className="flex-1">
										<p className="font-medium text-green-700 text-sm dark:text-green-300">
											{testMessage}
										</p>
										{testLatency && (
											<p className="text-green-600 text-xs dark:text-green-400">
												Response time: {testLatency}ms
											</p>
										)}
									</div>
								</>
							)}
							{testStatus === "failed" && (
								<>
									<AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
									<div className="flex-1">
										<p className="font-medium text-red-700 text-sm dark:text-red-300">
											Connection failed
										</p>
										<p className="text-red-600 text-xs dark:text-red-400">
											{testMessage}
										</p>
									</div>
								</>
							)}
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleTestConnection}
							disabled={testStatus === "testing"}
							className="flex-1"
						>
							{testStatus === "testing" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<PlugZap className="mr-2 h-4 w-4" />
							)}
							Test Connection
						</Button>
						<Button type="submit" className="flex-1">
							{isEditing ? "Save Changes" : "Connect"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
