"use client";

import { Table } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SchemaGroup } from "~/components/database/tables/schema-group";
import { TableCard } from "~/components/database/tables/table-card";
import { TablePreviewDialog } from "~/components/database/tables/table-preview-dialog";
import { TableRow } from "~/components/database/tables/table-row";
import { TablesHeader } from "~/components/database/tables/tables-header";
import { Card } from "~/components/ui/card";
import { TablesListSkeleton } from "~/components/ui/content-skeletons";
import { useTablesViewStore } from "~/stores/tables-view-store";
import { api } from "~/trpc/react";

interface TableInfo {
	name: string;
	schema: string;
	columnCount?: number;
}

export default function TablesPage() {
	const params = useParams();
	const dbname = params?.dbname as string;

	// View store
	const { viewMode, sortBy, sortOrder, groupBySchema } = useTablesViewStore();

	// Local state
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSchema, setSelectedSchema] = useState("all");
	const [mounted, setMounted] = useState(false);

	// Wait for hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch tables
	const {
		data: tables = [],
		isLoading: tablesLoading,
		error: tablesError,
	} = api.database.getTables.useQuery(
		{ connectionId },
		{ enabled: connectionId > 0 }
	);

	// Fetch schemas
	const { data: schemas = [] } = api.database.getSchemas.useQuery(
		{ connectionId },
		{ enabled: connectionId > 0 }
	);

	// Fetch columns for all tables (for column count)
	const columnQueries = api.useQueries(t =>
		tables.map(table =>
			t.database.getTableColumns(
				{
					connectionId,
					tableName: table.name,
					schemaName: table.schema,
				},
				{ enabled: tables.length > 0 && tables.length <= 50 }
			)
		)
	);

	// Build tables with column counts
	const tablesWithCounts: TableInfo[] = useMemo(() => {
		return tables.map((table, index) => ({
			...table,
			columnCount: columnQueries[index]?.data?.length,
		}));
	}, [tables, columnQueries]);

	// Filter tables
	const filteredTables = useMemo(() => {
		let result = tablesWithCounts;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				table =>
					table.name.toLowerCase().includes(query) ||
					table.schema.toLowerCase().includes(query)
			);
		}

		// Filter by schema
		if (selectedSchema !== "all") {
			result = result.filter(table => table.schema === selectedSchema);
		}

		// Sort
		result = [...result].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "columns":
					comparison = (a.columnCount ?? 0) - (b.columnCount ?? 0);
					break;
				case "schema":
					comparison = a.schema.localeCompare(b.schema);
					break;
			}
			return sortOrder === "asc" ? comparison : -comparison;
		});

		return result;
	}, [tablesWithCounts, searchQuery, selectedSchema, sortBy, sortOrder]);

	// Group tables by schema
	const groupedTables = useMemo(() => {
		if (!groupBySchema) return null;

		const groups: Record<string, TableInfo[]> = {};
		for (const table of filteredTables) {
			if (!groups[table.schema]) {
				groups[table.schema] = [];
			}
			groups[table.schema]?.push(table);
		}
		return groups;
	}, [filteredTables, groupBySchema]);

	// Preview state
	const [previewTable, setPreviewTable] = useState<TableInfo | null>(null);

	// Handle preview - open dialog
	const handlePreview = (table: TableInfo) => {
		setPreviewTable(table);
	};

	// Loading state
	if (tablesLoading || !mounted) {
		return (
			<div className="p-6">
				<TablesListSkeleton tables={6} />
			</div>
		);
	}

	// Error state
	if (tablesError) {
		return (
			<div className="p-6">
				<Card className="border-destructive/50 bg-destructive/5 p-6">
					<p className="font-medium text-destructive">Error loading tables</p>
					<p className="text-muted-foreground text-sm">
						{tablesError instanceof Error
							? tablesError.message
							: "Failed to load tables"}
					</p>
				</Card>
			</div>
		);
	}

	// Empty state
	if (tables.length === 0) {
		return (
			<div className="p-6">
				<Card className="p-12 text-center">
					<Table className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<p className="text-muted-foreground">
						No tables found in this database
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-2">
			{/* Header with Search and Controls */}
			<TablesHeader
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				schemas={schemas}
				selectedSchema={selectedSchema}
				onSchemaChange={setSelectedSchema}
				tableCount={filteredTables.length}
			/>

			{/* Tables List */}
			<div className="mt-6 flex-1 overflow-auto">
				{filteredTables.length === 0 ? (
					<Card className="p-8 text-center">
						<p className="text-muted-foreground">
							No tables match your search criteria
						</p>
					</Card>
				) : groupBySchema && groupedTables ? (
					// Grouped View
					<div className="space-y-6">
						{Object.entries(groupedTables)
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([schema, schemaTables]) => (
								<SchemaGroup
									key={schema}
									schema={schema}
									tableCount={schemaTables.length}
								>
									{viewMode === "grid" ? (
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
											{schemaTables.map(table => (
												<TableCard
													key={`${table.schema}.${table.name}`}
													table={table}
													dbname={dbname}
													onPreview={() => handlePreview(table)}
												/>
											))}
										</div>
									) : (
										<div className="space-y-2">
											{schemaTables.map(table => (
												<TableRow
													key={`${table.schema}.${table.name}`}
													table={table}
													dbname={dbname}
													onPreview={() => handlePreview(table)}
												/>
											))}
										</div>
									)}
								</SchemaGroup>
							))}
					</div>
				) : viewMode === "grid" ? (
					// Grid View
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredTables.map(table => (
							<TableCard
								key={`${table.schema}.${table.name}`}
								table={table}
								dbname={dbname}
								onPreview={() => handlePreview(table)}
							/>
						))}
					</div>
				) : (
					// List View
					<div className="space-y-2">
						{filteredTables.map(table => (
							<TableRow
								key={`${table.schema}.${table.name}`}
								table={table}
								dbname={dbname}
								onPreview={() => handlePreview(table)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Table Preview Dialog */}
			<TablePreviewDialog
				isOpen={!!previewTable}
				onClose={() => setPreviewTable(null)}
				table={previewTable}
				dbname={dbname}
			/>
		</div>
	);
}
