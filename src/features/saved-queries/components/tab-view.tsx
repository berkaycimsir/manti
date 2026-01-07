"use client";

import { Badge } from "@shared/components/ui/badge";
import { buttonVariants } from "@shared/components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@shared/components/ui/tabs";
import { cn } from "@shared/lib/utils";
import { Pencil } from "lucide-react";
import * as React from "react";
import { QueryCard } from "./query-card";

interface TabViewProps {
	tabs: { id: number; name: string; position?: number | null }[];
	queries: any[];
	onExecute: (id: number) => void;
	onEdit: (id: number) => void;
	onDelete: (id: number) => void;
	onEditTab?: (tab: { id: number; name: string }) => void;
	isExecutingId?: number;
	isDeletingId?: number;
}

export function TabView({
	tabs,
	queries,
	onExecute,
	onEdit,
	onDelete,
	onEditTab,
	isExecutingId,
	isDeletingId,
}: TabViewProps) {
	const [expandedQueries, setExpandedQueries] = React.useState<Set<number>>(
		new Set()
	);

	const toggleExpanded = (id: number) => {
		const newExpanded = new Set(expandedQueries);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedQueries(newExpanded);
	};

	// Sort tabs by position
	const sortedTabs = React.useMemo(() => {
		return [...tabs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
	}, [tabs]);

	const uncategorizedQueries = queries.filter(q => !q.tabId);

	return (
		<Tabs defaultValue="uncategorized" className="w-full">
			<div className="flex items-center justify-between overflow-x-auto pb-2">
				<TabsList className="w-full justify-start">
					<TabsTrigger value="uncategorized" className="group">
						Uncategorized
						<Badge variant="secondary" className="ml-2 text-xs">
							{uncategorizedQueries.length}
						</Badge>
					</TabsTrigger>

					{sortedTabs.map(tab => {
						const tabQueries = queries.filter(q => q.tabId === tab.id);
						return (
							<TabsTrigger
								key={tab.id}
								value={`tab-${tab.id}`}
								className="group pr-1"
							>
								{tab.name}
								<Badge variant="secondary" className="ml-2 text-xs">
									{tabQueries.length}
								</Badge>
								{onEditTab && (
									<span
										role="button"
										tabIndex={0}
										className={cn(
											buttonVariants({ variant: "ghost", size: "icon" }),
											"ml-1 h-5 w-5 cursor-pointer opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100"
										)}
										onClick={e => {
											e.stopPropagation();
											e.preventDefault();
											onEditTab(tab);
										}}
										onKeyDown={e => {
											if (e.key === "Enter" || e.key === " ") {
												e.stopPropagation();
												e.preventDefault();
												onEditTab(tab);
											}
										}}
									>
										<Pencil className="h-3 w-3" />
									</span>
								)}
							</TabsTrigger>
						);
					})}
				</TabsList>
			</div>

			<TabsContent value="uncategorized" className="mt-4">
				<div className="grid grid-cols-1 gap-4">
					{uncategorizedQueries.map(query => (
						<QueryCard
							key={query.id}
							query={query}
							isExpanded={expandedQueries.has(query.id)}
							onToggleExpand={() => toggleExpanded(query.id)}
							onExecute={() => onExecute(query.id)}
							onEdit={() => onEdit(query.id)}
							onDelete={() => onDelete(query.id)}
							isExecuting={isExecutingId === query.id}
							isDeleting={isDeletingId === query.id}
						/>
					))}
					{uncategorizedQueries.length === 0 && (
						<div className="col-span-full py-12 text-center text-muted-foreground">
							No queries in this tab
						</div>
					)}
				</div>
			</TabsContent>

			{sortedTabs.map(tab => {
				const tabQueries = queries.filter(q => q.tabId === tab.id);
				return (
					<TabsContent key={tab.id} value={`tab-${tab.id}`} className="mt-4">
						<div className="grid grid-cols-1 gap-4">
							{tabQueries.map(query => (
								<QueryCard
									key={query.id}
									query={query}
									isExpanded={expandedQueries.has(query.id)}
									onToggleExpand={() => toggleExpanded(query.id)}
									onExecute={() => onExecute(query.id)}
									onEdit={() => onEdit(query.id)}
									onDelete={() => onDelete(query.id)}
									isExecuting={isExecutingId === query.id}
									isDeleting={isDeletingId === query.id}
								/>
							))}
							{tabQueries.length === 0 && (
								<div className="col-span-full py-12 text-center text-muted-foreground">
									No queries in this tab
								</div>
							)}
						</div>
					</TabsContent>
				);
			})}
		</Tabs>
	);
}
