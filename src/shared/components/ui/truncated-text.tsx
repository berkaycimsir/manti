"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@shared/components/ui/popover";
import { cn } from "@shared/lib/utils";

interface TruncatedTextProps {
	text: string;
	maxLength?: number;
	className?: string;
	popoverTitle?: string;
}

export function TruncatedText({
	text,
	maxLength = 20,
	className,
	popoverTitle,
}: TruncatedTextProps) {
	const isTruncated = text.length > maxLength;
	const displayedText = isTruncated
		? `${text.substring(0, maxLength)}...`
		: text;

	if (!isTruncated) {
		return <span className={cn("font-mono", className)}>{text}</span>;
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"text-left font-mono transition-colors hover:text-primary focus:outline-none",
						className
					)}
					onClick={e => e.stopPropagation()}
				>
					{displayedText}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto max-w-[300px] break-all border border-border bg-popover p-3 text-popover-foreground text-xs shadow-lg"
				onClick={e => e.stopPropagation()}
			>
				<div className="space-y-1">
					{popoverTitle && (
						<p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
							{popoverTitle}
						</p>
					)}
					<p className="font-mono">{text}</p>
				</div>
			</PopoverContent>
		</Popover>
	);
}
