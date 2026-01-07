"use client";

import ToggleThemeButton from "@shared/components/common/theme-toggle";
import { Button } from "@shared/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";

export function SidebarFooter() {
	return (
		<div className="border-sidebar-border border-t p-4">
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="sm"
					className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
					asChild
				>
					<Link href="/home/settings">
						<Settings className="h-4 w-4" />
						Settings
					</Link>
				</Button>
				<ToggleThemeButton />
			</div>
		</div>
	);
}
