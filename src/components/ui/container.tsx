"use client";

import type * as React from "react";
import { cn } from "~/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Full width mode */
	fullWidth?: boolean;
	/** Padding inside container */
	padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
	none: "",
	sm: "p-2",
	md: "p-4",
	lg: "p-6",
};

/**
 * Bordered container with rounded corners.
 * Replaces repeated `rounded-lg border border-border overflow-hidden` patterns.
 */
export function Container({
	fullWidth = false,
	padding = "none",
	className,
	children,
	...props
}: ContainerProps) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-border",
				fullWidth && "w-full",
				paddingClasses[padding],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
