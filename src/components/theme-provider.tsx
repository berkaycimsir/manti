"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { useThemeStore } from "~/stores/theme-store";
import type { ThemeColor } from "~/stores/theme-store";

function ThemeWatcher() {
	const color = useThemeStore(state => state.color);

	React.useEffect(() => {
		const themes: ThemeColor[] = [
			"zinc",
			"red",
			"blue",
			"green",
			"orange",
			"violet",
			"yellow",
		];
		// Remove all existing theme classes
		document.body.classList.remove(...themes.map(t => `theme-${t}`));

		// Add current theme class if not default (zinc)
		if (color !== "zinc") {
			document.body.classList.add(`theme-${color}`);
		}
	}, [color]);

	return null;
}

export function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<NextThemesProvider {...props}>
			<ThemeWatcher />
			{children}
		</NextThemesProvider>
	);
}
