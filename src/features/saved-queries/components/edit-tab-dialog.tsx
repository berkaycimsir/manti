"use client";

import { Button } from "@shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

interface EditTabDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tab: { id: number; name: string } | null;
	connectionId: number;
	onSuccess: () => void;
	onDelete?: (tabId: number) => void;
}

export function EditTabDialog({
	open,
	onOpenChange,
	tab,
	connectionId,
	onSuccess,
	onDelete: _onDelete,
}: EditTabDialogProps) {
	const [name, setName] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const utils = api.useUtils();

	const updateTabMutation = api.database.updateTab.useMutation({
		onSuccess: () => {
			utils.database.listTabs.invalidate({ connectionId });
			onSuccess();
		},
	});

	const deleteTabMutation = api.database.deleteTab.useMutation({
		onSuccess: () => {
			utils.database.listTabs.invalidate({ connectionId });
			utils.database.listSavedQueries.invalidate({ connectionId });
			setShowDeleteConfirm(false);
			onOpenChange(false);
			onSuccess();
		},
	});

	// Sync name with tab prop when dialog opens
	useEffect(() => {
		if (tab && open) {
			setName(tab.name);
			setShowDeleteConfirm(false);
		}
	}, [tab, open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !tab) return;
		updateTabMutation.mutate({ id: tab.id, name: name.trim() });
	};

	const handleDelete = () => {
		if (!tab) return;
		deleteTabMutation.mutate({ id: tab.id });
	};

	if (!tab) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{showDeleteConfirm ? "Delete Tab" : "Edit Tab"}
					</DialogTitle>
					{showDeleteConfirm && (
						<DialogDescription>
							Are you sure you want to delete "{tab.name}"? All queries in this
							tab will be moved to Uncategorized.
						</DialogDescription>
					)}
				</DialogHeader>

				{showDeleteConfirm ? (
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowDeleteConfirm(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteTabMutation.isPending}
						>
							{deleteTabMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete Tab"
							)}
						</Button>
					</DialogFooter>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tab-name">Tab Name</Label>
							<Input
								id="tab-name"
								value={name}
								onChange={e => setName(e.target.value)}
								placeholder="e.g. Monthly Reports"
								autoFocus
							/>
						</div>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
								onClick={() => setShowDeleteConfirm(true)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={updateTabMutation.isPending || !name.trim()}
							>
								{updateTabMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
