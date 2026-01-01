import type { FilterConfig } from "~/components/database/filter-sidebar";
import type { TransformationConfig } from "~/lib/transformations";

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

export interface TableViewerProps {
	dbName: string;
	tableName: string;
	columns: Column[];
	rows: Row[];
	transformations?: TransformationConfig[];
	filters?: FilterConfig[];
}

export interface DensityStyles {
	py: string;
	text: string;
}

export type DensityMode = "compact" | "default" | "comfortable";

export const DENSITY_STYLES: Record<DensityMode, DensityStyles> = {
	compact: { py: "py-1", text: "text-xs" },
	default: { py: "py-2", text: "text-sm" },
	comfortable: { py: "py-3", text: "text-sm" },
};

export const CHECKBOX_WIDTH = 40;
export const ROW_NUMBER_WIDTH = 48;
export const EXPAND_BUTTON_WIDTH = 40;
