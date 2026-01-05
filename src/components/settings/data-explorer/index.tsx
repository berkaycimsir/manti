"use client";

import { HardDrive, Laptop } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TooltipProvider } from "~/components/ui/tooltip";
import { LocalDataExplorer } from "./local-explorer";
import { ServerDataExplorer } from "./server-explorer";

interface DataExplorerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTab?: "server" | "local";
}

export function DataExplorer({
	open,
	onOpenChange,
	initialTab = "local",
}: DataExplorerProps) {
	const [activeTab, setActiveTab] = useState<"server" | "local">(initialTab);

	useEffect(() => {
		if (open) setActiveTab(initialTab);
	}, [open, initialTab]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[75vh] w-full max-w-3xl flex-col overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="shrink-0 border-b px-6 py-4">
					<DialogTitle className="text-xl">Data & Storage Explorer</DialogTitle>
				</DialogHeader>
				<Tabs
					value={activeTab}
					onValueChange={v => setActiveTab(v as "server" | "local")}
					className="flex min-h-0 flex-1 flex-col"
				>
					<TabsList className="mx-6 mt-2 shrink-0 self-start">
						<TabsTrigger value="server" className="gap-2">
							<HardDrive className="h-4 w-4" />
							Cloud Data
						</TabsTrigger>
						<TabsTrigger value="local" className="gap-2">
							<Laptop className="h-4 w-4" />
							Local Storage
						</TabsTrigger>
					</TabsList>
					<TabsContent
						value="server"
						className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
					>
						<TooltipProvider>
							<ServerDataExplorer />
						</TooltipProvider>
					</TabsContent>
					<TabsContent
						value="local"
						className="mt-2 min-h-0 flex-1 data-[state=inactive]:hidden"
					>
						<LocalDataExplorer />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
