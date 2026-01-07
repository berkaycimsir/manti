/**
 * Column rules feature - public exports
 * Handles transformations and filters for table columns
 */

// Types
export * from "./types";

// Constants
export {
	// Filter constants
	FILTER_OPTIONS,
	getFilterOption,
	getFilterLabel,
	getFilterIconName,
	filterNeedsValue,
	filterNeedsSecondValue,
	// Transformation constants
	TRANSFORMATION_OPTIONS,
	DATE_FORMATS,
	getTransformationOption,
	getTransformationLabel,
	getTransformationIconName,
	getDefaultTransformationOptions,
} from "./constants";

// Components
export { FilterSidebar, applyFilter } from "./components/filter-sidebar";
export { TransformationSidebar } from "./components/transformation-sidebar";
export { GlobalRulesTab } from "./components/global-rules-tab";
export { GlobalRulesCard } from "./components/global-rules-card";

// Shared components
export { LucideIcon } from "./components/shared/lucide-icon";
export { ToggleSwitch } from "./components/shared/toggle-switch";
export { TransformationOptionsEditor } from "./components/shared/transformation-options-editor";

// Hooks
export { useColumnConfig } from "./hooks/use-column-config";
export { useGlobalRules } from "./hooks/use-global-rules";

// Utils
export {
	mergeTransformations,
	mergeFilters,
	formatOptions,
} from "./utils/merge-rules";
export {
	applyTransformation,
	applyTransformationsToRow,
} from "./utils/apply-transformation";
