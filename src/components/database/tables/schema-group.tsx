"use client";

import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useTablesViewStore } from "~/stores/tables-view-store";

interface SchemaGroupProps {
	schema: string;
	tableCount: number;
	children: React.ReactNode;
}

export function SchemaGroup({
	schema,
	tableCount,
	children,
}: SchemaGroupProps) {
	const { collapsedSchemas, toggleSchemaCollapse } = useTablesViewStore();
	const isCollapsed = collapsedSchemas.includes(schema);

	return (
		<div className="space-y-3">
			{/* Schema Header */}
			<button
				type="button"
				onClick={() => toggleSchemaCollapse(schema)}
				className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-left transition-colors hover:bg-muted"
			>
				{isCollapsed ? (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				)}
				<Folder className="h-4 w-4 text-primary" />
				<span className="font-medium text-foreground">{schema}</span>
				<span className="ml-auto text-muted-foreground text-sm">
					{tableCount} {tableCount === 1 ? "table" : "tables"}
				</span>
			</button>

			{/* Tables */}
			{!isCollapsed && <div className="pl-4">{children}</div>}
		</div>
	);
}
