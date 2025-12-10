"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Sidebar from "~/components/sidebar";
import { api } from "~/trpc/react";

export default function TableDetailsPage() {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;
	const tablename = params?.tablename as string;
	const utils = api.useUtils();

	// Decode the connection ID from the dbname param
	// The dbname is in format: "connectionName-connectionId"
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const { data: columns = [] } = api.database.getTableColumns.useQuery({
		connectionId,
		tableName: tablename,
	});
	console.log(columns);
	const currentConnection = connections.find((c) => c.id === connectionId);

	const handleBack = () => {
		// Invalidate the listConnections query before going back
		void utils.database.listConnections.invalidate();
		router.back();
	};

	console.log(currentConnection);

	// todo make sidebar layout
	return (
		<div className="flex h-screen bg-background">
			<Sidebar
				connections={connections}
				selectedConnection={connectionId}
				onSelectConnection={(id) => {
					if (id && id > 0) {
						const conn = connections.find((c) => c.id === id);
						if (conn) {
							router.push(
								`/home/${conn.name.toLowerCase().replace(/\s+/g, "-")}-${id}`,
							);
						}
					}
				}}
				onAddConnection={() => {
					router.push("/home");
				}}
			/>

			<main className="flex-1 overflow-auto">
				{/* Header */}
				<div className="sticky top-0 z-10 border-border border-b bg-card">
					<div className="flex items-center justify-between p-6">
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={handleBack}
								className="rounded-lg p-2 transition-colors hover:bg-muted"
							>
								<ArrowLeft className="h-5 w-5 text-muted-foreground" />
							</button>
							<div>
								<h1 className="font-bold text-2xl text-foreground">
									{decodeURIComponent(tablename)}
								</h1>
								<p className="text-muted-foreground text-sm">
									Connection: {currentConnection?.name || `ID: ${connectionId}`}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="p-6">
					<p className="text-muted-foreground">
						Table details for:{" "}
						<span className="font-bold font-mono text-foreground">
							{decodeURIComponent(tablename)}
						</span>
					</p>
				</div>
			</main>
		</div>
	);
}
