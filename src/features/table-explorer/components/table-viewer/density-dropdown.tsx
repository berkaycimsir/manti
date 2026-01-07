"use client";

import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import type { DensityMode } from "@shared/types/table";
import { AlignJustify } from "lucide-react";

interface DensityDropdownProps {
	value: DensityMode;
	onChange: (value: DensityMode) => void;
}

/**
 * Dropdown to select table density (compact/default/comfortable).
 */
export function DensityDropdown({ value, onChange }: DensityDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2 bg-transparent">
					<AlignJustify className="h-4 w-4" />
					Density
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuCheckboxItem
					checked={value === "compact"}
					onCheckedChange={() => onChange("compact")}
				>
					Compact
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={value === "default"}
					onCheckedChange={() => onChange("default")}
				>
					Default
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={value === "comfortable"}
					onCheckedChange={() => onChange("comfortable")}
				>
					Comfortable
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
