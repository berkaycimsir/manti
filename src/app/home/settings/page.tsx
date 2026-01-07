"use client";

import { useSession } from "@features/auth/lib/auth-client";
import { Tabs, TabsContent } from "@shared/components/ui/tabs";
import { useHeader } from "@shared/hooks/use-header";
import { useState } from "react";
import {
	DangerTab,
	DataExplorer,
	DataStorageTab,
	ProfileTab,
	SecurityTab,
	SettingsSidebar,
} from "~/features/settings";

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
