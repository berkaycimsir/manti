"use client";

import type * as React from "react";
import { cn } from "~/lib/utils";

interface MutedProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** Text size */
	size?: "xs" | "sm" | "base";
	/** Italic style */
	italic?: boolean;
	/** Render as different element */
	as?: "span" | "p" | "div";
}

const sizeClasses = {
	xs: "text-xs",
	sm: "text-sm",
	base: "text-base",
};

/**
 * Muted text component for secondary content.
 * Replaces repeated `text-muted-foreground text-*` patterns.
 */
export function Muted({
	size = "sm",
	italic = false,
	as: Component = "span",
	className,
	children,
	...props
}: MutedProps) {
	return (
		<Component
			className={cn(
				"text-muted-foreground",
				sizeClasses[size],
				italic && "italic",
				className
			)}
			{...props}
		>
			{children}
		</Component>
	);
}
