/**
 * UI primitives - barrel exports
 * Re-exports shadcn/ui components
 *
 * Note: Some skeleton exports are omitted to avoid naming conflicts
 * with feedback/loading-states. Use direct imports if needed.
 */

export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./checkbox";
export * from "./container";
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./empty-state";
export * from "./flex";
export * from "./input";
export * from "./label";
export * from "./mono";
export * from "./muted";
export * from "./popover";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./skeleton";
export * from "./sonner";
export * from "./stack";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toggle";
export * from "./toggle-group";
export * from "./tooltip";
export * from "./truncated-text";

// Re-export specific non-conflicting skeleton components
export {
	KanbanSkeleton,
	ConnectionGridSkeleton,
	TableDataSkeleton,
	TablesListSkeleton,
	ColumnsSkeleton,
	QueryCardSkeleton,
} from "./content-skeletons";
export { PageLoadingSkeleton, SpinnerIcon } from "./skeletons";
export { QueryDetailSkeleton } from "./query-skeletons";
