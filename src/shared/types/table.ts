export interface Column {
	name: string;
	type: string;
}

export interface Row {
	[key: string]: unknown;
}

export interface ColumnStats {
	count: number;
	nullCount: number;
	uniqueCount: number;
	sum?: number;
	avg?: number;
	min?: number | string;
	max?: number | string;
}

export interface DensityStyles {
	py: string;
	text: string;
}

export type DensityMode = "compact" | "default" | "comfortable";
export type ViewMode = "grid" | "transpose" | "text";

export const DENSITY_STYLES: Record<DensityMode, DensityStyles> = {
	compact: { py: "py-1", text: "text-xs" },
	default: { py: "py-2", text: "text-sm" },
	comfortable: { py: "py-3", text: "text-sm" },
};

export const CHECKBOX_WIDTH = 40;
export const ROW_NUMBER_WIDTH = 48;
export const EXPAND_BUTTON_WIDTH = 40;

// =============================================================================
// TABLE VIEW OPTIONS (used by global-settings-store and table-explorer)
// =============================================================================

export interface TableOptions {
	showRowNumbers: boolean;
	zebraStriping: boolean;
	wordWrap: boolean;
	showNullDistinct: boolean;
	fullWidth: boolean;
}

export type TextViewAlignmentMode =
	| "freeText"
	| "verticalAligned"
	| "horizontalAligned";

export interface TextViewOptions {
	maxCharacters: number;
	alignmentMode: TextViewAlignmentMode;
}

export const defaultTableOptions: TableOptions = {
	showRowNumbers: true,
	zebraStriping: true,
	wordWrap: false,
	showNullDistinct: true,
	fullWidth: false,
};

export const defaultTextViewOptions: TextViewOptions = {
	maxCharacters: 100,
	alignmentMode: "freeText",
};
