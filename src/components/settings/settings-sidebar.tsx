"use client";

import { AlertTriangle, Database, Shield, User } from "lucide-react";
import { TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLElement> {}

export function SettingsSidebar({ className, ...props }: SettingsSidebarProps) {
	return (
		<aside className={cn("h-full", className)} {...props}>
			<TabsList className="flex h-auto space-x-2 overflow-x-auto bg-transparent p-0 px-4 py-6 lg:flex-col lg:space-x-0 lg:space-y-1 lg:px-4">
				<TabsTrigger
					value="profile"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<User className="mr-2 h-4 w-4" />
					Profile
				</TabsTrigger>
				<TabsTrigger
					value="security"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Shield className="mr-2 h-4 w-4" />
					Security
				</TabsTrigger>
				<TabsTrigger
					value="data"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
				>
					<Database className="mr-2 h-4 w-4" />
					Data & Storage
				</TabsTrigger>
				<TabsTrigger
					value="danger"
					className="h-9 w-full justify-start rounded-md border border-transparent px-3 py-2 font-medium text-muted-foreground text-sm hover:bg-destructive/10 hover:text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none"
				>
					<AlertTriangle className="mr-2 h-4 w-4" />
					Danger Zone
				</TabsTrigger>
			</TabsList>
		</aside>
	);
}
