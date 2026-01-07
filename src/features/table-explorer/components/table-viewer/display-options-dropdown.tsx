"use client";

import { Button } from "@shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import type { ViewMode } from "@shared/types/table";
import {
	AlignJustify,
	AlignLeft,
	Eye,
	Hash,
	Maximize2,
	Minimize2,
	Rows,
	Settings2,
	WrapText,
} from "lucide-react";
import type { TextViewAlignmentMode } from "../../stores";

interface DisplayOptionsDropdownProps {
	viewMode: ViewMode;
	showRowNumbers: boolean;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
	maxCharacters: number;
	alignmentMode: TextViewAlignmentMode;
	onShowRowNumbersChange: (value: boolean) => void;
	onZebraStripingChange: (value: boolean) => void;
	onWordWrapChange: (value: boolean) => void;
	onShowNullDistinctChange: (value: boolean) => void;
	onFullWidthChange: (value: boolean) => void;
	onMaxCharactersChange: (value: number) => void;
	onAlignmentModeChange: (value: TextViewAlignmentMode) => void;
}

/**
 * Dropdown for display options including Text View settings.
 */
export function DisplayOptionsDropdown({
	viewMode,
	showRowNumbers,
	zebraStriping,
	wordWrap,
	showNullDistinct,
	fullWidth,
	maxCharacters,
	alignmentMode,
	onShowRowNumbersChange,
	onZebraStripingChange,
	onWordWrapChange,
	onShowNullDistinctChange,
	onFullWidthChange,
	onMaxCharactersChange,
	onAlignmentModeChange,
}: DisplayOptionsDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2 bg-transparent">
					<Settings2 className="h-4 w-4" />
					Options
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-48">
				<DropdownMenuLabel>Display Options</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem
					checked={showRowNumbers}
					onCheckedChange={onShowRowNumbersChange}
				>
					<Hash className="mr-2 h-4 w-4" />
					Row Numbers
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={zebraStriping}
					onCheckedChange={onZebraStripingChange}
				>
					<Rows className="mr-2 h-4 w-4" />
					Zebra Striping
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={wordWrap}
					onCheckedChange={onWordWrapChange}
				>
					<AlignJustify className="mr-2 h-4 w-4" />
					Word Wrap
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={showNullDistinct}
					onCheckedChange={onShowNullDistinctChange}
				>
					<Eye className="mr-2 h-4 w-4" />
					Highlight Nulls
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem
					checked={fullWidth}
					onCheckedChange={onFullWidthChange}
				>
					{fullWidth ? (
						<Minimize2 className="mr-2 h-4 w-4" />
					) : (
						<Maximize2 className="mr-2 h-4 w-4" />
					)}
					Full Width
				</DropdownMenuCheckboxItem>

				{/* Text View Settings */}
				{viewMode === "text" && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>Text View Settings</DropdownMenuLabel>
						<div className="px-2 py-1.5">
							<Label className="mb-1 block text-muted-foreground text-xs">
								Max Characters
							</Label>
							<Input
								type="number"
								min={20}
								max={1000}
								value={maxCharacters}
								onChange={e =>
									onMaxCharactersChange(
										Math.min(1000, Math.max(20, Number(e.target.value)))
									)
								}
								className="h-8"
							/>
						</div>
						<div className="px-2 py-1.5">
							<Label className="mb-1.5 block text-muted-foreground text-xs">
								Alignment Mode
							</Label>
							<div className="flex flex-col gap-1">
								<Button
									variant={alignmentMode === "freeText" ? "default" : "outline"}
									size="sm"
									className="h-7 justify-start gap-1 px-2 text-xs"
									onClick={() => onAlignmentModeChange("freeText")}
								>
									<WrapText className="h-3 w-3" />
									Free Text
								</Button>
								<Button
									variant={
										alignmentMode === "horizontalAligned"
											? "default"
											: "outline"
									}
									size="sm"
									className="h-7 justify-start gap-1 px-2 text-xs"
									onClick={() => onAlignmentModeChange("horizontalAligned")}
								>
									<AlignLeft className="h-3 w-3" />
									Horizontal Aligned
								</Button>
								<Button
									variant={
										alignmentMode === "verticalAligned" ? "default" : "outline"
									}
									size="sm"
									className="h-7 justify-start gap-1 px-2 text-xs"
									onClick={() => onAlignmentModeChange("verticalAligned")}
								>
									<Rows className="h-3 w-3" />
									Vertical Aligned
								</Button>
							</div>
						</div>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
