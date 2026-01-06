"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { useAccountDeletion } from "~/hooks/use-settings";

export function DangerTab() {
	const { deleteAccount, isDeletingAccount } = useAccountDeletion();

	return (
		<div className="space-y-4">
			<div>
				<div className="flex items-center gap-2 text-destructive">
					<AlertTriangle className="h-5 w-5" />
					<h3 className="font-medium text-lg">Delete Account</h3>
				</div>
				<p className="text-muted-foreground text-sm">
					Permanently remove your account and all associated data. This action
					cannot be undone.
				</p>
			</div>
			<Separator className="bg-destructive/20" />
			<div className="space-y-4">
				<div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-foreground text-sm">
					<p className="font-medium text-destructive">
						Deleting your account will:
					</p>
					<ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
						<li>Remove your profile and personal information</li>
						<li>Delete all your saved database connections</li>
						<li>Delete all saved queries and tabs</li>
						<li>Cancel any active subscriptions</li>
					</ul>
				</div>
				<div className="flex justify-end">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="destructive">
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Account
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Are you absolutely sure?</DialogTitle>
								<DialogDescription>
									This action cannot be undone. This will permanently delete
									your account and remove your data from our servers.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="destructive"
									onClick={deleteAccount}
									disabled={isDeletingAccount}
								>
									{isDeletingAccount && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Yes, Delete My Account
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	);
}
