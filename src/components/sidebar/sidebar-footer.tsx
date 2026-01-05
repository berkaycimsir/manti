"use client";

import { Settings } from "lucide-react";
import ToggleThemeButton from "~/components/toggle-theme-button";
import { Button } from "~/components/ui/button";

export function SidebarFooter() {
	return (
		<div className="border-sidebar-border border-t p-4">
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
				>
					<Settings className="h-4 w-4" />
					Settings
				</Button>
				<ToggleThemeButton />
			</div>
		</div>
	);
}
