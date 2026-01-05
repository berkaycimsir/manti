"use client";

import type * as React from "react";
import { cn } from "~/lib/utils";

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

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Gap between items */
	gap?: GapSize;
	/** Vertical alignment */
	align?: "start" | "center" | "end" | "stretch" | "baseline";
	/** Horizontal distribution */
	justify?: "start" | "center" | "end" | "between" | "around";
	/** Allow wrapping */
	wrap?: boolean;
	/** Render as different element */
	as?: "div" | "span" | "section" | "nav";
}

const alignClasses = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

const justifyClasses = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
};

/**
 * Flex container with configurable gap, alignment, and justification.
 * Replaces repeated `flex items-center gap-*` patterns.
 */
export function Flex({
	gap = 2,
	align = "center",
	justify = "start",
	wrap = false,
	as: Component = "div",
	className,
	children,
	...props
}: FlexProps) {
	return (
		<Component
			className={cn(
				"flex",
				gapClasses[gap],
				alignClasses[align],
				justifyClasses[justify],
				wrap && "flex-wrap",
				className
			)}
			{...props}
		>
			{children}
		</Component>
	);
}
