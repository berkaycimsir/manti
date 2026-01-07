"use client";

import { Flex } from "@shared/components/ui/flex";
import { Muted } from "@shared/components/ui/muted";
import { ArrowDown, ArrowUp, Clock, Rows } from "lucide-react";

interface TableFooterProps {
	totalRows: number;
	filteredRows: number;
	queryTime?: number;
	sortConfig?: { column: string; direction: "asc" | "desc" } | null;
}

/**
 * Table footer showing row counts, sort info, and shortcuts.
 */
export function TableFooter({
	totalRows,
	filteredRows,
	queryTime,
	sortConfig,
}: TableFooterProps) {
	const isFiltered = filteredRows !== totalRows;

	return (
		<div className="border-border border-t bg-muted/30 px-4 py-2 text-muted-foreground text-xs">
			<Flex justify="between">
				<Flex gap={4}>
					<Flex gap={1} as="span">
						<Rows className="h-4 w-4" />
						<Muted size="sm">
							{isFiltered ? (
								<>
									Showing {Math.min(100, filteredRows).toLocaleString()} of{" "}
									{filteredRows.toLocaleString()} rows
								</>
							) : (
								<>
									Showing {Math.min(100, totalRows).toLocaleString()} of{" "}
									{totalRows.toLocaleString()} rows
								</>
							)}
						</Muted>
					</Flex>

					{sortConfig && (
						<Flex gap={1} as="span">
							Sorted by{" "}
							<strong className="font-medium text-foreground">
								{sortConfig.column}
							</strong>
							{sortConfig.direction === "asc" ? (
								<ArrowUp className="h-3 w-3" />
							) : (
								<ArrowDown className="h-3 w-3" />
							)}
						</Flex>
					)}
				</Flex>

				<Flex gap={3} className="text-muted-foreground/70">
					<span>Double-click cell to copy</span>
					<span>•</span>
					<span>Ctrl+C to copy selected</span>
					<span>•</span>
					<span>Esc to clear</span>
					{queryTime !== undefined && (
						<>
							<span>•</span>
							<Flex gap={1} as="span">
								<Clock className="h-3.5 w-3.5" />
								<Muted size="xs">{queryTime}ms</Muted>
							</Flex>
						</>
					)}
				</Flex>
			</Flex>
		</div>
	);
}
