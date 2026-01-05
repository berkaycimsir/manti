"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

interface CreateTabDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	connectionId: number;
	onSuccess: () => void;
}

export function CreateTabDialog({
	open,
	onOpenChange,
	connectionId,
	onSuccess,
}: CreateTabDialogProps) {
	const [name, setName] = useState("");
	const createTabMutation = api.database.createTab.useMutation({
		onSuccess: () => {
			setName("");
			onSuccess();
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		createTabMutation.mutate({ connectionId, name });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Tab</DialogTitle>
				</DialogHeader>
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
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createTabMutation.isPending}>
							{createTabMutation.isPending ? "Creating..." : "Create Tab"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
