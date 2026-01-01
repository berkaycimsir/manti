"use client";

import type * as React from "react";
import { cn } from "~/lib/utils";
import { Muted } from "./muted";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Icon to display */
	icon?: React.ReactNode;
	/** Main message */
	message?: string;
	/** Optional description */
	description?: string;
}

/**
 * Empty state component for "no data" scenarios.
 * Replaces repeated empty state patterns.
 */
export function EmptyState({
	icon,
	message = "No data available",
	description,
	className,
	children,
	...props
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-8 text-center",
				className,
			)}
			{...props}
		>
			{icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
			<Muted size="sm" className="font-medium">
				{message}
			</Muted>
			{description && (
				<Muted size="xs" className="mt-1 max-w-sm">
					{description}
				</Muted>
			)}
			{children}
		</div>
	);
}
