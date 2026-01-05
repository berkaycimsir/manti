"use client";

import { Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface TruncatedCellProps {
	value: string;
	wordWrap: boolean;
}

export function TruncatedCell({ value, wordWrap }: TruncatedCellProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isTruncated, setIsTruncated] = useState(false);
	const textRef = useRef<HTMLDivElement>(null);

	const checkTruncation = useCallback(() => {
		if (textRef.current) {
			const { scrollWidth, clientWidth } = textRef.current;
			setIsTruncated(scrollWidth > clientWidth);
		}
	}, []);

	useEffect(() => {
		const element = textRef.current;
		if (!element) return;

		const observer = new ResizeObserver(() => {
			checkTruncation();
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, [checkTruncation]);

	useEffect(() => {
		checkTruncation();
		void value;
		void wordWrap;
	}, [checkTruncation, value, wordWrap]);

	if (wordWrap) {
		return (
			<div className="wrap-anywhere whitespace-pre-wrap text-sm">{value}</div>
		);
	}

	return (
		<Popover
			open={isOpen && isTruncated}
			onOpenChange={open => {
				if (open) checkTruncation();
				setIsOpen(open);
			}}
		>
			<PopoverTrigger asChild>
				<div
					ref={textRef}
					className={cn(
						"truncate text-sm transition-colors",
						isTruncated
							? "cursor-pointer hover:underline hover:underline-offset-2"
							: ""
					)}
					onMouseEnter={checkTruncation}
				>
					{value}
				</div>
			</PopoverTrigger>
			{isTruncated && (
				<PopoverContent className="max-h-96 w-96 overflow-y-auto">
					<div className="space-y-2">
						<p className="font-semibold text-foreground text-sm">
							Full Content
						</p>
						<div className="wrap-anywhere whitespace-pre-wrap rounded border border-border bg-muted/30 p-3 font-mono text-sm">
							{value}
						</div>
						<Button
							size="sm"
							variant="outline"
							className="w-full"
							onClick={() => {
								navigator.clipboard.writeText(value);
							}}
						>
							<Copy className="mr-2 h-3 w-3" />
							Copy to clipboard
						</Button>
					</div>
				</PopoverContent>
			)}
		</Popover>
	);
}
