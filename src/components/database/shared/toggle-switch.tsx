"use client";

import { cn } from "~/lib/utils";

interface ToggleSwitchProps {
	enabled: boolean;
	onChange: (enabled: boolean) => void;
	disabled?: boolean;
	size?: "sm" | "md";
}

export function ToggleSwitch({
	enabled,
	onChange,
	disabled = false,
	size = "md",
}: ToggleSwitchProps) {
	const sizeClasses = {
		sm: {
			track: "h-5 w-9",
			thumb: "h-3 w-3",
			translate: enabled ? "translate-x-5" : "translate-x-1",
		},
		md: {
			track: "h-6 w-11",
			thumb: "h-4 w-4",
			translate: enabled ? "translate-x-6" : "translate-x-1",
		},
	};

	const classes = sizeClasses[size];

	return (
		<button
			type="button"
			role="switch"
			aria-checked={enabled}
			disabled={disabled}
			className={cn(
				"relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
				classes.track,
				enabled ? "bg-primary" : "bg-muted",
				disabled && "cursor-not-allowed opacity-50"
			)}
			onClick={() => !disabled && onChange(!enabled)}
		>
			<span
				className={cn(
					"inline-block rounded-full bg-background shadow-sm transition-transform",
					classes.thumb,
					classes.translate
				)}
			/>
		</button>
	);
}
