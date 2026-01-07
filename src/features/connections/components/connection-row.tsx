"use client";

import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { TruncatedText } from "@shared/components/ui/truncated-text";
import { isLocalConnection, isProduction } from "@shared/lib/env";
import { formatRelativeTime } from "@shared/lib/format";
import { cn } from "@shared/lib/utils";
import {
	Database,
	Edit2,
	MoreHorizontal,
	RefreshCw,
	Trash2,
	Unplug,
} from "lucide-react";
import { api } from "~/trpc/react";
import type { Connection } from "../types";

interface ConnectionRowProps {
	connection: Connection;
	onSelect: (id: number) => void;
	onReconnect: () => void;
	onClose: () => void;
	onDelete: () => void;
	onEdit?: () => void;
	isLoading?: boolean;
	isReconnecting?: boolean;
	isClosing?: boolean;
	isDeleting?: boolean;
}

export function ConnectionRow({
	connection,
	onSelect,
	onReconnect,
	onClose,
	onDelete,
	onEdit,
	isReconnecting,
	isClosing,
	isDeleting,
}: ConnectionRowProps) {
	const { data: stats } = api.database.getConnectionStats.useQuery(
		{ connectionId: connection.id },
		{ enabled: connection.isActive === true }
	);

	const lastUsed = connection.lastUsedAt
		? formatRelativeTime(connection.lastUsedAt)
		: null;

	const isRestricted = isProduction() && isLocalConnection(connection.host);

	const rowContent = (
		<div
			role="button"
			tabIndex={isRestricted ? -1 : 0}
			className={cn(
				"flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors",
				isRestricted
					? "cursor-not-allowed opacity-60 grayscale-[0.3]"
					: "cursor-pointer hover:border-primary hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
			)}
			onClick={() => !isRestricted && onSelect(connection.id)}
			onKeyDown={e => {
				if (!isRestricted && (e.key === "Enter" || e.key === " ")) {
					e.preventDefault();
					onSelect(connection.id);
				}
			}}
		>
			{/* Icon */}
			<Database
				className={cn(
					"h-5 w-5 shrink-0",
					connection.isActive && !isRestricted
						? "text-primary"
						: "text-muted-foreground"
				)}
			/>

			{/* Connection Info */}
			<div className="grid min-w-0 flex-1 grid-cols-12 items-center gap-4">
				<div className="col-span-4 flex items-center gap-2">
					<h3 className="truncate font-semibold text-foreground">
						{connection.name}
					</h3>
					<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
						{connection.database || "No DB"}
					</span>
				</div>

				<div className="col-span-3 text-muted-foreground text-sm">
					<TruncatedText
						text={connection.host || "localhost"}
						maxLength={20}
						popoverTitle="Full Hostname"
						className="text-muted-foreground"
					/>
				</div>

				<div className="col-span-2 text-muted-foreground text-sm">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								connection.isActive && !isRestricted
									? "bg-green-500"
									: "bg-red-500"
							)}
						/>
						<span className="text-xs">
							{isRestricted
								? "Local Restricted"
								: connection.isActive
									? "Active"
									: "Inactive"}
						</span>
					</div>
				</div>

				<div className="relative col-span-3 pr-4 text-right font-mono text-muted-foreground text-xs">
					{connection.isActive && stats && !isRestricted ? (
						<span>{stats.tableCount} tables</span>
					) : (
						<span>{lastUsed ? `Used ${lastUsed}` : "Never used"}</span>
					)}
				</div>
			</div>

			{/* Actions */}
			<div
				className="flex shrink-0 items-center justify-end"
				onClick={e => e.stopPropagation()}
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
							<MoreHorizontal className="h-4 w-4" />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							disabled={isRestricted}
							onClick={() => onSelect(connection.id)}
						>
							<Database className="mr-2 h-4 w-4" />
							Open Database
						</DropdownMenuItem>

						{!connection.isActive && (
							<DropdownMenuItem
								disabled={isReconnecting || isRestricted}
								onClick={e => {
									e.preventDefault();
									onReconnect();
								}}
							>
								<RefreshCw
									className={cn(
										"mr-2 h-4 w-4 text-blue-500",
										isReconnecting && "animate-spin"
									)}
								/>
								Reconnect
							</DropdownMenuItem>
						)}

						{connection.isActive && (
							<DropdownMenuItem
								disabled={isClosing || isRestricted}
								onClick={e => {
									e.preventDefault();
									onClose();
								}}
							>
								<Unplug className="mr-2 h-4 w-4 text-orange-500" />
								Close Connection
							</DropdownMenuItem>
						)}

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={() => onEdit?.()}>
							<Edit2 className="mr-2 h-4 w-4" />
							Edit Connection
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={e => {
								e.preventDefault();
								onDelete();
							}}
							disabled={isDeleting}
							className="text-destructive focus:text-destructive"
						>
							<Trash2
								className={cn("mr-2 h-4 w-4", isDeleting && "animate-spin")}
							/>
							Delete Connection
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);

	if (isRestricted) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{rowContent}</TooltipTrigger>
				<TooltipContent side="top" className="max-w-[250px] text-center">
					<p>
						Local database connections are not accessible from the web version.
						Please install the app locally to connect to local databases.
					</p>
				</TooltipContent>
			</Tooltip>
		);
	}

	return rowContent;
}
