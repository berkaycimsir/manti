"use client";

import {
	Database,
	Edit2,
	MoreVertical,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	Unplug,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConnectionModal from "~/components/connection-modal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	ConnectionCardSkeleton,
	ConnectionGridSkeleton,
} from "~/components/ui/content-skeletons";
import { Input } from "~/components/ui/input";
import { useHeader } from "~/hooks/use-header";
import { CONNECTION_CLEANUP_INTERVAL } from "~/lib/constants";
import { formatRelativeTime } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function HomePage() {
	const router = useRouter();
	const [showConnectionModal, setShowConnectionModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const utils = api.useUtils();

	// Set up header
	useHeader({
		title: "Database Connections",
		subtitle: "Manage and inspect your PostgreSQL databases",
		actions: (
			<Button onClick={() => setShowConnectionModal(true)} className="gap-2">
				<Plus className="h-4 w-4" />
				New Connection
			</Button>
		),
	});

	// Fetch connections from API
	const connectionsQuery = api.database.listConnections.useQuery();
	const { data: connections = [], isLoading, refetch } = connectionsQuery;

	// Set up auto-refetch every 5 minutes to catch inactive connections
	useEffect(() => {
		const interval = setInterval(() => {
			void refetch();
		}, CONNECTION_CLEANUP_INTERVAL);

		return () => clearInterval(interval);
	}, [refetch]);

	// Mutation to create connection
	const createConnectionMutation = api.database.createConnection.useMutation({
		onSuccess: () => {
			setShowConnectionModal(false);
			void refetch();
		},
	});

	// Mutation to delete connection
	const deleteConnectionMutation = api.database.deleteConnection.useMutation({
		onSuccess: () => {
			void refetch();
		},
	});

	// Mutation to reconnect
	const reconnectMutation = api.database.reconnectConnection.useMutation({
		onSuccess: () => {
			void refetch();
		},
	});

	// Mutation to close connection
	const closeConnectionMutation = api.database.updateConnection.useMutation({
		onSuccess: () => {
			void utils.database.listConnections.invalidate();
		},
	});

	const filteredConnections = connections.filter(
		(conn: (typeof connections)[number]) =>
			conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(conn.host?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
	);

	const _handleDeleteConnection = (id: number) => {
		deleteConnectionMutation.mutate({ id });
	};

	const handleCloseConnection = (id: number) => {
		closeConnectionMutation.mutate({ id, isActive: false });
	};

	const handleSelectConnection = (id: number | null) => {
		if (!id) return;
		const connection = connections.find((c) => c.id === id);
		if (connection) {
			const dbname = `${connection.name
				.toLowerCase()
				.replace(/\s+/g, "-")}-${id}`;
			router.push(`/home/${dbname}`);
		}
	};

	const handleCreateConnection = async (newConnection: unknown) => {
		createConnectionMutation.mutate(newConnection as never);
	};

	return (
		<>
			<div className="p-8">
				{/* Search */}
				<div className="mb-6 flex gap-4">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						<Input
							placeholder="Search connections..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				{/* Connections Grid */}
				{isLoading ? (
					<ConnectionGridSkeleton cards={6} />
				) : filteredConnections.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredConnections.map((connection) => (
							<ConnectionCard
								key={connection.id}
								connection={
									connection as unknown as React.ComponentProps<
										typeof ConnectionCard
									>["connection"]
								}
								onSelect={handleSelectConnection}
								onReconnect={() =>
									reconnectMutation.mutate({ id: connection.id })
								}
								onClose={() => handleCloseConnection(connection.id)}
								onDelete={() =>
									deleteConnectionMutation.mutate({ id: connection.id })
								}
								isLoading={isLoading}
								isReconnecting={reconnectMutation.isPending}
								isDeleting={deleteConnectionMutation.isPending}
								isClosing={closeConnectionMutation.isPending}
							/>
						))}
					</div>
				) : (
					<Card className="flex flex-col items-center justify-center p-12 text-center">
						<Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
						<h3 className="mb-2 font-semibold text-foreground text-lg">
							No connections found
						</h3>
						<p className="mb-6 text-muted-foreground">
							{searchQuery
								? "Try adjusting your search"
								: "Create your first database connection to get started"}
						</p>
						{!searchQuery && (
							<Button
								onClick={() => setShowConnectionModal(true)}
								variant="outline"
							>
								Create Connection
							</Button>
						)}
					</Card>
				)}
			</div>

			{/* Connection Modal */}
			<ConnectionModal
				isOpen={showConnectionModal}
				onClose={() => setShowConnectionModal(false)}
				onConnect={handleCreateConnection}
			/>
		</>
	);
}

