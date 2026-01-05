"use client";

import {
	AlertCircle,
	Clock,
	Loader2,
	Play,
	RowsIcon,
	Save,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdvancedTableViewer } from "~/components/database/advanced-table-viewer";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useHeader } from "~/hooks/use-header";
import { useRecentPage } from "~/hooks/use-recent-page";
import { api } from "~/trpc/react";

interface QueryResult {
	rows: Array<Record<string, unknown>>;
	rowCount: number;
	command?: string;
}

export default function QueryEditPage() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const dbname = params?.dbname as string;
	const queryId = searchParams.get("id");

	const [queryName, setQueryName] = useState("");
	const [queryText, setQueryText] = useState("");
	const [selectedTabId, setSelectedTabId] = useState<string>("uncategorized");
	const [result, setResult] = useState<QueryResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [executionTime, setExecutionTime] = useState<number | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);

	// Redirect to new page if no queryId
	useEffect(() => {
		if (!queryId) {
			router.replace(`/home/${dbname}/query/new`);
		}
	}, [queryId, dbname, router]);

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const currentConnection = connections.find(c => c.id === connectionId);

	// Fetch tabs
	const { data: tabs = [] } = api.database.listTabs.useQuery({ connectionId });

	// Fetch existing query
	const { data: existingQuery, isLoading: isLoadingQuery } =
		api.database.getSavedQuery.useQuery(
			{ id: Number(queryId) },
			{ enabled: !!queryId }
		);

	// Load existing query data
	useEffect(() => {
		if (existingQuery) {
			setQueryName(existingQuery.name);
			setQueryText(existingQuery.query);
			if (existingQuery.tabId) {
				setSelectedTabId(String(existingQuery.tabId));
			} else {
				setSelectedTabId("uncategorized");
			}
			if (existingQuery.lastResult) {
				setResult({
					rows: existingQuery.lastResult as Array<Record<string, unknown>>,
					rowCount: existingQuery.rowCount ?? 0,
				});
				setExecutionTime(existingQuery.executionTimeMs ?? null);
			}
		}
	}, [existingQuery]);

	const utils = api.useUtils();

	// Calculate columns for AdvancedTableViewer
	const columns = useMemo(() => {
		if (!result?.rows?.length) return [];
		const firstRow = result.rows[0];
		return Object.keys(firstRow || {}).map(key => ({
			name: key,
			type: "text",
		}));
	}, [result]);

	// Update saved query mutation
	const updateQueryMutation = api.database.updateSavedQuery.useMutation({
		onSuccess: () => {
			void utils.database.listSavedQueries.invalidate();
			void utils.database.getSavedQuery.invalidate({ id: Number(queryId) });
		},
	});

	// Execute saved query mutation
	const executeSavedQueryMutation = api.database.executeSavedQuery.useMutation({
		onSuccess: data => {
			setResult(data.result);
			setExecutionTime(data.executionTimeMs);
			setError(null);
			setIsExecuting(false);
			void utils.database.listSavedQueries.invalidate();
		},
		onError: err => {
			setError(err.message);
			setResult(null);
			setIsExecuting(false);
		},
	});

	const handleExecute = () => {
		if (!queryText.trim() || !queryId) return;
		setIsExecuting(true);
		setError(null);

		updateQueryMutation.mutate(
			{
				id: Number(queryId),
				query: queryText,
				name: queryName,
				tabId: selectedTabId === "uncategorized" ? null : Number(selectedTabId),
			},
			{
				onSuccess: () => {
					executeSavedQueryMutation.mutate({ id: Number(queryId) });
				},
			}
		);
	};

	const handleSaveAndExecute = () => {
		if (!queryText.trim() || !queryName.trim() || !queryId) return;
		setIsExecuting(true);
		setError(null);

		updateQueryMutation.mutate(
			{
				id: Number(queryId),
				query: queryText,
				name: queryName,
				tabId: selectedTabId === "uncategorized" ? null : Number(selectedTabId),
			},
			{
				onSuccess: () => {
					executeSavedQueryMutation.mutate({ id: Number(queryId) });
				},
			}
		);
	};

	// Memoized header actions
	const headerActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					onClick={handleExecute}
					disabled={isExecuting || !queryText.trim()}
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					Run
				</Button>
				<Button
					onClick={handleSaveAndExecute}
					disabled={isExecuting || !queryText.trim() || !queryName.trim()}
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					Save & Run
				</Button>
			</>
		),
		[isExecuting, queryText, queryName]
	);

	// Memoized floating actions when layout hidden
	const floatingActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExecute}
					disabled={isExecuting || !queryText.trim()}
					className="shadow-md"
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					Run
				</Button>
				<Button
					size="sm"
					onClick={handleSaveAndExecute}
					disabled={isExecuting || !queryText.trim() || !queryName.trim()}
					className="shadow-md"
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					Save & Run
				</Button>
			</>
		),
		[isExecuting, queryText, queryName]
	);

	// Register header
	useHeader({
		title: "Edit Query",
		subtitle: `Connection: ${currentConnection?.name || `ID: ${connectionId}`}`,
		backHref: `/home/${dbname}/query`,
		actions: headerActions,
		floatingActions: floatingActions,
	});

	// Track in recent pages with query name
	useRecentPage({
		title: existingQuery?.name || "Query",
		subtitle: "Edit Query",
		icon: "Code",
	});

	if (!queryId) {
		return null; // Will redirect
	}

	if (isLoadingQuery) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!existingQuery) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Query not found</p>
				<Button
					onClick={() => router.push(`/home/${dbname}/query`)}
					variant="outline"
				>
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<div className="relative h-full">
			{/* Editor content */}
			<div className="flex flex-col gap-4 p-6">
				<div className="shrink-0">
					<div className="mb-4 flex gap-4">
						<Input
							value={queryName}
							onChange={e => setQueryName(e.target.value)}
							placeholder="Query name..."
							className="flex-1"
						/>
						<Select value={selectedTabId} onValueChange={setSelectedTabId}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Select Tab" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="uncategorized">Uncategorized</SelectItem>
								{tabs.map(tab => (
									<SelectItem key={tab.id} value={String(tab.id)}>
										{tab.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<textarea
						value={queryText}
						onChange={e => setQueryText(e.target.value)}
						className="h-48 w-full resize-none rounded-lg border border-border bg-muted p-4 font-mono text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="SELECT * FROM table_name LIMIT 10;"
						onKeyDown={e => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
								e.preventDefault();
								handleExecute();
							}
						}}
					/>
					<p className="mt-2 text-muted-foreground text-xs">
						Press Cmd/Ctrl + Enter to execute
					</p>
				</div>

				{/* Results */}
				<div className="flex-1 overflow-hidden">
					{error && (
						<Card className="border-destructive/50 bg-destructive/5 p-4">
							<div className="flex items-start gap-3">
								<AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
								<div>
									<p className="font-medium text-destructive">
										Query execution failed
									</p>
									<p className="mt-1 text-muted-foreground text-sm">{error}</p>
								</div>
							</div>
						</Card>
					)}

					{result && (
						<div className="flex h-full flex-col overflow-hidden rounded-lg border border-border">
							{/* Result stats */}
							<div className="flex items-center gap-4 border-border border-b bg-muted/50 px-4 py-2">
								<div className="flex items-center gap-2 text-muted-foreground text-sm">
									<RowsIcon className="h-4 w-4" />
									<span>{result.rowCount} rows</span>
								</div>
								{executionTime !== null && (
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<Clock className="h-4 w-4" />
										<span>{executionTime}ms</span>
									</div>
								)}
							</div>

							{/* Result table */}
							<div className="h-full flex-1 overflow-hidden bg-background p-4">
								{result.rows.length > 0 ? (
									<AdvancedTableViewer
										dbName={dbname}
										tableName={`query-editor-${queryId}`}
										columns={columns}
										rows={result.rows}
										transformations={[]}
										filters={[]}
									/>
								) : (
									<div className="flex h-full items-center justify-center text-muted-foreground">
										{result.command === "SELECT"
											? "No rows returned"
											: `Query executed successfully. ${result.rowCount} rows affected.`}
									</div>
								)}
							</div>
						</div>
					)}

					{!result && !error && (
						<Card className="flex h-full items-center justify-center text-muted-foreground">
							Run a query to see results
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
