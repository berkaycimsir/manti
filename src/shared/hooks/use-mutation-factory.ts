"use client";

import { toast } from "sonner";

interface UseMutationFactoryOptions<TData, TError, TVariables, TContext> {
	// Toast messages
	successMessage?: string | ((data: TData, variables: TVariables) => string);
	errorMessage?: string | ((error: TError, variables: TVariables) => string);
	// Disable automatic error toast (useful when handling errors manually)
	disableErrorToast?: boolean;

	// Standard mutation callbacks
	onSuccess?: (
		data: TData | undefined,
		variables: TVariables,
		context: TContext
	) => void;
	onError?: (
		error: TError,
		variables: TVariables,
		context: TContext | undefined
	) => void;
	onSettled?: (
		data: TData | undefined,
		error: TError | null,
		variables: TVariables,
		context: TContext | undefined
	) => void;

	// Optimistic update support
	onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
}

/**
 * Factory for creating consistent mutation options with toast notifications.
 *
 * Features:
 * - Automatic success/error toasts
 * - Support for optimistic updates via onMutate
 * - Support for onSettled for cleanup/sync
 * - Consistent error handling
 *
 * @example Basic usage
 * ```ts
 * const mutation = api.database.create.useMutation(
 *   useMutationFactory({
 *     successMessage: "Created successfully",
 *     onSuccess: () => utils.database.list.invalidate(),
 *   })
 * );
 * ```
 *
 * @example With optimistic updates
 * ```ts
 * const mutation = api.database.update.useMutation(
 *   useMutationFactory({
 *     onMutate: async (newData) => {
 *       await utils.database.list.cancel();
 *       const previous = utils.database.list.getData();
 *       utils.database.list.setData(undefined, (old) => [...old, newData]);
 *       return { previous };
 *     },
 *     onError: (_err, _vars, context) => {
 *       if (context?.previous) {
 *         utils.database.list.setData(undefined, context.previous);
 *       }
 *     },
 *     onSettled: () => utils.database.list.invalidate(),
 *   })
 * );
 * ```
 */
export function useMutationFactory<
	TData = unknown,
	TError extends { message: string } = Error,
	TVariables = unknown,
	TContext = unknown,
>(
	options: UseMutationFactoryOptions<TData, TError, TVariables, TContext> = {}
) {
	const {
		successMessage,
		errorMessage,
		disableErrorToast = false,
		onSuccess,
		onError,
		onSettled,
		onMutate,
	} = options;

	// Build mutation callbacks object with proper typing for tRPC
	// tRPC expects data to potentially be undefined in onSuccess
	const callbacks: {
		onSuccess?: (
			data: TData | undefined,
			variables: TVariables,
			context: TContext
		) => void;
		onError?: (
			error: TError,
			variables: TVariables,
			context: TContext | undefined
		) => void;
		onSettled?: (
			data: TData | undefined,
			error: TError | null,
			variables: TVariables,
			context: TContext | undefined
		) => void;
		onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
	} = {};

	callbacks.onSuccess = (
		data: TData | undefined,
		variables: TVariables,
		context: TContext
	) => {
		if (successMessage) {
			const message =
				typeof successMessage === "function"
					? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
						(successMessage as (d: TData | undefined, v: TVariables) => string)(
							data,
							variables
						)
					: successMessage;
			toast.success(message);
		}
		onSuccess?.(data, variables, context);
	};

	callbacks.onError = (
		error: TError,
		variables: TVariables,
		context: TContext | undefined
	) => {
		if (!disableErrorToast) {
			if (errorMessage) {
				const message =
					typeof errorMessage === "function"
						? errorMessage(error, variables)
						: errorMessage;
				toast.error(message);
			} else {
				toast.error(error.message || "An error occurred");
			}
		}
		onError?.(error, variables, context);
	};

	if (onSettled) {
		callbacks.onSettled = onSettled;
	}

	if (onMutate) {
		callbacks.onMutate = onMutate;
	}

	return callbacks;
}
