"use client";

import { toast } from "sonner";

interface UseMutationFactoryOptions<TData, TError, TVariables> {
	successMessage?: string | ((data: TData, variables: TVariables) => string);
	errorMessage?: string | ((error: TError, variables: TVariables) => string);
	onSuccess?: (data: TData, variables: TVariables) => void;
	onError?: (error: TError, variables: TVariables) => void;
}

export function useMutationFactory<
	TData = unknown,
	TError extends { message: string } = Error,
	TVariables = unknown,
>(options: UseMutationFactoryOptions<TData, TError, TVariables> = {}) {
	const { successMessage, errorMessage, onSuccess, onError } = options;

	return {
		onSuccess: (data: TData, variables: TVariables, _context: unknown) => {
			if (successMessage) {
				const message =
					typeof successMessage === "function"
						? successMessage(data, variables)
						: successMessage;
				toast.success(message);
			}
			onSuccess?.(data, variables);
		},
		onError: (error: TError, variables: TVariables, _context: unknown) => {
			if (errorMessage) {
				const message =
					typeof errorMessage === "function"
						? errorMessage(error, variables)
						: errorMessage;
				toast.error(message);
			} else {
				toast.error(error.message || "An error occurred");
			}
			onError?.(error, variables);
		},
	};
}
