"use client";

import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

export interface LucideIconProps extends LucideProps {
	name: string;
	fallback?: React.ReactNode;
}

/**
 * Dynamic Lucide icon component
 * Renders an icon by name string
 */
export function LucideIcon({ name, fallback, ...props }: LucideIconProps) {
	const icons = LucideIcons as unknown as Record<
		string,
		React.ComponentType<LucideProps>
	>;
	const Icon = icons[name];

	if (!Icon) {
		// Use provided fallback or default to HelpCircle
		if (fallback) {
			return <>{fallback}</>;
		}
		return <LucideIcons.HelpCircle {...props} />;
	}

	return <Icon {...props} />;
}
