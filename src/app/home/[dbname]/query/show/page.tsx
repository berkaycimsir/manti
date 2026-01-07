"use client";

import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import { QueryDetailSkeleton } from "@shared/components/ui/query-skeletons";
import { useHeader } from "@shared/hooks/use-header";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useRecentPage } from "@shared/hooks/use-recent-page";
import { Clock, Code, Loader2, Pencil, Play, RowsIcon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SqlPreview } from "~/features/saved-queries";
import { AdvancedTableViewer } from "~/features/table-explorer";
import { api } from "~/trpc/react";

export default function QueryShowPage() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const dbname = params?.dbname as string;
	const queryId = searchParams.get("id");

	const [isExecuting, setIsExecuting] = useState(false);
	const [executionResult, setExecutionResult] = useState<any>(null);
	const [executionTime, setExecutionTime] = useState<number | null>(null);

	const { data: query, isLoading } = api.database.getSavedQuery.useQuery(
		{ id: Number(queryId) },
		{ enabled: !!queryId }
	);

	const executeMutation = api.database.executeSavedQuery.useMutation(
		useMutationFactory({
			onSuccess: data => {
				if (!data) {
					setIsExecuting(false);
					return;
				}
				setExecutionResult(data.result);
				setExecutionTime(data.executionTimeMs);
				setIsExecuting(false);
			},
			onError: () => {
				setIsExecuting(false);
			},
		})
	);

	const handleExecute = () => {
		if (!queryId) return;
		setIsExecuting(true);
		executeMutation.mutate({ id: Number(queryId) });
	};

	const handleBack = () => {
		router.push(`/home/${dbname}/query`);
	};

	// Derive current result
	const currentResult = useMemo(() => {
		return (
			executionResult ||
			(query?.lastResult
				? { rows: query.lastResult as any[], rowCount: query.rowCount }
				: null)
		);
	}, [executionResult, query]);

	const currentExecutionTime = executionTime ?? query?.executionTimeMs;

	const columns = useMemo(() => {
		if (!currentResult?.rows?.length) return [];
		return Object.keys(currentResult.rows[0]).map(key => ({
			name: key,
			type: "text",
		}));
	}, [currentResult]);

	// Memoized header actions
	const headerActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					onClick={() =>
						router.push(`/home/${dbname}/query/edit?id=${query?.id}`)
					}
				>
					<Pencil className="mr-2 h-4 w-4" /> Edit
				</Button>
				<Button onClick={handleExecute} disabled={isExecuting}>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					Run
				</Button>
			</>
		),
		[isExecuting, query?.id, dbname, handleExecute, router]
	);

	// Memoized floating actions for when layout is hidden
	const floatingActions = useMemo(
		() => (
			<>
				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						router.push(`/home/${dbname}/query/edit?id=${query?.id}`)
					}
					className="shadow-md"
				>
					<Pencil className="mr-2 h-4 w-4" /> Edit
				</Button>
				<Button
					onClick={handleExecute}
					disabled={isExecuting}
					size="sm"
					className="shadow-md"
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					Run
				</Button>
			</>
		),
		[isExecuting, query?.id, dbname, handleExecute, router]
	);

	// Memoized subtitle with badge
	const subtitle = useMemo(() => {
		if (!query) return null;
		return (
			<div className="flex items-center gap-2">
				<span>ID: {query.id}</span>
				{query.tabId && (
					<Badge variant="secondary" className="font-normal text-xs">
						Tab: {query.tabId}
					</Badge>
				)}
			</div>
		);
	}, [query]);

	// Register header
	useHeader({
		title: query?.name || "Query Details",
		subtitle: subtitle,
		onBack: handleBack,
		actions: headerActions,
		floatingActions: floatingActions,
	});

	// Track in recent pages with specific query name
	useRecentPage({
		title: query?.name || "Query",
		subtitle: "Query Details",
		icon: "Code",
	});

	if (isLoading) {
		return <QueryDetailSkeleton />;
	}

	if (!query) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Query not found</p>
				<Button onClick={handleBack} variant="outline">
					Go Back
				</Button>
			</div>
		);
	}

	return (
		<div className="relative h-full">
			{/* Content */}
			<div className="flex flex-col gap-6 p-6">
				{/* Query Code - Always show SQL Query */}
				<Card className="border-muted bg-muted/50 p-4">
					<div className="mb-2 flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
						<Code className="h-3 w-3" /> SQL Query
					</div>
					<SqlPreview sql={query.query} maxLines={10} collapsible />
				</Card>

				{/* Results with Advanced Table Viewer */}
				<div className="flex flex-1 flex-col gap-2 overflow-hidden">
					<div className="flex min-h-10 items-center justify-between">
						{currentExecutionTime !== null && (
							<div className="flex items-center gap-4 rounded-md bg-muted/30 px-2 py-1 text-muted-foreground text-sm">
								<span className="flex items-center gap-1">
									<RowsIcon className="h-3 w-3" />{" "}
									{currentResult?.rowCount ?? 0} rows
								</span>
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" /> {currentExecutionTime}ms
								</span>
							</div>
						)}
					</div>

					{currentResult?.rows?.length ? (
						<div className="h-full flex-1">
							<AdvancedTableViewer
								dbName={dbname}
								tableName={`query-${queryId}`}
								columns={columns}
								rows={currentResult.rows}
								transformations={[]}
								filters={[]}
							/>
						</div>
					) : (
						<div className="flex flex-1 items-center justify-center rounded-lg border text-muted-foreground">
							No results available
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
