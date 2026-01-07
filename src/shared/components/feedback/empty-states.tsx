import { cn } from "@shared/lib/utils";
import {
	Database,
	FileQuestion,
	Inbox,
	type LucideIcon,
	Search,
} from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	icon: Icon = Inbox,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center px-4 py-12 text-center",
				className
			)}
		>
			<div className="mb-4 rounded-full bg-muted p-4">
				<Icon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="font-semibold text-lg">{title}</h3>
			{description && (
				<p className="mt-1 max-w-sm text-muted-foreground text-sm">
					{description}
				</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

export function NoConnectionsState({ action }: { action?: ReactNode }) {
	return (
		<EmptyState
			icon={Database}
			title="No connections yet"
			description="Add your first database connection to get started exploring your data."
			action={action}
		/>
	);
}

export function NoTablesState() {
	return (
		<EmptyState
			icon={FileQuestion}
			title="No tables found"
			description="This database doesn't have any tables, or you don't have permission to view them."
		/>
	);
}

export function NoResultsState({ query }: { query?: string }) {
	return (
		<EmptyState
			icon={Search}
			title="No results found"
			description={
				query
					? `No results match "${query}". Try adjusting your search.`
					: "No results match your search criteria."
			}
		/>
	);
}

export function NoQueriesState({ action }: { action?: ReactNode }) {
	return (
		<EmptyState
			icon={FileQuestion}
			title="No saved queries"
			description="Save your first query to access it quickly later."
			action={action}
		/>
	);
}
