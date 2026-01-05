"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { useAccountDeletion } from "~/hooks/use-settings";

export function DangerTab() {
	const { deleteAccount, isDeletingAccount } = useAccountDeletion();

	return (
		<div className="space-y-4">
			<Card className="border-destructive/20 bg-destructive/5">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Delete Account
					</CardTitle>
					<CardDescription>
						Permanently remove your account and all associated data. This action
						cannot be undone.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border border-destructive/20 bg-background p-4 text-foreground text-sm">
						<p>Deleting your account will:</p>
						<ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
							<li>Remove your profile and personal information</li>
							<li>Delete all your saved database connections</li>
							<li>Delete all saved queries and tabs</li>
							<li>Cancel any active subscriptions</li>
						</ul>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end">
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
				</CardFooter>
			</Card>
		</div>
	);
}
