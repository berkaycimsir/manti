"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface DatabaseBrowserProps {
	connectionId: number;
}

export function DatabaseBrowser({ connectionId }: DatabaseBrowserProps) {
	const [selectedTable, setSelectedTable] = useState<string | null>(null);
	const [query, setQuery] = useState<string>("SELECT * FROM ");
	const [queryResult, setQueryResult] = useState<{
		rows: Array<Record<string, unknown>>;
		rowCount: number;
		command?: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);

	const { data: tables, isLoading: tablesLoading } =
		api.database.getTables.useQuery({ connectionId });

	const { data: columns, isLoading: columnsLoading } =
		api.database.getTableColumns.useQuery(
			{ connectionId, tableName: selectedTable || "" },
			{ enabled: !!selectedTable },
		);

	const executeQueryMutation = api.database.executeQuery.useMutation();

	const handleExecuteQuery = async () => {
		if (!query.trim()) return;

		setLoading(true);
		try {
			const result = await executeQueryMutation.mutateAsync({
				connectionId,
				query: query.trim(),
			});
			setQueryResult(result);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-4">
				{/* Tables Panel */}
				<div className="rounded border border-gray-200 p-3">
					<h3 className="mb-2 font-semibold">Tables</h3>
					{tablesLoading ? (
						<div className="text-gray-500 text-sm">Loading tables...</div>
					) : tables?.length ? (
						<div className="max-h-96 space-y-1 overflow-y-auto">
							{tables.map((table) => (
								<button
									key={`table-${table.name}`}
									type="button"
									onClick={() => setSelectedTable(table.name)}
									className={`block w-full rounded px-2 py-1 text-left text-sm ${
										selectedTable === table.name
											? "bg-blue-100 text-blue-900"
											: "hover:bg-gray-100"
									}`}
								>
									{table.name}
								</button>
							))}
						</div>
					) : (
						<div className="text-gray-500 text-sm">No tables found</div>
					)}
				</div>

				{/* Columns Panel */}
				<div className="rounded border border-gray-200 p-3">
					<h3 className="mb-2 font-semibold">Columns</h3>
					{!selectedTable ? (
						<div className="text-gray-500 text-sm">Select a table</div>
					) : columnsLoading ? (
						<div className="text-gray-500 text-sm">Loading columns...</div>
					) : columns?.length ? (
						<div className="max-h-96 space-y-1 overflow-y-auto">
							{columns.map((col) => (
								<div key={`col-${col.name}`} className="text-xs">
									<div className="font-medium">{col.name}</div>
									<div className="text-gray-500">
										{col.type}
										{col.nullable ? "" : " NOT NULL"}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-gray-500 text-sm">No columns found</div>
					)}
				</div>

				{/* Info Panel */}
				<div className="rounded border border-gray-200 p-3">
					<h3 className="mb-2 font-semibold">Info</h3>
					<div className="space-y-1 text-xs">
						<div>
							<span className="font-medium">Tables:</span> {tables?.length || 0}
						</div>
						<div>
							<span className="font-medium">Selected:</span>{" "}
							{selectedTable || "-"}
						</div>
						<div>
							<span className="font-medium">Columns:</span>{" "}
							{columns?.length || 0}
						</div>
					</div>
				</div>
			</div>

			{/* Query Editor */}
			<div className="space-y-2 rounded border border-gray-200 p-3">
				<h3 className="font-semibold">SQL Query</h3>
				<textarea
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="h-24 w-full rounded border border-gray-200 p-2 font-mono text-sm"
					placeholder="SELECT * FROM table_name"
				/>
				<button
					type="button"
					onClick={handleExecuteQuery}
					disabled={loading || executeQueryMutation.isPending}
					className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-green-300"
				>
					{loading ? "Executing..." : "Execute Query"}
				</button>

				{executeQueryMutation.error && (
					<div className="rounded bg-red-100 p-2 text-red-800">
						{executeQueryMutation.error.message}
					</div>
				)}
			</div>

			{/* Query Results */}
			{queryResult && (
				<div className="space-y-2 rounded border border-gray-200 p-3">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold">
							Results ({queryResult.rowCount} rows)
						</h3>
						{queryResult.command && (
							<span className="text-gray-500 text-xs">
								{queryResult.command}
							</span>
						)}
					</div>

					{queryResult.rows.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse text-sm">
								<thead>
									<tr className="border-b bg-gray-100">
										{Object.keys(queryResult.rows[0] || {}).map((key) => (
											<th
												key={`header-${key}`}
												className="border-r px-2 py-1 text-left font-medium"
											>
												{key}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{queryResult.rows.map((row, idx) => (
										<tr
											key={`row-${idx}-${JSON.stringify(row)}`}
											className="border-b"
										>
											{Object.entries(row).map(([colName, value]) => (
												<td
													key={`cell-${colName}`}
													className="border-r px-2 py-1 text-xs"
												>
													{value === null ? (
														<span className="text-gray-400">NULL</span>
													) : (
														String(value)
													)}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="text-gray-500 text-sm">
							{queryResult.command === "SELECT"
								? "No results"
								: "Query executed successfully"}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
