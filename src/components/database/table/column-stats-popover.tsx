"use client";

import { Hash } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import type { ColumnStats } from "~/types/table";

interface ColumnStatsPopoverProps {
	stats: ColumnStats;
	columnName: string;
}

export function ColumnStatsPopover({
	stats,
	columnName,
}: ColumnStatsPopoverProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="hidden h-5 w-5 shrink-0 p-0 group-hover:inline-flex"
				>
					<Hash className="h-3 w-3" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3">
				<div className="space-y-2">
					<span className="font-medium text-sm">Stats: {columnName}</span>
					<div className="space-y-1 text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Count:</span>
							<span className="font-mono">{stats.count}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Null:</span>
							<span className="font-mono">{stats.nullCount}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Unique:</span>
							<span className="font-mono">{stats.uniqueCount}</span>
						</div>
						{stats.sum !== undefined && (
							<>
								<div className="my-1 border-t" />
								<div className="flex justify-between">
									<span className="text-muted-foreground">Sum:</span>
									<span className="font-mono">
										{stats.sum.toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Avg:</span>
									<span className="font-mono">{stats.avg?.toFixed(2)}</span>
								</div>
							</>
						)}
						{stats.min !== undefined && (
							<>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Min:</span>
									<span className="max-w-32 truncate font-mono">
										{String(stats.min)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Max:</span>
									<span className="max-w-32 truncate font-mono">
										{String(stats.max)}
									</span>
								</div>
							</>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
