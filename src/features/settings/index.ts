/**
 * Settings feature - public exports
 * All imports from this feature should go through this file
 */

// Components
export { SettingsSidebar } from "./components/settings-sidebar";
export { OverrideIndicator, ToggleOption } from "./components/shared";
export { DangerTab } from "./components/danger-tab";
export { DataStorageTab } from "./components/data-storage-tab";
export { ProfileTab } from "./components/profile-tab";
export { SecurityTab } from "./components/security-tab";
export { DataExplorer } from "./components/data-explorer";

// Hooks
export {
	useAccountDeletion,
	usePasswordChange,
	useSessionManagement,
	useLogout,
	useProfileMutations,
	useDataManagement,
} from "./hooks/use-settings";
