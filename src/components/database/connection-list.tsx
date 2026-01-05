"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface ConnectionListProps {
	onConnectionSelect?: (connectionId: number) => void;
}

export function ConnectionList({ onConnectionSelect }: ConnectionListProps) {
	const [testingId, setTestingId] = useState<number | null>(null);
	const utils = api.useUtils();
	const { data: connections, isLoading } =
		api.database.listConnections.useQuery();

	const deleteConnection = api.database.deleteConnection.useMutation({
		onSuccess: async () => {
			await utils.database.listConnections.invalidate();
		},
	});

	if (isLoading) {
		return <div className="p-4">Loading connections...</div>;
	}

	if (!connections?.length) {
		return <div className="p-4 text-gray-500">No connections found</div>;
	}

	const handleTestConnection = async (connectionId: number) => {
		setTestingId(connectionId);
		try {
			const result = await utils.database.testConnection.fetch({
				id: connectionId,
			});
			if (result.connected) {
				alert("Connection successful!");
			} else {
				alert(`Connection failed: ${result.error || "Unknown error"}`);
			}
		} finally {
			setTestingId(null);
		}
	};

	return (
		<div className="space-y-2">
			<h2 className="font-semibold text-lg">Your Connections</h2>
			<div className="space-y-2">
				{connections.map(conn => (
					<div
						key={conn.id}
						className="flex items-center justify-between rounded border border-gray-200 p-3 hover:bg-gray-50"
					>
						<button
							type="button"
							onClick={() => onConnectionSelect?.(conn.id)}
							onKeyUp={e => {
								if (e.key === "Enter") {
									onConnectionSelect?.(conn.id);
								}
							}}
							className="flex-1 cursor-pointer text-left"
						>
							<h3 className="font-medium">{conn.name}</h3>
							<p className="text-gray-500 text-xs">
								{conn.connectionType === "connection_string"
									? "Connection String"
									: `${conn.username}@${conn.host}:${conn.port}/${conn.database}`}
							</p>
						</button>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => handleTestConnection(conn.id)}
								className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
								disabled={testingId === conn.id}
							>
								{testingId === conn.id ? "Testing..." : "Test"}
							</button>
							<button
								type="button"
								onClick={() => deleteConnection.mutate({ id: conn.id })}
								className="rounded bg-red-100 px-3 py-1 text-red-600 text-sm hover:bg-red-200"
								disabled={deleteConnection.isPending}
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
