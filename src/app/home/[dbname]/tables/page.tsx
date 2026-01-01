"use client";

import { ChevronDown, ChevronRight, Table } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	ColumnsSkeleton,
	TablesListSkeleton,
} from "~/components/ui/content-skeletons";
import { useLayoutStore } from "~/stores/layout-store";
import { api } from "~/trpc/react";

interface TableCardProps {
	table: { name: string; schema: string };
	connectionId: number;
	dbname: string;
	isExpanded: boolean;
	onToggle: () => void;
}

function TableCard({
	table,
	connectionId,
	dbname,
	isExpanded,
	onToggle,
}: TableCardProps) {
	const router = useRouter();

	// Fetch columns only when expanded
	const { data: columns = [], isLoading: columnsLoading } =
		api.database.getTableColumns.useQuery(
			{ connectionId, tableName: table.name, schemaName: table.schema },
			{ enabled: isExpanded && connectionId > 0 },
		);

	return (
		<Card
			className={`cursor-pointer p-6 transition-shadow hover:shadow-md ${
				isExpanded ? "border-primary ring-1 ring-primary" : ""
			}`}
			onClick={onToggle}
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					{isExpanded ? (
						<ChevronDown className="h-5 w-5 text-muted-foreground" />
					) : (
						<ChevronRight className="h-5 w-5 text-muted-foreground" />
					)}
					<div>
						<h3 className="font-semibold text-foreground text-lg">
							{table.name}
						</h3>
						<p className="text-muted-foreground text-sm">
							Schema: {table.schema}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={(e) => {
						e.stopPropagation();
						router.push(
							`/home/${dbname}/${encodeURIComponent(
								table.name,
							)}?schema=${encodeURIComponent(table.schema)}`,
						);
					}}
				>
					View
				</Button>
			</div>

			{isExpanded && columnsLoading ? (
				<ColumnsSkeleton columns={4} />
			) : isExpanded && columns.length > 0 ? (
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
	);
}

export default function TablesPage() {
	const params = useParams();
	const dbname = params?.dbname as string;
	const _isLayoutVisible = useLayoutStore((state) => state.isLayoutVisible);

	const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Fetch real tables from the database
	const {
		data: tables = [],
		isLoading: tablesLoading,
		error: tablesError,
	} = api.database.getTables.useQuery(
		{ connectionId },
		{ enabled: connectionId > 0 },
	);

	const toggleTable = (tableName: string) => {
		setExpandedTables((prev) => {
			const next = new Set(prev);
			if (next.has(tableName)) {
				next.delete(tableName);
			} else {
				next.add(tableName);
			}
			return next;
		});
	};

	if (tablesLoading) {
		return <TablesListSkeleton tables={6} />;
	}

	if (tablesError) {
		return (
			<Card className="border-destructive/50 bg-destructive/5 p-6">
				<p className="font-medium text-destructive">Error loading tables</p>
				<p className="text-muted-foreground text-sm">
					{tablesError instanceof Error
						? tablesError.message
						: "Failed to load tables"}
				</p>
			</Card>
		);
	}

	if (tables.length === 0) {
		return (
			<Card className="p-12 text-center">
				<Table className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<p className="text-muted-foreground">
					No tables found in this database
				</p>
			</Card>
		);
	}

	return (
		<div className="relative space-y-4">
			{tables.map((table) => (
				<TableCard
					key={`${table.schema}.${table.name}`}
					table={table}
					connectionId={connectionId}
					dbname={dbname}
					isExpanded={expandedTables.has(table.name)}
					onToggle={() => toggleTable(table.name)}
				/>
			))}
		</div>
	);
}
