"use client";

import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import { Switch } from "@shared/components/ui/switch";

interface SafetySettingsTabProps {
	isReadOnly: boolean;
	onReadOnlyChange: (value: boolean) => void;
	confirmDestructive: boolean;
	onConfirmDestructiveChange: (value: boolean) => void;
}

export function SafetySettingsTab({
	isReadOnly,
	onReadOnlyChange,
	confirmDestructive,
	onConfirmDestructiveChange,
}: SafetySettingsTabProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-lg">Safety</h3>
				<p className="text-muted-foreground text-sm">Protection settings</p>
			</div>
			<Separator />

			<div className="space-y-4">
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label>Read-only Mode</Label>
						<p className="text-muted-foreground text-xs">
							Block INSERT, UPDATE, DELETE queries.
						</p>
					</div>
					<Switch checked={isReadOnly} onCheckedChange={onReadOnlyChange} />
				</div>
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label>Confirm Destructive</Label>
						<p className="text-muted-foreground text-xs">
							Show warning before DROP/TRUNCATE.
						</p>
					</div>
					<Switch
						checked={confirmDestructive}
						onCheckedChange={onConfirmDestructiveChange}
					/>
				</div>
			</div>
		</div>
	);
}
