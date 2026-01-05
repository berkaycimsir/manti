"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

import { THEME_COLORS } from "~/config/theme-config";
import { useThemeStore } from "~/stores/theme-store";

function ThemeWatcher() {
	const color = useThemeStore(state => state.color);
	const overrideColor = useThemeStore(state => state.overrideColor);
	const activeColor = overrideColor ?? color;

	React.useEffect(() => {
		const themes = THEME_COLORS.map(c => c.value);
		// Remove all existing theme classes
		document.body.classList.remove(...themes.map(t => `theme-${t}`));

		// Add current theme class if not default (zinc)
		if (activeColor !== "zinc") {
			document.body.classList.add(`theme-${activeColor}`);
		}
	}, [activeColor]);

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
