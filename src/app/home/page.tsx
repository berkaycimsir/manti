"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Plus,
	Database,
	Search,
	MoreVertical,
	Trash2,
	Edit2,
	RefreshCw,
	Unplug,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import Sidebar from "~/components/sidebar";
import ConnectionModal from "~/components/connection-modal";
import { api } from "~/trpc/react";
import { CONNECTION_CLEANUP_INTERVAL } from "~/lib/constants";
import { formatRelativeTime } from "~/lib/utils";

export default function HomePage() {
	const router = useRouter();
	const [showConnectionModal, setShowConnectionModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const utils = api.useUtils();

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

	const handleDeleteConnection = (id: number) => {
		deleteConnectionMutation.mutate({ id });
	};

	const handleCloseConnection = (id: number) => {
		closeConnectionMutation.mutate({ id, isActive: false });
	};

	const handleSelectConnection = (id: number | null) => {
		if (!id) return;
		const connection = connections.find((c) => c.id === id);
		if (connection) {
			const dbname = `${connection.name.toLowerCase().replace(/\s+/g, "-")}-${id}`;
			router.push(`/home/${dbname}`);
		}
	};

	const handleCreateConnection = async (newConnection: unknown) => {
		createConnectionMutation.mutate(newConnection as never);
	};

	return (
		<div className="flex h-screen bg-background">
			<Sidebar
				connections={connections}
				selectedConnection={null}
				onSelectConnection={handleSelectConnection}
				onAddConnection={() => setShowConnectionModal(true)}
			/>

			<main className="flex-1 overflow-auto">
				<div className="p-8">
					{/* Header */}
					<div className="mb-8">
						<h1 className="mb-2 font-bold text-3xl text-foreground">
							Database Connections
						</h1>
						<p className="text-muted-foreground">
							Manage and inspect your PostgreSQL databases
						</p>
					</div>

					{/* Search and Add Button */}
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
						<Button
							onClick={() => setShowConnectionModal(true)}
							className="gap-2"
						>
							<Plus className="h-4 w-4" />
							New Connection
						</Button>
					</div>

					{/* Connections Grid */}
					{isLoading ? (
						<Card className="p-12 text-center">
							<div className="mb-4 inline-block">
								<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
							</div>
							<p className="text-muted-foreground">Loading connections...</p>
						</Card>
					) : filteredConnections.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredConnections.map((connection) => (
								<ConnectionCard
									key={connection.id}
									connection={connection}
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
						<Card className="p-12 text-center">
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
			</main>

			{/* Connection Modal */}
			<ConnectionModal
				isOpen={showConnectionModal}
				onClose={() => setShowConnectionModal(false)}
				onConnect={handleCreateConnection}
			/>
		</div>
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

	return (
		<Card
			className="group cursor-pointer p-6 transition-shadow hover:shadow-md"
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

			{isLoading ? (
				<div className="mb-4 space-y-2">
					<div className="h-4 w-32 animate-pulse rounded bg-muted" />
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
					<div className="h-4 w-28 animate-pulse rounded bg-muted" />
				</div>
			) : (
				<div className="mb-4 space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Type:</span>
						<span className="font-mono text-foreground">
							{connection.connectionType === "connection_string"
								? "Connection String"
								: "Manual"}
						</span>
					</div>
					{connection.isActive && stats && (
						<>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Tables:</span>
								<span className="font-mono text-foreground">
									{stats.tableCount}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Created:</span>
								<span className="font-mono text-foreground">
									{formatRelativeTime(stats.createdAt)}
								</span>
							</div>
						</>
					)}
					<div className="flex justify-between">
						<span className="text-muted-foreground">Status:</span>
						<div className="flex items-center gap-2">
							<div
								className={`h-2 w-2 rounded-full ${
									connection.isActive ? "bg-green-500" : "bg-red-500"
								}`}
							/>
							<span
								className={`font-mono uppercase ${
									connection.isActive ? "text-green-500" : "text-red-500"
								}`}
							>
								{connection.isActive ? "ACTIVE" : "INACTIVE"}
							</span>
						</div>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between border-border border-t pt-4">
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
