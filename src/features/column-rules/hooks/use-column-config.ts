"use client";

import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useMemo } from "react";
import { api } from "~/trpc/react";
import type { FilterConfig, FilterRecord } from "../types";
import type { TransformationConfig, TransformationRecord } from "../types";
import { mergeFilters, mergeTransformations } from "../utils/merge-rules";

interface UseColumnConfigOptions {
	connectionId: number;
	tableName: string;
	enabled?: boolean;
}

interface UseColumnConfigReturn {
	// Raw data
	allTransformations: TransformationRecord[];
	allFilters: FilterRecord[];
	globalTransformations: TransformationRecord[];
	globalFilters: FilterRecord[];
	tableTransformations: TransformationRecord[];
	tableFilters: FilterRecord[];

	// Merged data for table display
	mergedTransformations: TransformationConfig[];
	mergedFilters: FilterConfig[];

	// Loading states
	isLoading: boolean;
	isLoadingTransformations: boolean;
	isLoadingFilters: boolean;
	isLoadingGlobalTransformations: boolean;
	isLoadingGlobalFilters: boolean;

	// Mutations
	transformationMutations: {
		create: ReturnType<
			typeof api.database.createColumnTransformation.useMutation
		>;
		update: ReturnType<
			typeof api.database.updateColumnTransformation.useMutation
		>;
		delete: ReturnType<
			typeof api.database.deleteColumnTransformation.useMutation
		>;
	};
	filterMutations: {
		create: ReturnType<typeof api.database.createColumnFilter.useMutation>;
		update: ReturnType<typeof api.database.updateColumnFilter.useMutation>;
		delete: ReturnType<typeof api.database.deleteColumnFilter.useMutation>;
	};

	// Utilities
	invalidateAll: () => void;
	hasTransformationOverride: (columnName: string) => boolean;
	hasFilterOverride: (columnName: string) => boolean;
}

/**
 * Hook for managing column transformations and filters
 * Combines queries, mutations, and merge logic
 */
export function useColumnConfig({
	connectionId,
	tableName,
	enabled = true,
}: UseColumnConfigOptions): UseColumnConfigReturn {
	const utils = api.useUtils();

	// Fetch transformations
	const { data: allTransformations = [], isLoading: isLoadingTransformations } =
		api.database.listColumnTransformations.useQuery(
			{ connectionId, tableName },
			{ enabled }
		);

	const {
		data: globalTransformations = [],
		isLoading: isLoadingGlobalTransformations,
	} = api.database.listGlobalTransformations.useQuery(
		{ connectionId },
		{ enabled }
	);

	// Fetch filters
	const { data: allFilters = [], isLoading: isLoadingFilters } =
		api.database.listColumnFilters.useQuery(
			{ connectionId, tableName },
			{ enabled }
		);

	const { data: globalFilters = [], isLoading: isLoadingGlobalFilters } =
		api.database.listGlobalFilters.useQuery({ connectionId }, { enabled });

	// Separate table-specific records
	const tableTransformations = useMemo(
		() => allTransformations.filter(t => t.tableName !== null),
		[allTransformations]
	);

	const tableFilters = useMemo(
		() => allFilters.filter(f => f.tableName !== null),
		[allFilters]
	);

	// Merge transformations and filters with memoization
	const mergedTransformations = useMemo(
		() => mergeTransformations(allTransformations as TransformationRecord[]),
		[allTransformations]
	);

	const mergedFilters = useMemo(
		() => mergeFilters(allFilters as FilterRecord[]),
		[allFilters]
	);

	// Invalidation helper
	const invalidateAll = () => {
		void utils.database.listColumnTransformations.invalidate({
			connectionId,
			tableName,
		});
		void utils.database.listGlobalTransformations.invalidate({ connectionId });
		void utils.database.listColumnFilters.invalidate({
			connectionId,
			tableName,
		});
		void utils.database.listGlobalFilters.invalidate({ connectionId });
	};

	// Transformation mutations
	const createTransformation =
		api.database.createColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Transformation created",
				onSuccess: () => {
					void utils.database.listColumnTransformations.invalidate({
						connectionId,
						tableName,
					});
				},
			})
		);

	const updateTransformation =
		api.database.updateColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Transformation updated",
				onSuccess: () => {
					void utils.database.listColumnTransformations.invalidate({
						connectionId,
						tableName,
					});
					void utils.database.listGlobalTransformations.invalidate({
						connectionId,
					});
				},
			})
		);

	const deleteTransformation =
		api.database.deleteColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Transformation deleted",
				onSuccess: () => {
					void utils.database.listColumnTransformations.invalidate({
						connectionId,
						tableName,
					});
					void utils.database.listGlobalTransformations.invalidate({
						connectionId,
					});
				},
			})
		);

	// Filter mutations
	const createFilter = api.database.createColumnFilter.useMutation(
		useMutationFactory({
			successMessage: "Filter created",
			onSuccess: () => {
				void utils.database.listColumnFilters.invalidate({
					connectionId,
					tableName,
				});
			},
		})
	);

	const updateFilter = api.database.updateColumnFilter.useMutation(
		useMutationFactory({
			successMessage: "Filter updated",
			onSuccess: () => {
				void utils.database.listColumnFilters.invalidate({
					connectionId,
					tableName,
				});
			},
		})
	);

	const deleteFilter = api.database.deleteColumnFilter.useMutation(
		useMutationFactory({
			successMessage: "Filter deleted",
			onSuccess: () => {
				void utils.database.listColumnFilters.invalidate({
					connectionId,
					tableName,
				});
				void utils.database.listGlobalFilters.invalidate({ connectionId });
			},
		})
	);

	// Override detection helpers
	// Only consider a transformation as overriding if it's explicitly enabled (true)
	// When isEnabled is false, null, or undefined, the global transformation should apply
	const hasTransformationOverride = (columnName: string): boolean => {
		return tableTransformations.some(
			t => t.columnName === columnName && t.isEnabled === true
		);
	};

	const hasFilterOverride = (columnName: string): boolean => {
		return tableFilters.some(
			f => f.columnName === columnName && f.isEnabled === true
		);
	};

	return {
		allTransformations: allTransformations as TransformationRecord[],
		allFilters: allFilters as FilterRecord[],
		globalTransformations: globalTransformations as TransformationRecord[],
		globalFilters: globalFilters as FilterRecord[],
		tableTransformations: tableTransformations as TransformationRecord[],
		tableFilters: tableFilters as FilterRecord[],
		mergedTransformations,
		mergedFilters,
		isLoading:
			isLoadingTransformations ||
			isLoadingFilters ||
			isLoadingGlobalTransformations ||
			isLoadingGlobalFilters,
		isLoadingTransformations,
		isLoadingFilters,
		isLoadingGlobalTransformations,
		isLoadingGlobalFilters,
		transformationMutations: {
			create: createTransformation,
			update: updateTransformation,
			delete: deleteTransformation,
		},
		filterMutations: {
			create: createFilter,
			update: updateFilter,
			delete: deleteFilter,
		},
		invalidateAll,
		hasTransformationOverride,
		hasFilterOverride,
	};
}

