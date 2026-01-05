"use client";

import { PanelLeftClose } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { useLayoutStore } from "~/stores/layout-store";

export function SidebarHeader() {
	const hideLayout = useLayoutStore(state => state.hideLayout);

	return (
		<div className="border-sidebar-border border-b p-4">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Image src="/manti.png" alt="manti" width={28} height={28} />
					<h1 className="font-bold text-lg text-sidebar-foreground">manti</h1>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={hideLayout}
					className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
					title="Hide Sidebar"
				>
					<PanelLeftClose className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