/**
 * Card component for displaying a single database connection
 */
function ConnectionCard({
	connection,
	onSelect,
	onReconnect,
	onClose,
	onDelete,
	isLoading: isLoadingDatabases,
	isReconnecting,
	isClosing,
	isDeleting,
}: {
	connection: {
		id: number;
		name: string;
		connectionType: "connection_string" | "manual";
		host: string | null;
		port: number | null;
		username: string | null;
		database: string | null;
		ssl: boolean | null;
		isActive: boolean | null;
		createdAt: Date | null;
		lastUsedAt?: Date | null;
	};
	onSelect: (id: number) => void;
	onReconnect: () => void;
	onClose: () => void;
	onDelete: () => void;
	isLoading: boolean;
	isReconnecting: boolean;
	isClosing: boolean;
	isDeleting: boolean;
}) {
	const { data: stats, isLoading: isLoadingStats } =
		api.database.getConnectionStats.useQuery(
			{ connectionId: connection.id },
			{ enabled: connection.isActive === true },
		);

	// Show skeleton/loading state while fetching stats if connection is active
	const isLoading = connection.isActive === true && isLoadingStats;
	const lastUsed = connection.lastUsedAt
		? formatRelativeTime(connection.lastUsedAt)
		: null;

	// Return full card skeleton while loading stats
	if (isLoading) {
		return <ConnectionCardSkeleton />;
	}

	return (
		<Card
			className="group flex h-full cursor-pointer flex-col p-6 transition-shadow hover:shadow-md"
			onClick={() => onSelect(connection.id)}
		>
			<div className="mb-4 flex items-start justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-primary/10 p-2">
						<Database className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h3 className="font-semibold text-foreground">{connection.name}</h3>
						<p className="text-muted-foreground text-sm">
							{connection.database}
						</p>
					</div>
				</div>
				<div className="opacity-0 transition-opacity group-hover:opacity-100">
					<button type="button" className="rounded p-1 hover:bg-muted">
						<MoreVertical className="h-4 w-4 text-muted-foreground" />
					</button>
				</div>
			</div>

			<div className="flex-1">
				<div className="mb-4 space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Type:</span>
						<span className="font-mono text-foreground">
							{connection.connectionType === "connection_string"
								? "Connection String"
								: "Manual"}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Created:</span>
						<span className="font-mono text-foreground">
							{connection.createdAt
								? formatRelativeTime(connection.createdAt)
								: "-"}
						</span>
					</div>
					{lastUsed && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Last Used:</span>
							<span className="font-mono text-foreground">{lastUsed}</span>
						</div>
					)}
					{connection.isActive && stats && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tables:</span>
							<span className="font-mono text-foreground">
								{stats.tableCount}
							</span>
						</div>
					)}
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Status:</span>
						<div className="flex items-center gap-2">
							<div
								className={`h-2 w-2 rounded-full ${
									connection.isActive ? "bg-green-500" : "bg-red-500"
								}`}
							/>
							<span
								className={`rounded-full px-2 py-0.5 font-mono font-semibold text-xs uppercase ${
									connection.isActive
										? "bg-green-500/10 text-green-500"
										: "bg-red-500/10 text-red-500"
								}`}
							>
								{connection.isActive ? "Active" : "Inactive"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="mt-auto flex items-center justify-between border-border border-t pt-4">
				<div className="flex gap-2">
					{!connection.isActive && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onReconnect();
							}}
							disabled={isReconnecting}
							className="rounded p-1 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
							title="Reconnect to database"
						>
							<RefreshCw
								className={`h-4 w-4 text-blue-500 ${
									isReconnecting || isLoadingDatabases ? "animate-spin" : ""
								}`}
							/>
						</button>
					)}
					{connection.isActive && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onClose();
							}}
							disabled={isClosing}
							className="rounded p-1 transition-colors hover:bg-orange-500/10 disabled:opacity-50"
							title="Close connection"
						>
							<Unplug className="h-4 w-4 text-red-500" />
						</button>
					)}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							// Handle edit
						}}
						className="rounded p-1 transition-colors hover:bg-muted"
					>
						<Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						disabled={isDeleting}
						className="rounded p-1 transition-colors hover:bg-destructive/10"
					>
						<Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
					</button>
				</div>
			</div>
		</Card>
	);
}
