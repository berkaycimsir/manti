"use client";

import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import { TableDataSkeleton } from "@shared/components/ui/content-skeletons";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@shared/components/ui/tabs";
import { useHeader } from "@shared/hooks/use-header";
import { Filter, Settings2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	FilterSidebar,
	TransformationSidebar,
	useColumnConfig,
} from "~/features/column-rules";
import {
	AdvancedTableViewer,
	type AdvancedTableViewerRef,
	TableStructure,
	TableHeader as TableToolbar,
} from "~/features/table-explorer";
import { api } from "~/trpc/react";

export default function TableDetailsPage() {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;
	const tablename = decodeURIComponent(params?.tablename as string);
	const searchParams = useSearchParams();
	const schemaName = searchParams.get("schema") || "public";
	const utils = api.useUtils();
	const [isTransformationSidebarOpen, setIsTransformationSidebarOpen] =
		useState(false);
	const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const currentConnection = connections.find(c => c.id === connectionId);

	// Fetch table columns
	const { data: columns = [], isLoading: columnsLoading } =
		api.database.getTableColumns.useQuery({
			connectionId,
			tableName: tablename,
			schemaName,
		});

	// Fetch table data
	const {
		data: tableData,
		isLoading: dataLoading,
		error: dataError,
	} = api.database.getTableData.useQuery({
		connectionId,
		tableName: tablename,
		schemaName,
		limit: 100,
		offset: 0,
	});

	// Use the column config hook for transformations and filters
	const {
		mergedTransformations,
		mergedFilters,
		tableTransformations,
		tableFilters,
	} = useColumnConfig({
		connectionId,
		tableName: tablename,
	});

	const handleBack = useCallback(() => {
		void utils.database.listConnections.invalidate();
		router.back();
	}, [router, utils]);

	const isLoading = columnsLoading || dataLoading;

	// Count active table-specific transformations and filters
	const activeTransformationsCount = useMemo(
		() => tableTransformations.filter(t => t.isEnabled).length,
		[tableTransformations]
	);

	const activeFiltersCount = useMemo(
		() => tableFilters.filter(f => f.isEnabled).length,
		[tableFilters]
	);

	// Memoized action buttons for header
	const headerActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					onClick={() => setIsFilterSidebarOpen(true)}
					className="gap-2"
				>
					<Filter className="h-4 w-4" />
					Filters
					{activeFiltersCount > 0 && (
						<span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
							{activeFiltersCount}
						</span>
					)}
				</Button>
				<Button
					variant="outline"
					onClick={() => setIsTransformationSidebarOpen(true)}
					className="gap-2"
				>
					<Settings2 className="h-4 w-4" />
					Transformations
					{activeTransformationsCount > 0 && (
						<span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
							{activeTransformationsCount}
						</span>
					)}
				</Button>
			</>
		),
		[activeFiltersCount, activeTransformationsCount]
	);

	// Memoized floating actions for when layout is hidden
	const floatingActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setIsFilterSidebarOpen(true)}
					title="Column Filters"
					className="h-9 w-9 shadow-md"
				>
					<Filter className="h-5 w-5" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setIsTransformationSidebarOpen(true)}
					title="Column Transformations"
					className="h-9 w-9 shadow-md"
				>
					<Settings2 className="h-5 w-5" />
				</Button>
			</>
		),
		[]
	);

	// Register header via hook
	useHeader({
		title: tablename,
		subtitle: `Connection: ${currentConnection?.name || `ID: ${connectionId}`}`,
		onBack: handleBack,
		actions: headerActions,
		floatingActions: floatingActions,
	});

	// State and Refs for external control
	const [searchQuery, setSearchQuery] = useState("");
	const tableRef = useRef<AdvancedTableViewerRef>(null);

	return (
		<div className="relative flex h-full flex-col">
			<Tabs defaultValue="data" className="flex flex-1 flex-col">
				<div className="flex items-center justify-between px-6 pt-4">
					<TabsList>
						<TabsTrigger value="data">Data</TabsTrigger>
						<TabsTrigger value="structure">Structure</TabsTrigger>
					</TabsList>

					<TableToolbar
						globalSearch={searchQuery}
						onSearchChange={setSearchQuery}
						onExportCSV={() => tableRef.current?.exportCSV()}
						onExportJSON={() => tableRef.current?.exportJSON()}
					/>
				</div>

				<div className="min-h-0 flex-1 px-6 pt-2">
					<TabsContent value="data" className="mt-0 h-full">
						{isLoading ? (
							<TableDataSkeleton rows={8} columns={5} />
						) : dataError ? (
							<Card className="border-destructive/50 bg-destructive/5 p-6">
								<p className="font-medium text-destructive">
									Error loading table data
								</p>
								<p className="text-muted-foreground text-sm">
									{dataError instanceof Error
										? dataError.message
										: "Failed to load table data"}
								</p>
							</Card>
						) : (
							<AdvancedTableViewer
								ref={tableRef}
								dbName={dbname}
								tableName={tablename}
								columns={columns}
								rows={tableData?.rows ?? []}
								searchQuery={searchQuery}
								onSearchChange={setSearchQuery}
								transformations={mergedTransformations}
								filters={mergedFilters}
							/>
						)}
					</TabsContent>

					<TabsContent value="structure" className="mt-0 h-full overflow-auto">
						<TableStructure
							connectionId={connectionId}
							tableName={tablename}
							schema={schemaName}
						/>
					</TabsContent>
				</div>
			</Tabs>

			{/* Filter Sidebar */}
			<FilterSidebar
				isOpen={isFilterSidebarOpen}
				onClose={() => setIsFilterSidebarOpen(false)}
				connectionId={connectionId}
				tableName={tablename}
				columns={columns}
			/>

			{/* Transformation Sidebar */}
			<TransformationSidebar
				isOpen={isTransformationSidebarOpen}
				onClose={() => setIsTransformationSidebarOpen(false)}
				connectionId={connectionId}
				tableName={tablename}
				columns={columns}
			/>
		</div>
	);
}
