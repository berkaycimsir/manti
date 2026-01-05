"use client";

import { Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ConnectionModal from "~/components/connection-modal";
import {
	type Connection,
	ConnectionCard,
} from "~/components/home/connection-card";
import { ConnectionRow } from "~/components/home/connection-row";
import { ConnectionsHeader } from "~/components/home/connections-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ConnectionGridSkeleton } from "~/components/ui/content-skeletons";
import { useHeader } from "~/hooks/use-header";
import { CONNECTION_CLEANUP_INTERVAL } from "~/lib/constants";
import { useHomeViewStore } from "~/stores/home-view-store";
import { api } from "~/trpc/react";

export default function HomePage() {
	const router = useRouter();
	const [showConnectionModal, setShowConnectionModal] = useState(false);
	const [connectionToEdit, setConnectionToEdit] = useState<Connection | null>(
		null
	);
	const [searchQuery, setSearchQuery] = useState("");
	const { viewMode, sortOption } = useHomeViewStore();
	const utils = api.useUtils();

	// Set up header
	useHeader({
		title: "Database Connections",
		subtitle: "Manage and inspect your PostgreSQL databases",
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

	// Mutation to update connection (Edit)
	const updateConnectionMutation = api.database.updateConnection.useMutation({
		onSuccess: () => {
			setShowConnectionModal(false);
			setConnectionToEdit(null);
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

	// Mutation to close connection (Disconnect)
	const disconnectMutation = api.database.updateConnection.useMutation({
		onSuccess: () => {
			void utils.database.listConnections.invalidate();
		},
	});

	// Filter and Sort
	const processedConnections = useMemo(() => {
		const filtered = connections.filter(
			conn =>
				conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(conn.host?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
		);

		return filtered.sort((a, b) => {
			switch (sortOption) {
				case "name-asc":
					return a.name.localeCompare(b.name);
				case "name-desc":
					return b.name.localeCompare(a.name);
				case "created-asc":
					return (
						new Date(a.createdAt || 0).getTime() -
						new Date(b.createdAt || 0).getTime()
					);
				case "created-desc":
					return (
						new Date(b.createdAt || 0).getTime() -
						new Date(a.createdAt || 0).getTime()
					);
				case "last-used-desc":
					return (
						new Date(b.lastUsedAt || 0).getTime() -
						new Date(a.lastUsedAt || 0).getTime()
					);
				case "last-used-asc":
					return (
						new Date(a.lastUsedAt || 0).getTime() -
						new Date(b.lastUsedAt || 0).getTime()
					);
				default:
					return 0;
			}
		});
	}, [connections, searchQuery, sortOption]);

	const handleCloseConnection = (id: number) => {
		disconnectMutation.mutate({ id, isActive: false });
	};

	const handleSelectConnection = (id: number | null) => {
		if (!id) return;
		const connection = connections.find(c => c.id === id);
		if (connection) {
			const dbname = `${connection.name
				.toLowerCase()
				.replace(/\s+/g, "-")}-${id}`;
			router.push(`/home/${dbname}`);
		}
	};

	const handleConnectionSubmit = async (data: any) => {
		if (connectionToEdit) {
			updateConnectionMutation.mutate({ id: connectionToEdit.id, ...data });
		} else {
			createConnectionMutation.mutate(data);
		}
	};

	const handleEditConnection = (connection: Connection) => {
		setConnectionToEdit(connection);
		setShowConnectionModal(true);
	};

	const handleCreateNew = () => {
		setConnectionToEdit(null);
		setShowConnectionModal(true);
	};

	const handleModalClose = () => {
		setShowConnectionModal(false);
		setConnectionToEdit(null);
	};

	return (
		<>
			<div className="p-8">
				<ConnectionsHeader
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					onConnect={handleCreateNew}
					connectionCount={processedConnections.length}
				/>

				<div className="mt-6">
					{isLoading ? (
						<ConnectionGridSkeleton cards={6} />
					) : processedConnections.length > 0 ? (
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" // Adjusted grid for smaller cards
									: "flex flex-col gap-2"
							}
						>
							{processedConnections.map(connection => {
								const props = {
									connection: connection as Connection,
									onSelect: handleSelectConnection,
									onReconnect: () =>
										reconnectMutation.mutate({ id: connection.id }),
									onClose: () => handleCloseConnection(connection.id),
									onDelete: () =>
										deleteConnectionMutation.mutate({ id: connection.id }),
									onEdit: () => handleEditConnection(connection as Connection),
									isLoading: isLoading,
									isReconnecting:
										reconnectMutation.isPending &&
										reconnectMutation.variables?.id === connection.id,
									isDeleting:
										deleteConnectionMutation.isPending &&
										deleteConnectionMutation.variables?.id === connection.id,
									isClosing:
										disconnectMutation.isPending &&
										disconnectMutation.variables?.id === connection.id,
								};

								if (viewMode === "list") {
									return <ConnectionRow key={connection.id} {...props} />;
								}
								return <ConnectionCard key={connection.id} {...props} />;
							})}
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
								<Button onClick={handleCreateNew} variant="outline">
									Create Connection
								</Button>
							)}
						</Card>
					)}
				</div>
			</div>

			{/* Connection Modal */}
			<ConnectionModal
				isOpen={showConnectionModal}
				onClose={handleModalClose}
				onSubmit={handleConnectionSubmit}
				initialData={connectionToEdit}
			/>
		</>
	);
}
