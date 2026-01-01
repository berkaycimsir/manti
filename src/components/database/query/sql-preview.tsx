"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SqlPreviewProps {
	sql: string;
	maxLines?: number;
	className?: string;
	/** If true, show expand/collapse button when truncated */
	collapsible?: boolean;
	/** Variant: 'compact' for cards, 'full' for detail pages */
	variant?: "compact" | "full";
}

/**
 * Display SQL with optional line limit and expand/collapse.
 */
export function SqlPreview({
	sql,
	maxLines = 10,
	className,
	collapsible = false,
	variant = "full",
}: SqlPreviewProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const lines = sql.split("\n");
	const isTruncated = lines.length > maxLines;
	const displayedSql =
		isExpanded || !isTruncated ? sql : lines.slice(0, maxLines).join("\n");

	return (
		<div className={cn("relative", className)}>
			<pre
				className={cn(
					"overflow-x-auto whitespace-pre-wrap font-mono",
					variant === "compact" ? "text-xs" : "text-sm",
				)}
			>
				{displayedSql}
				{isTruncated && !isExpanded && (
					<span className="text-muted-foreground">...</span>
				)}
			</pre>

			{collapsible && isTruncated && (
				<div className="mt-2 flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-muted-foreground text-xs hover:text-foreground"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? (
							<>
								<ChevronUp className="mr-1 h-3 w-3" />
								Show Less
							</>
						) : (
							<>
								<ChevronDown className="mr-1 h-3 w-3" />
								Show {lines.length - maxLines} More Lines
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
