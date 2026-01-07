"use client";

import { authClient, signOut } from "@features/auth/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

/**
 * Hook for profile-related mutations.
 */
export function useProfileMutations() {
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

	const handleUpdateProfile = async (name: string) => {
		setIsUpdatingProfile(true);
		try {
			await authClient.updateUser({ name });
		} finally {
			setIsUpdatingProfile(false);
		}
	};

	return { isUpdatingProfile, handleUpdateProfile };
}

/**
 * Hook for password change functionality.
 */
export function usePasswordChange() {
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	const handleChangePassword = async (
		currentPassword: string,
		newPassword: string
	) => {
		setIsChangingPassword(true);
		try {
			await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			return { success: true };
		} catch {
			return { success: false };
		} finally {
			setIsChangingPassword(false);
		}
	};

	return { isChangingPassword, handleChangePassword };
}

/**
 * Hook for session management.
 */
export function useSessionManagement() {
	const utils = api.useUtils();

	const { data: sessions, isLoading: isLoadingSessions } =
		api.auth.listSessions.useQuery();

	const revokeSessionMutation = api.auth.revokeSession.useMutation({
		onSuccess: () => utils.auth.listSessions.invalidate(),
	});

	const revokeAllMutation = api.auth.revokeAllOtherSessions.useMutation({
		onSuccess: () => utils.auth.listSessions.invalidate(),
	});

	return {
		sessions,
		isLoadingSessions,
		revokeSession: (id: string) => revokeSessionMutation.mutate({ id }),
		revokeAllOther: () => revokeAllMutation.mutate(),
		isRevokingSession: revokeSessionMutation.isPending,
		isRevokingAll: revokeAllMutation.isPending,
	};
}

/**
 * Hook for account deletion.
 */
export function useAccountDeletion() {
	const router = useRouter();

	const deleteAccountMutation = api.auth.deleteAccount.useMutation({
		onSuccess: async () => {
			await signOut();
			router.push("/sign-in");
		},
	});

	return {
		deleteAccount: () => deleteAccountMutation.mutate(),
		isDeletingAccount: deleteAccountMutation.isPending,
	};
}

/**
 * Hook for data summary and cloud data management.
 */
export function useDataManagement() {
	const utils = api.useUtils();

	const {
		data: dataSummary,
		isLoading: isLoadingData,
		refetch: refetchData,
	} = api.userData.getSummary.useQuery();

	const { data: connections } = api.userData.getDetailedUsage.useQuery(
		undefined,
		{ staleTime: 5 * 60 * 1000 }
	);

	const clearMutation = api.userData.clearData.useMutation({
		onSuccess: () => {
			utils.userData.getSummary.invalidate();
			utils.userData.getDetailedUsage.invalidate();
		},
	});

	const handleClearCloudData = (
		type: "connections" | "queries" | "tabs" | "filters" | "transformations"
	) => {
		clearMutation.mutate({ type });
	};

	return {
		dataSummary,
		connections,
		isLoadingData,
		refetchData,
		handleClearCloudData,
		isClearingData: clearMutation.isPending,
	};
}

/**
 * Hook for local storage management.
 */
export function useLocalStorageManagement() {
	const [refreshKey, setRefreshKey] = useState(0);

	const handleClearLocalStorage = (key: string) => {
		localStorage.removeItem(key);
		setRefreshKey(k => k + 1);
		window.dispatchEvent(new Event("storage"));
	};

	const handleClearAllLocalStorage = () => {
		localStorage.clear();
		setRefreshKey(k => k + 1);
		window.dispatchEvent(new Event("storage"));
	};

	return {
		refreshKey,
		handleClearLocalStorage,
		handleClearAllLocalStorage,
		triggerRefresh: () => setRefreshKey(k => k + 1),
	};
}

/**
 * Hook for logout functionality.
 */
export function useLogout() {
	const router = useRouter();

	const handleLogout = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/");
				},
			},
		});
	};

	return { handleLogout };
}
