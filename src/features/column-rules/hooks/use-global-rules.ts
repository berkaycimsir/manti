import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { api } from "~/trpc/react";
import type { FilterType } from "../types";
import type { TransformationType } from "../types";

interface UseGlobalRulesOptions {
	connectionId: number;
	onTransformationCreated?: () => void;
	onFilterCreated?: () => void;
}

/**
 * Hook for managing global rules (transformations and filters)
 * Extracts common data fetching and mutation logic
 */
export function useGlobalRules({
	connectionId,
	onTransformationCreated,
	onFilterCreated,
}: UseGlobalRulesOptions) {
	const utils = api.useUtils();

	// Fetch global rules
	const {
		data: globalTransformations = [],
		isLoading: loadingTransformations,
	} = api.database.listGlobalTransformations.useQuery({ connectionId });

	const { data: globalFilters = [], isLoading: loadingFilters } =
		api.database.listGlobalFilters.useQuery({ connectionId });

	// Fetch common columns across all tables
	const { data: commonColumns = [], isLoading: loadingColumns } =
		api.database.getCommonColumns.useQuery({ connectionId });

	// Invalidation helpers
	const invalidateTransformations = () => {
		utils.database.listGlobalTransformations.invalidate({ connectionId });
	};

	const invalidateFilters = () => {
		utils.database.listGlobalFilters.invalidate({ connectionId });
	};

	// Mutations
	const createTransformationMutation =
		api.database.createGlobalTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation created",
				onSuccess: () => {
					invalidateTransformations();
					onTransformationCreated?.();
				},
			})
		);

	const updateTransformationMutation =
		api.database.updateColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation updated",
				onSuccess: invalidateTransformations,
			})
		);

	const deleteTransformationMutation =
		api.database.deleteColumnTransformation.useMutation(
			useMutationFactory({
				successMessage: "Global transformation deleted",
				onSuccess: invalidateTransformations,
			})
		);

	const createFilterMutation = api.database.createGlobalFilter.useMutation(
		useMutationFactory({
			successMessage: "Global filter created",
			onSuccess: () => {
				invalidateFilters();
				onFilterCreated?.();
			},
		})
	);

	const deleteFilterMutation = api.database.deleteColumnFilter.useMutation(
		useMutationFactory({
			successMessage: "Global filter deleted",
			onSuccess: invalidateFilters,
		})
	);

	// Action helpers
	const createTransformation = (
		columnName: string,
		transformationType: TransformationType,
		options?: Record<string, unknown>
	) => {
		createTransformationMutation.mutate({
			connectionId,
			columnName,
			transformationType,
			options: options ?? {},
			isEnabled: true,
		});
	};

	const updateTransformationOptions = (
		id: number,
		options: Record<string, unknown>
	) => {
		updateTransformationMutation.mutate({ id, options });
	};

	const deleteTransformation = (id: number) => {
		deleteTransformationMutation.mutate({ id });
	};

	const createFilter = (
		columnName: string,
		filterType: FilterType,
		filterValue: string | null
	) => {
		createFilterMutation.mutate({
			connectionId,
			columnName,
			filterType,
			filterValue,
			isEnabled: true,
		});
	};

	const deleteFilter = (id: number) => {
		deleteFilterMutation.mutate({ id });
	};

	return {
		// Data
		globalTransformations,
		globalFilters,
		commonColumns,

		// Loading states
		isLoading: loadingTransformations || loadingFilters || loadingColumns,
		loadingTransformations,
		loadingFilters,
		loadingColumns,

		// Mutations
		createTransformation,
		updateTransformationOptions,
		deleteTransformation,
		createFilter,
		deleteFilter,

		// Mutation states
		isCreatingTransformation: createTransformationMutation.isPending,
		isUpdatingTransformation: updateTransformationMutation.isPending,
		isDeletingTransformation: deleteTransformationMutation.isPending,
		isCreatingFilter: createFilterMutation.isPending,
		isDeletingFilter: deleteFilterMutation.isPending,
	};
}
