"use client";

import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { type LucideIcon, Trash2 } from "lucide-react";

export interface LocalStoreItem {
	key: string;
	label: string;
	valueSummary: string;
	icon: LucideIcon;
	storeType: "table" | "global" | "sidebar";
	description?: string;
}

interface StorageItemTagProps {
	item: LocalStoreItem;
	dbName: string;
	tableKey: string | null;
	onReset: () => void;
}

export function StorageItemTag({
	item,
	dbName: _dbName,
	tableKey: _tableKey,
	onReset,
}: StorageItemTagProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					variant="outline"
					className="h-8 cursor-help gap-1.5 bg-background px-2 pr-1 transition-colors hover:bg-muted"
				>
					<item.icon className="h-3 w-3 text-muted-foreground" />
					<div className="flex flex-col leading-none">
						<div className="flex items-center gap-1">
							<span className="font-semibold text-[10px] text-foreground/80">
								{item.label}
							</span>
						</div>
						<span className="max-w-[100px] truncate font-normal text-[10px] text-muted-foreground">
							{item.valueSummary}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="-mr-0.5 ml-1 h-6 w-6 rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground focus:ring-0"
						onClick={e => {
							e.stopPropagation();
							onReset();
						}}
						title={`Reset ${item.label}`}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</Badge>
			</TooltipTrigger>
			<TooltipContent className="max-w-[300px]">
				<p className="font-medium">{item.description || item.label}</p>
				<p className="text-muted-foreground text-xs opacity-80">
					Value: {item.valueSummary}
				</p>
				<p className="mt-1 text-right text-[10px] text-muted-foreground">
					Click trash to reset
				</p>
			</TooltipContent>
		</Tooltip>
	);
}
