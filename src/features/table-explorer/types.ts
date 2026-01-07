import type { Column, Row } from "@shared/types/table";
import type {
	FilterConfig,
	TransformationConfig,
} from "~/features/column-rules";

export interface TableViewerProps {
	dbName: string;
	tableName: string;
	columns: Column[];
	rows: Row[];
	transformations?: TransformationConfig[];
	filters?: FilterConfig[];
}

export type {
	Column,
	Row,
	ColumnStats,
	DensityStyles,
	DensityMode,
	ViewMode,
	TableOptions,
	TextViewOptions,
	TextViewAlignmentMode,
} from "@shared/types/table";

export {
	DENSITY_STYLES,
	CHECKBOX_WIDTH,
	ROW_NUMBER_WIDTH,
	EXPAND_BUTTON_WIDTH,
	defaultTableOptions,
	defaultTextViewOptions,
} from "@shared/types/table";
