"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface TextFieldProps {
	columnName: string;
	value: unknown;
	maxCharacters: number;
	formattedValue: string;
	isNull: boolean;
	showNullDistinct: boolean;
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

export function TextField({
	columnName,
	value,
	maxCharacters,
	formattedValue,
	isNull,
	showNullDistinct,
}: TextFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Detect dark mode from CSS
	const isDark =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;

	const color = useMemo(
		() => getColumnColor(columnName, isDark),
		[columnName, isDark]
	);

	const displayValue = useMemo(
		() => formatDisplayValue(value, formattedValue),
		[value, formattedValue]
	);

	const prettyValue = useMemo(
		() => getPrettyValue(value, formattedValue),
		[value, formattedValue]
	);

	const isTruncated = displayValue.length > maxCharacters;
	const truncatedValue = isTruncated
		? `${displayValue.slice(0, maxCharacters)}...`
		: displayValue;

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(prettyValue);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [prettyValue]);

	// Render null values with special styling
	if (isNull && showNullDistinct) {
		return (
			<span className="inline-flex items-center gap-1 overflow-hidden whitespace-nowrap">
				<span style={{ color }} className="flex-shrink-0 font-medium">
					{columnName}
				</span>
				<span className="flex-shrink-0 text-muted-foreground">:</span>
				<span className="text-muted-foreground italic">∅</span>
			</span>
		);
	}

	// Non-truncated fields don't need popover
	if (!isTruncated) {
		return (
			<span className="inline-flex items-center gap-1 overflow-hidden whitespace-nowrap">
				<span style={{ color }} className="flex-shrink-0 font-medium">
					{columnName}
				</span>
				<span className="flex-shrink-0 text-muted-foreground">:</span>
				<span className="truncate text-foreground">{displayValue}</span>
			</span>
		);
	}

	// Truncated fields with popover for full content
	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<span className="inline-flex cursor-pointer items-center gap-1 overflow-hidden whitespace-nowrap transition-opacity hover:opacity-80">
					<span style={{ color }} className="flex-shrink-0 font-medium">
						{columnName}
					</span>
					<span className="flex-shrink-0 text-muted-foreground">:</span>
					<span className="truncate text-foreground underline decoration-dotted underline-offset-2">
						{truncatedValue}
					</span>
				</span>
			</PopoverTrigger>
			<PopoverContent
				className="max-h-96 w-[400px] overflow-y-auto"
				align="start"
			>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span style={{ color }} className="font-semibold text-sm">
							{columnName}
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
	);
}
