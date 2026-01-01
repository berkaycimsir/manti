"use client";

import type * as React from "react";
import { cn } from "~/lib/utils";

interface MonoProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** Text size */
	size?: "xs" | "sm" | "base";
	/** Render as different element */
	as?: "span" | "code" | "pre" | "div";
}

const sizeClasses = {
	xs: "text-xs",
	sm: "text-sm",
	base: "text-base",
};

/**
 * Monospace text component.
 * Replaces repeated `font-mono text-sm` patterns.
 */
export function Mono({
	size = "sm",
	as: Component = "span",
	className,
	children,
	...props
}: MonoProps) {
	return (
		<Component
			className={cn("font-mono", sizeClasses[size], className)}
			{...props}
		>
			{children}
		</Component>
	);
}
