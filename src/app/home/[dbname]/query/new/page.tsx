"use client";

import { useHeader } from "@shared/hooks/use-header";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useRecentPage } from "@shared/hooks/use-recent-page";
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

export default function NewQueryPage() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const dbname = params?.dbname as string;
	const prefill = searchParams.get("prefill");
	const returnTo = searchParams.get("returnTo");

	const [queryName, setQueryName] = useState("");
	const [queryText, setQueryText] = useState(prefill || "");
	const [selectedTabId, setSelectedTabId] = useState<string>("uncategorized");
	const [result, setResult] = useState<QueryResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [executionTime, setExecutionTime] = useState<number | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);

	// Handle prefill updates
	useEffect(() => {
		if (prefill) {
			setQueryText(prefill);
		}
	}, [prefill]);

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch connections to get the full name
	const { data: connections = [] } = api.database.listConnections.useQuery();
	const currentConnection = connections.find(c => c.id === connectionId);

	// Fetch tabs
	const { data: tabs = [] } = api.database.listTabs.useQuery({ connectionId });

	const utils = api.useUtils();

	// Execute query mutation (without saving)
	const executeQueryMutation = api.database.executeQuery.useMutation(
		useMutationFactory({
			onSuccess: data => {
				setResult(data);
				setError(null);
				setIsExecuting(false);
			},
			onError: err => {
				setError(err.message);
				setResult(null);
				setIsExecuting(false);
			},
		})
	);

	// Execute and save mutation
	const executeAndSaveMutation = api.database.executeAndSaveQuery.useMutation(
		useMutationFactory({
			successMessage: "Query saved and executed",
			onSuccess: data => {
				setResult(data.result);
				setExecutionTime(data.executionTimeMs);
				setError(null);
				setIsExecuting(false);
				void utils.database.listSavedQueries.invalidate();
				router.push(`/home/${dbname}/query/edit?id=${data.id}`);
			},
			onError: err => {
				setError(err.message);
				setResult(null);
				setIsExecuting(false);
			},
		})
	);

	const handleExecute = () => {
		if (!queryText.trim()) return;
		setIsExecuting(true);
		setError(null);
		const startTime = Date.now();

		executeQueryMutation.mutate(
			{ connectionId, query: queryText },
			{
				onSuccess: () => {
					setExecutionTime(Date.now() - startTime);
				},
			}
		);
	};

	const handleSaveAndExecute = () => {
		if (!queryText.trim() || !queryName.trim()) return;
		setIsExecuting(true);
		setError(null);

		executeAndSaveMutation.mutate({
			connectionId,
			name: queryName,
			query: queryText,
			tabId: selectedTabId === "uncategorized" ? null : Number(selectedTabId),
		});
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
		title: "New Query",
		subtitle: `Connection: ${currentConnection?.name || `ID: ${connectionId}`}`,
		backHref: returnTo ? decodeURIComponent(returnTo) : `/home/${dbname}/query`,
		actions: headerActions,
		floatingActions: floatingActions,
	});

	// Track in recent pages
	useRecentPage({
		title: "New Query",
		subtitle: "Create",
		icon: "Code",
	});

	return (
		<QueryEditor
			dbName={dbname}
			editorId="new"
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
