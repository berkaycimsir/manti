"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Code, Eye, Table } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Sidebar from "~/components/sidebar";
import { api } from "~/trpc/react";

export default function DatabaseInspectionPage() {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;
	const utils = api.useUtils();

	const [activeTab, setActiveTab] = useState("tables");
	const [selectedTable, setSelectedTable] = useState<string | null>(null);

	// Decode the connection ID from the dbname param
	// The dbname is in format: "connectionName-connectionId"
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const currentConnection = connections.find((c) => c.id === connectionId);

	// Fetch real tables from the database
	// This automatically updates lastUsed in the connection pool
	const {
		data: tables = [],
		isLoading: tablesLoading,
		error: tablesError,
	} = api.database.getTables.useQuery(
		{ connectionId },
		{ enabled: connectionId > 0 },
	);

	// Fetch columns for selected table
	// This automatically updates lastUsed in the connection pool
	const { data: columns = [], isLoading: columnsLoading } =
		api.database.getTableColumns.useQuery(
			{ connectionId, tableName: selectedTable ?? "", schemaName: "public" },
			{ enabled: !!selectedTable && connectionId > 0 },
		);

	const handleBack = () => {
		// Invalidate the listConnections query before going back
		// This ensures fresh data when returning to the home page
		void utils.database.listConnections.invalidate();
		router.back();
	};

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
									Database Inspector
								</h1>
								<p className="text-muted-foreground text-sm">
									Connection: {currentConnection?.name || `ID: ${connectionId}`}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="p-6">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="grid w-full max-w-md grid-cols-3">
							<TabsTrigger value="tables" className="gap-2">
								<Table className="h-4 w-4" />
								Tables
							</TabsTrigger>
							<TabsTrigger value="query" className="gap-2">
								<Code className="h-4 w-4" />
								Query
							</TabsTrigger>
							<TabsTrigger value="info" className="gap-2">
								<Eye className="h-4 w-4" />
								Info
							</TabsTrigger>
						</TabsList>

						<TabsContent value="tables" className="mt-6">
							{tablesLoading ? (
								<Card className="p-12 text-center">
									<div className="mb-4 inline-block">
										<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
									</div>
									<p className="text-muted-foreground">Loading tables...</p>
								</Card>
							) : tablesError ? (
								<Card className="border-destructive/50 bg-destructive/5 p-6">
									<p className="font-medium text-destructive">
										Error loading tables
									</p>
									<p className="text-muted-foreground text-sm">
										{tablesError instanceof Error
											? tablesError.message
											: "Failed to load tables"}
									</p>
								</Card>
							) : tables.length === 0 ? (
								<Card className="p-12 text-center">
									<Table className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
									<p className="text-muted-foreground">
										No tables found in this database
									</p>
								</Card>
							) : (
								<div className="space-y-4">
									{tables.map((table) => (
										<Card
											key={`${table.schema}.${table.name}`}
											className={`cursor-pointer p-6 transition-shadow hover:shadow-md ${
												selectedTable === table.name
													? "border-primary ring-1 ring-primary"
													: ""
											}`}
											onClick={() => setSelectedTable(table.name)}
										>
											<div className="mb-4 flex items-center justify-between">
												<div>
													<h3 className="font-semibold text-foreground text-lg">
														{table.name}
													</h3>
													<p className="text-muted-foreground text-sm">
														Schema: {table.schema}
													</p>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														router.push(
															`/home/${dbname}/${encodeURIComponent(table.name)}`,
														);
													}}
												>
													View
												</Button>
											</div>

											{selectedTable === table.name && columnsLoading ? (
												<div className="py-4 text-center">
													<div className="mb-2 inline-block">
														<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
													</div>
													<p className="text-muted-foreground text-sm">
														Loading columns...
													</p>
												</div>
											) : selectedTable === table.name && columns.length > 0 ? (
												<div className="overflow-x-auto">
													<table className="w-full text-sm">
														<thead>
															<tr className="border-border border-b">
																<th className="px-3 py-2 text-left font-medium text-foreground">
																	Column
																</th>
																<th className="px-3 py-2 text-left font-medium text-foreground">
																	Type
																</th>
																<th className="px-3 py-2 text-left font-medium text-foreground">
																	Nullable
																</th>
															</tr>
														</thead>
														<tbody>
															{columns.map((column) => (
																<tr
																	key={column.name}
																	className="border-border border-b hover:bg-muted/50"
																>
																	<td className="px-3 py-2 font-mono text-foreground">
																		{column.name}
																	</td>
																	<td className="px-3 py-2 text-muted-foreground">
																		{column.type}
																	</td>
																	<td className="px-3 py-2">
																		<span
																			className={`rounded px-2 py-1 text-xs ${
																				column.nullable
																					? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
																					: "bg-green-500/10 text-green-700 dark:text-green-400"
																			}`}
																		>
																			{column.nullable ? "Yes" : "No"}
																		</span>
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											) : null}
										</Card>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="query" className="mt-6">
							<Card className="p-6">
								<h3 className="mb-4 font-semibold text-foreground text-lg">
									SQL Query Editor
								</h3>
								<textarea
									className="h-64 w-full rounded-lg border border-border bg-muted p-4 font-mono text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="SELECT * FROM table_name LIMIT 10;"
									defaultValue="SELECT * FROM information_schema.tables LIMIT 10;"
								/>
								<Button className="mt-4">Execute Query</Button>
							</Card>
						</TabsContent>

						<TabsContent value="info" className="mt-6">
							<Card className="p-6">
								<h3 className="mb-4 font-semibold text-foreground text-lg">
									Database Information
								</h3>
								<div className="grid grid-cols-2 gap-6">
									<div>
										<p className="mb-1 text-muted-foreground text-sm">
											Total Tables
										</p>
										<p className="font-semibold text-foreground">
											{tables.length}
										</p>
									</div>
									<div>
										<p className="mb-1 text-muted-foreground text-sm">
											Connection ID
										</p>
										<p className="font-semibold text-foreground">
											{connectionId}
										</p>
									</div>
								</div>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
