"use client";

import { Button } from "@shared/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@shared/components/ui/popover";
import { cn } from "@shared/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTableColumnStore } from "../../stores/column-store";

interface TextFieldProps {
	dbName?: string;
	tableName?: string;
	columnName: string;
	originalColumnName?: string;
	value: unknown;
	maxCharacters: number;
	formattedValue: string;
	isNull: boolean;
	showNullDistinct: boolean;
	wordWrap?: boolean;
}

/**
 * Generate a deterministic HSL color based on column name hash.
 * Same column always gets the same color.
 */
function getColumnColor(columnName: string, isDark: boolean): string {
	let hash = 0;
	for (let i = 0; i < columnName.length; i++) {
		hash = columnName.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash % 360);
	const saturation = 65;
	const lightness = isDark ? 70 : 35;

	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Format value for display - uses formattedValue which includes transformations
 */
function formatDisplayValue(value: unknown, formattedValue: string): string {
	// Always use formattedValue as it includes transformations
	// Only show ∅ for null if formattedValue also shows null indicator
	if (value === null || value === undefined) {
		return formattedValue === "∅" ? "∅" : formattedValue;
	}
	return formattedValue;
}

/**
 * Get pretty-printed JSON for popover display
 */
function getPrettyValue(value: unknown, formattedValue: string): string {
	if (typeof value === "object" && value !== null) {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return formattedValue;
		}
	}
	return formattedValue;
}

function ColumnName({
	dbName,
	tableName,
	columnName,
	originalColumnName,
	isDark,
}: {
	dbName?: string;
	tableName?: string;
	columnName: string;
	originalColumnName: string;
	isDark: boolean;
}) {
	const storedColor = useTableColumnStore(state =>
		dbName && tableName
			? state.getColumnColor(dbName, tableName, originalColumnName)
			: undefined
	);

	// Default now mimics secondary foreground (usually darker gray or white) or just inherits
	// We use 'text-muted-foreground' for keys by default to separate from values
	const color = storedColor;

	return (
		<span
			style={{ color: color }}
			className={cn(
				"flex-shrink-0 font-medium",
				!color && "text-muted-foreground"
			)}
		>
			{columnName}
		</span>
	);
}

export function TextField({
	dbName,
	tableName,
	columnName,
	originalColumnName,
	value,
	maxCharacters,
	formattedValue,
	isNull,
	showNullDistinct,
	wordWrap = false,
}: TextFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Detect dark mode from CSS
	const isDark =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;

	const displayValue = useMemo(
		() => formatDisplayValue(value, formattedValue),
		[value, formattedValue]
	);

	const prettyValue = useMemo(
		() => getPrettyValue(value, formattedValue),
		[value, formattedValue]
	);

	// When wordWrap is enabled, we don't truncate based on maxCharacters
	const isTruncated = !wordWrap && displayValue.length > maxCharacters;
	const displayContent = isTruncated
		? `${displayValue.slice(0, maxCharacters)}...`
		: displayValue;

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(prettyValue);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [prettyValue]);

	// Container is always inline-flex. Word wrap affects the value text only.
	const containerClass = "inline-flex items-center gap-1 whitespace-nowrap";

	// Render null values with special styling
	if (isNull && showNullDistinct) {
		return (
			<span className="inline-flex items-center gap-1 overflow-hidden whitespace-nowrap">
				<ColumnName
					dbName={dbName}
					tableName={tableName}
					columnName={columnName}
					originalColumnName={originalColumnName || columnName}
					isDark={isDark}
				/>
				<span className="flex-shrink-0 text-muted-foreground">:</span>
				<span className="text-muted-foreground italic">∅</span>
			</span>
		);
	}

	return (
		<span className={containerClass}>
			<ColumnName
				dbName={dbName}
				tableName={tableName}
				columnName={columnName}
				originalColumnName={originalColumnName || columnName}
				isDark={isDark}
			/>
			<span className="mr-1 text-muted-foreground">:</span>

			{isTruncated ? (
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<span className="cursor-pointer truncate text-foreground underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80">
							{displayContent}
						</span>
					</PopoverTrigger>
					<PopoverContent
						className="max-h-96 w-[400px] overflow-y-auto"
						align="start"
					>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-sm">
									{originalColumnName || columnName}
								</span>
								<Button
									size="sm"
									variant="ghost"
									className="h-7 gap-1.5 px-2"
									onClick={handleCopy}
								>
									{copied ? (
										<>
											<Check className="h-3 w-3" />
											Copied
										</>
									) : (
										<>
											<Copy className="h-3 w-3" />
											Copy
										</>
									)}
								</Button>
							</div>
							<div
								className={cn(
									"wrap-anywhere whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-sm",
									typeof value === "object" && "text-xs"
								)}
							>
								{prettyValue}
							</div>
						</div>
					</PopoverContent>
				</Popover>
			) : (
				<span
					className={cn(
						"text-foreground",
						wordWrap
							? "whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
							: "whitespace-nowrap"
					)}
				>
					{displayContent}
				</span>
			)}
		</span>
	);
}
