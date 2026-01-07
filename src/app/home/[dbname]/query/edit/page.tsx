"use client";

import { Button } from "@shared/components/ui/button";
import { useHeader } from "@shared/hooks/use-header";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useRecentPage } from "@shared/hooks/use-recent-page";
import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	QueryEditor,
	QueryEditorActions,
	QueryEditorFloatingActions,
} from "~/features/saved-queries";
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

	// Ensure selected tab is valid; fallback to uncategorized if deleted
	useEffect(() => {
		if (selectedTabId !== "uncategorized") {
			const exists = tabs.some(t => String(t.id) === selectedTabId);
			if (!exists) {
				setSelectedTabId("uncategorized");
			}
		}
	}, [tabs, selectedTabId]);

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

	// Update saved query mutation
	const updateQueryMutation = api.database.updateSavedQuery.useMutation(
		useMutationFactory({
			disableErrorToast: true, // Handle in executeSavedQueryMutation
			onSuccess: () => {
				void utils.database.listSavedQueries.invalidate();
				void utils.database.getSavedQuery.invalidate({ id: Number(queryId) });
			},
		})
	);

	// Execute saved query mutation
	const executeSavedQueryMutation = api.database.executeSavedQuery.useMutation(
		useMutationFactory({
			successMessage: "Query executed",
			onSuccess: data => {
				if (!data) return;
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
		})
	);

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
		handleExecute();
	};

	// Header actions
	const headerActions = useMemo(
		() => (
			<QueryEditorActions
				isExecuting={isExecuting}
				queryText={queryText}
				queryName={queryName}
				onExecute={handleExecute}
				onSaveAndExecute={handleSaveAndExecute}
			/>
		),
		[isExecuting, queryText, queryName]
	);

	const floatingActions = useMemo(
		() => (
			<QueryEditorFloatingActions
				isExecuting={isExecuting}
				queryText={queryText}
				queryName={queryName}
				onExecute={handleExecute}
				onSaveAndExecute={handleSaveAndExecute}
			/>
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

	// Track in recent pages
	useRecentPage({
		title: existingQuery?.name || "Query",
		subtitle: "Edit Query",
		icon: "Code",
	});

	if (!queryId) return null;

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
		<QueryEditor
			dbName={dbname}
			editorId={queryId}
			queryName={queryName}
			onQueryNameChange={setQueryName}
			queryText={queryText}
			onQueryTextChange={setQueryText}
			selectedTabId={selectedTabId}
			onTabChange={setSelectedTabId}
			tabs={tabs}
			isExecuting={isExecuting}
			onExecute={handleExecute}
			onSaveAndExecute={handleSaveAndExecute}
			result={result}
			error={error}
			executionTime={executionTime}
		/>
	);
}
