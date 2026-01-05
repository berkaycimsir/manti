"use client";

import { Info } from "lucide-react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

/**
 * Override indicator tooltip showing locations where settings are overridden.
 */
export function OverrideIndicator({
	overrides,
	resolveLabel,
}: {
	overrides: string[];
	resolveLabel: (key: string) => string;
}) {
	if (overrides.length === 0) return null;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<Info className="h-3 w-3 text-amber-500" />
				</TooltipTrigger>
				<TooltipContent>
					<p className="mb-1 font-semibold text-xs">
						Overridden in {overrides.length} locations:
					</p>
					<ul className="list-disc space-y-0.5 pl-3 text-[10px]">
						{overrides.slice(0, 5).map(k => (
							<li key={k}>{resolveLabel(k)}</li>
						))}
						{overrides.length > 5 && <li>+ {overrides.length - 5} more</li>}
					</ul>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

/**
 * Toggle option card with label, description, and switch.
 */
export function ToggleOption({
	label,
	description,
	checked,
	onCheckedChange,
}: {
	label: string;
	description: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
			<div className="space-y-0.5">
				<Label>{label}</Label>
				<p className="text-[0.8rem] text-muted-foreground">{description}</p>
			</div>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
