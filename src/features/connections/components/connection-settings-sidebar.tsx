"use client";

import { TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { cn } from "@shared/lib/utils";
import { Globe, Palette, Shield, Terminal, Wifi } from "lucide-react";

interface ConnectionSettingsSidebarProps
	extends React.HTMLAttributes<HTMLElement> {}

export function ConnectionSettingsSidebar({
	className,
	...props
}: ConnectionSettingsSidebarProps) {
	return (
		<aside className={cn("h-full", className)} {...props}>
			<TabsList className="flex h-auto space-x-2 overflow-x-auto bg-transparent p-0 px-4 py-6 lg:flex-col lg:space-x-0 lg:space-y-1 lg:px-4">
				<TabsTrigger
					value="general"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Palette className="mr-2 h-4 w-4" />
					General
				</TabsTrigger>
				<TabsTrigger
					value="execution"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Terminal className="mr-2 h-4 w-4" />
					Execution
				</TabsTrigger>
				<TabsTrigger
					value="safety"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Shield className="mr-2 h-4 w-4" />
					Safety
				</TabsTrigger>
				<TabsTrigger
					value="network"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Wifi className="mr-2 h-4 w-4" />
					Network
				</TabsTrigger>
				<TabsTrigger
					value="global-rules"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Globe className="mr-2 h-4 w-4" />
					Global Rules
				</TabsTrigger>
			</TabsList>
		</aside>
	);
}
