"use client";

import { cn } from "@shared/lib/utils";
import type * as React from "react";

type GapSize = 0 | 1 | 2 | 3 | 4 | 6 | 8;

const gapClasses: Record<GapSize, string> = {
	0: "gap-0",
	1: "gap-1",
	2: "gap-2",
	3: "gap-3",
	4: "gap-4",
	6: "gap-6",
	8: "gap-8",
};

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Gap between items */
	gap?: GapSize;
	/** Horizontal alignment */
	align?: "start" | "center" | "end" | "stretch";
}

const alignClasses = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
};

/**
 * Vertical stack container with configurable gap.
 * Replaces repeated `flex flex-col gap-*` patterns.
 */
export function Stack({
	gap = 2,
	align = "stretch",
	className,
	children,
	...props
}: StackProps) {
	return (
		<div
			className={cn(
				"flex flex-col",
				gapClasses[gap],
				alignClasses[align],
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}
