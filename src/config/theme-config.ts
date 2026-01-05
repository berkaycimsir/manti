export const THEME_COLORS = [
	{ value: "zinc", label: "Gray", class: "bg-zinc-950 dark:bg-zinc-100" },
	{ value: "red", label: "Red", class: "bg-red-500" },
	{ value: "blue", label: "Blue", class: "bg-blue-500" },
	{ value: "green", label: "Green", class: "bg-green-500" },
	{ value: "orange", label: "Orange", class: "bg-orange-500" },
	{ value: "violet", label: "Violet", class: "bg-violet-500" },
	{ value: "yellow", label: "Yellow", class: "bg-yellow-500" },
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number]["value"];
