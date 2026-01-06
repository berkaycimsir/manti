"use client";

import { useState } from "react";
import { DataExplorer } from "~/components/settings/data-explorer";
import { SettingsSidebar } from "~/components/settings/settings-sidebar";
import { DangerTab } from "~/components/settings/tabs/danger-tab";
import { DataStorageTab } from "~/components/settings/tabs/data-storage-tab";
import { ProfileTab } from "~/components/settings/tabs/profile-tab";
import { SecurityTab } from "~/components/settings/tabs/security-tab";
import { Tabs, TabsContent } from "~/components/ui/tabs";
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
		<div className="container mx-auto max-w-7xl py-6">
			<Tabs defaultValue="profile" className="w-full">
				<div className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm lg:flex-row">
					<div className="w-full border-r-0 border-b bg-muted/30 lg:w-[210px] lg:border-r lg:border-b-0">
						<SettingsSidebar className="w-full lg:w-full" />
					</div>

					<div className="flex-1 p-6 lg:p-10">
						<TabsContent value="profile" className="mt-0 space-y-6">
							<ProfileTab session={session} />
						</TabsContent>

						<TabsContent value="security" className="mt-0 space-y-6">
							<SecurityTab currentSessionToken={session?.session?.token} />
						</TabsContent>

						<TabsContent value="data" className="mt-0 space-y-6">
							<DataStorageTab onOpenExplorer={setExplorerTab} />
						</TabsContent>

						<TabsContent value="danger" className="mt-0 space-y-6">
							<DangerTab />
						</TabsContent>
					</div>
				</div>
			</Tabs>

			<DataExplorer
				open={!!explorerTab}
				onOpenChange={open => !open && setExplorerTab(null)}
				initialTab={explorerTab || "local"}
			/>
		</div>
	);
}