/**
 * Hook for global transformations only (for global rules tab)
 */
export function useGlobalColumnConfig(connectionId: number, enabled = true) {
	const utils = api.useUtils();

	const {
		data: globalTransformations = [],
		isLoading: isLoadingTransformations,
	} = api.database.listGlobalTransformations.useQuery(
		{ connectionId },
		{ enabled }
	);

	const { data: globalFilters = [], isLoading: isLoadingFilters } =
		api.database.listGlobalFilters.useQuery({ connectionId }, { enabled });

	// Mutations
	const createTransformation =
		api.database.createGlobalTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation created",
				onSuccess: () => {
					void utils.database.listGlobalTransformations.invalidate({
						connectionId,
					});
				},
			})
		);

	const updateTransformation =
		api.database.updateColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation updated",
				onSuccess: () => {
					void utils.database.listGlobalTransformations.invalidate({
						connectionId,
					});
				},
			})
		);

	const deleteTransformation =
		api.database.deleteColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation deleted",
				onSuccess: () => {
					void utils.database.listGlobalTransformations.invalidate({
						connectionId,
					});
				},
			})
		);

	const createFilter = api.database.createGlobalFilter.useMutation(
		useMutationFactory({
			successMessage: "Global filter created",
			onSuccess: () => {
				void utils.database.listGlobalFilters.invalidate({ connectionId });
			},
		})
	);

	const deleteFilter = api.database.deleteColumnFilter.useMutation(
		useMutationFactory({
			successMessage: "Global filter deleted",
			onSuccess: () => {
				void utils.database.listGlobalFilters.invalidate({ connectionId });
			},
		})
	);

	return {
		globalTransformations: globalTransformations as TransformationRecord[],
		globalFilters: globalFilters as FilterRecord[],
		isLoading: isLoadingTransformations || isLoadingFilters,
		transformationMutations: {
			create: createTransformation,
			update: updateTransformation,
			delete: deleteTransformation,
		},
		filterMutations: {
			create: createFilter,
			delete: deleteFilter,
		},
	};
}
