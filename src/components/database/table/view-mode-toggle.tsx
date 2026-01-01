"use client";

import { FileText, Grid3x3, type LucideIcon, Rows } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";

export type ViewMode = "grid" | "transpose" | "text";

interface ViewModeOption {
	value: ViewMode;
	label: string;
	icon: LucideIcon;
}

const viewModeOptions: ViewModeOption[] = [
	{ value: "grid", label: "Grid", icon: Grid3x3 },
	{ value: "transpose", label: "Transpose", icon: Rows },
	{ value: "text", label: "Text", icon: FileText },
];

interface ViewModeToggleProps {
	value: ViewMode;
	onValueChange: (value: ViewMode) => void;
	className?: string;
}

/**
 * View mode toggle component for switching between Grid, Transpose, and Text views.
 */
export function ViewModeToggle({
	value,
	onValueChange,
	className,
}: ViewModeToggleProps) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			onValueChange={(val) => val && onValueChange(val as ViewMode)}
			className={cn("rounded-md border border-border p-0.5", className)}
		>
			{viewModeOptions.map((option) => (
				<ToggleGroupItem
					key={option.value}
					value={option.value}
					aria-label={option.label}
					className="h-7 gap-1.5 px-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
				>
					<option.icon className="h-4 w-4" />
					{option.label}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
