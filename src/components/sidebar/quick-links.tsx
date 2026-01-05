"use client";

import { ChevronRight, Code, Info, Plus, Settings, Table } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface QuickLinksProps {
	dbname: string;
}

const links = [
	{ href: "tables", label: "Tables", icon: Table, hasMenu: true },
	{ href: "query", label: "Saved Queries", icon: Code, hasMenu: true },
	{ href: "query/new", label: "New Query", icon: Plus, hasMenu: false },
	{ href: "info", label: "Database Info", icon: Info, hasMenu: false },
	{ href: "settings", label: "Settings", icon: Settings, hasMenu: false },
];

export function QuickLinks({ dbname }: QuickLinksProps) {
	const pathname = usePathname();
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	return (
		<div className="px-4 py-2">
			<p className="mb-2 font-semibold text-sidebar-foreground/60 text-xs uppercase tracking-wider">
				Quick Links
			</p>
			<nav className="space-y-1">
				{links.map(link => (
					<QuickLinkItem
						key={link.href}
						link={link}
						dbname={dbname}
						connectionId={connectionId}
						pathname={pathname}
					/>
				))}
			</nav>
		</div>
	);
}

function QuickLinkItem({
	link,
	dbname,
	connectionId,
	pathname,
}: {
	link: (typeof links)[0];
	dbname: string;
	connectionId: number;
	pathname: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const closeTimeoutRef = useRef<NodeJS.Timeout>(null);

	const fullPath = `/home/${dbname}/${link.href}`;
	const isActive =
		pathname === fullPath ||
		(link.href === "tables" && pathname === `/home/${dbname}`) ||
		(link.href !== "query/new" &&
			link.href === "query" &&
			pathname.startsWith(`/home/${dbname}/query`) &&
			!pathname.includes("/new"));

	const handleMouseEnter = () => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}
		setIsOpen(true);
	};

	const handleMouseLeave = () => {
		closeTimeoutRef.current = setTimeout(() => {
			setIsOpen(false);
		}, 200); // 200ms delay
	};

	const LinkComponent = (
		<Link
			href={fullPath}
			className={cn(
				"group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
				isActive
					? "bg-sidebar-primary text-sidebar-primary-foreground"
					: "text-sidebar-foreground hover:bg-sidebar-accent"
			)}
		>
			<link.icon className="h-4 w-4 shrink-0" />
			<span className="flex-1">{link.label}</span>
			{link.hasMenu && (
				<ChevronRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
			)}
		</Link>
	);

	if (!link.hasMenu) {
		return LinkComponent;
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<div
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					className="w-full"
				>
					{LinkComponent}
				</div>
			</PopoverTrigger>
			<PopoverContent
				side="right"
				align="start"
				className="w-64 p-0"
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				{link.href === "tables" && (
					<TablesList connectionId={connectionId} dbname={dbname} />
				)}
				{link.href === "query" && (
					<QueriesList connectionId={connectionId} dbname={dbname} />
				)}
			</PopoverContent>
		</Popover>
	);
}

function TablesList({
	connectionId,
	dbname,
}: {
	connectionId: number;
	dbname: string;
}) {
	const { data: tables, isLoading } = api.database.getTables.useQuery(
		{ connectionId },
		{ enabled: !!connectionId }
	);

	if (isLoading) {
		return (
			<div className="space-y-2 p-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-5/6" />
			</div>
		);
	}

	if (!tables || tables.length === 0) {
		return (
			<div className="p-3 text-center text-muted-foreground text-sm">
				No tables found
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="border-b px-3 py-2 font-medium text-muted-foreground text-xs uppercase">
				Tables
			</div>
			<ScrollArea className="h-[200px]">
				<div className="p-1">
					{tables.map(table => (
						<Link
							key={table.name}
							href={`/home/${dbname}/${table.name}`}
							className="group flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
						>
							<div className="flex items-center gap-2 overflow-hidden">
								<Table className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								<span className="truncate">{table.name}</span>
							</div>
						</Link>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

function QueriesList({
	connectionId,
	dbname,
}: {
	connectionId: number;
	dbname: string;
}) {
	const { data: queries, isLoading } = api.database.listSavedQueries.useQuery(
		{ connectionId },
		{ enabled: !!connectionId }
	);

	if (isLoading) {
		return (
			<div className="space-y-2 p-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-5/6" />
			</div>
		);
	}

	if (!queries || queries.length === 0) {
		return (
			<div className="p-3 text-center text-muted-foreground text-sm">
				No saved queries
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="border-b px-3 py-2 font-medium text-muted-foreground text-xs uppercase">
				Saved Queries
			</div>
			<ScrollArea className="h-[200px]">
				<div className="p-1">
					{queries.map(query => (
						<Link
							key={query.id}
							href={`/home/${dbname}/query/show?id=${query.id}`}
							className="group flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
						>
							<div className="flex items-center gap-2 overflow-hidden">
								<Code className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
								<span className="truncate">{query.name}</span>
							</div>
						</Link>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
