"use client";

import { useState } from "react";
import { DataExplorer } from "~/components/settings/data-explorer";
import { DangerTab } from "~/components/settings/tabs/danger-tab";
import { DataStorageTab } from "~/components/settings/tabs/data-storage-tab";
import { ProfileTab } from "~/components/settings/tabs/profile-tab";
import { SecurityTab } from "~/components/settings/tabs/security-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useHeader } from "~/hooks/use-header";
import { useSession } from "~/lib/auth-client";

export default function SettingsPage() {
	const { data: session } = useSession();

	useHeader({
		title: "Settings",
		subtitle: "Manage your account and preferences",
	});

	// Explorer dialog state
	const [explorerTab, setExplorerTab] = useState<"server" | "local" | null>(
		null
	);

	return (
		<div className="container mx-auto max-w-4xl space-y-8 py-6">
			<Tabs defaultValue="profile" className="w-full">
				<TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
					<TabsTrigger value="data">Data & Storage</TabsTrigger>
					<TabsTrigger value="danger">Danger Zone</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-4 pt-4">
					<ProfileTab session={session} />
				</TabsContent>

				<TabsContent value="security" className="space-y-4 pt-4">
					<SecurityTab currentSessionToken={session?.session?.token} />
				</TabsContent>

				<TabsContent value="data" className="space-y-6 pt-4">
					<DataStorageTab onOpenExplorer={setExplorerTab} />
				</TabsContent>

				<TabsContent value="danger" className="space-y-4 pt-4">
					<DangerTab />
				</TabsContent>
			</Tabs>

			<DataExplorer
				open={!!explorerTab}
				onOpenChange={open => !open && setExplorerTab(null)}
				initialTab={explorerTab || "local"}
			/>
		</div>
	);
}
