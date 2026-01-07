"use client";

import { Button } from "@shared/components/ui/button";
import { Card } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import {
	AlertCircle,
	Clock,
	Loader2,
	Play,
	RowsIcon,
	Save,
} from "lucide-react";
import { useMemo } from "react";
import { AdvancedTableViewer } from "~/features/table-explorer";

interface QueryResult {
	rows: Array<Record<string, unknown>>;
	rowCount: number;
	command?: string;
}

interface Tab {
	id: number;
	name: string;
}

interface QueryEditorProps {
	/** Database identifier for table viewer */
	dbName: string;
	/** Unique identifier for this editor instance */
	editorId: string;
	/** Query name input */
	queryName: string;
	onQueryNameChange: (name: string) => void;
	/** Query text input */
	queryText: string;
	onQueryTextChange: (text: string) => void;
	/** Tab selection */
	selectedTabId: string;
	onTabChange: (tabId: string) => void;
	tabs: Tab[];
	/** Execution state */
	isExecuting: boolean;
	onExecute: () => void;
	onSaveAndExecute: () => void;
	/** Results */
	result: QueryResult | null;
	error: string | null;
	executionTime: number | null;
}

export function QueryEditor({
	dbName,
	editorId,
	queryName,
	onQueryNameChange,
	queryText,
	onQueryTextChange,
	selectedTabId,
	onTabChange,
	tabs,
	isExecuting,
	onExecute,
	onSaveAndExecute,
	result,
	error,
	executionTime,
}: QueryEditorProps) {
	// Calculate columns for result table
	const columns = useMemo(() => {
		if (!result?.rows?.length) return [];
		const firstRow = result.rows[0];
		return Object.keys(firstRow || {}).map(key => ({
			name: key,
			type: "text",
		}));
	}, [result]);

	return (
		<div className="relative h-full">
			<div className="flex flex-col gap-4 p-6">
				{/* Query input section */}
				<div className="shrink-0">
					<div className="mb-4 flex gap-4">
						<Input
							value={queryName}
							onChange={e => onQueryNameChange(e.target.value)}
							placeholder="Query name..."
							className="flex-1"
						/>
						<Select value={selectedTabId} onValueChange={onTabChange}>
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
						onChange={e => onQueryTextChange(e.target.value)}
						className="h-48 w-full resize-none rounded-lg border border-border bg-muted p-4 font-mono text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="SELECT * FROM table_name LIMIT 10;"
						onKeyDown={e => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
								e.preventDefault();
								onExecute();
							}
						}}
					/>
					<p className="mt-2 text-muted-foreground text-xs">
						Press Cmd/Ctrl + Enter to execute
					</p>
				</div>

				{/* Results section */}
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
										dbName={dbName}
										tableName={`query-editor-${editorId}`}
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

/**
 * Header actions for query editor pages
 */
export function QueryEditorActions({
	isExecuting,
	queryText,
	queryName,
	onExecute,
	onSaveAndExecute,
	showSave = true,
}: {
	isExecuting: boolean;
	queryText: string;
	queryName: string;
	onExecute: () => void;
	onSaveAndExecute: () => void;
	showSave?: boolean;
}) {
	return (
		<>
			<Button
				variant="outline"
				onClick={onExecute}
				disabled={isExecuting || !queryText.trim()}
			>
				{isExecuting ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Play className="mr-2 h-4 w-4" />
				)}
				Run
			</Button>
			{showSave && (
				<Button
					onClick={onSaveAndExecute}
					disabled={isExecuting || !queryText.trim() || !queryName.trim()}
				>
					{isExecuting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					Save & Run
				</Button>
			)}
		</>
	);
}

/**
 * Floating actions for when layout is hidden
 */
export function QueryEditorFloatingActions({
	isExecuting,
	queryText,
	queryName,
	onExecute,
	onSaveAndExecute,
}: {
	isExecuting: boolean;
	queryText: string;
	queryName: string;
	onExecute: () => void;
	onSaveAndExecute: () => void;
}) {
	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={onExecute}
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
				onClick={onSaveAndExecute}
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
	);
}
