"use client";

import {
	ArrowDownAZ,
	ArrowUpAZ,
	LayoutGrid,
	List,
	Plus,
	Search,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { type SortOption, useHomeViewStore } from "~/stores/home-view-store";

interface ConnectionsHeaderProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onConnect: () => void;
	connectionCount: number;
}

export function ConnectionsHeader({
	searchQuery,
	onSearchChange,
	onConnect,
	connectionCount,
}: ConnectionsHeaderProps) {
	const { viewMode, setViewMode, sortOption, setSortOption } =
		useHomeViewStore();

	const getSortField = (option: SortOption) => {
		if (option.startsWith("name")) return "name";
		if (option.startsWith("created")) return "created";
		if (option.startsWith("last-used")) return "lastUsed";
		return "created";
	};

	const getSortOrder = (option: SortOption) => {
		return option.endsWith("asc") ? "asc" : "desc";
	};

	const currentSortField = getSortField(sortOption);
	const currentSortOrder = getSortOrder(sortOption);

	const handleSortFieldChange = (field: string) => {
		if (field === "name") setSortOption("name-asc");
		if (field === "created") setSortOption("created-desc");
		if (field === "lastUsed") setSortOption("last-used-desc");
	};

	const toggleSortOrder = () => {
		const newOrder = currentSortOrder === "asc" ? "desc" : "asc";
		if (currentSortField === "name") setSortOption(`name-${newOrder}`);
		else if (currentSortField === "created")
			setSortOption(`created-${newOrder}`);
		else if (currentSortField === "lastUsed")
			setSortOption(`last-used-${newOrder}`);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search connections..."
						value={searchQuery}
						onChange={e => onSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Sort */}
				<div className="flex items-center gap-1">
					<Select
						value={currentSortField}
						onValueChange={handleSortFieldChange}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="name">Name</SelectItem>
							<SelectItem value="created">Created</SelectItem>
							<SelectItem value="lastUsed">Last Used</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleSortOrder}
						title={currentSortOrder === "asc" ? "Ascending" : "Descending"}
					>
						{currentSortOrder === "asc" ? (
							<ArrowDownAZ className="h-4 w-4" />
						) : (
							<ArrowUpAZ className="h-4 w-4" />
						)}
					</Button>
				</div>

				{/* View Toggle */}
				<div className="flex items-center rounded-lg border border-border p-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setViewMode("grid")}
						className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-muted")}
						title="Grid View"
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setViewMode("list")}
						className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-muted")}
						title="List View"
					>
						<List className="h-4 w-4" />
					</Button>
				</div>

				{/* New Connection Button */}
				<Button onClick={onConnect} className="gap-2">
					<Plus className="h-4 w-4" />
					New Connection
				</Button>
			</div>

			<div className="flex items-center justify-between text-muted-foreground text-sm">
				<span>
					{connectionCount}{" "}
					{connectionCount === 1 ? "connection" : "connections"}
				</span>
			</div>
		</div>
	);
}
