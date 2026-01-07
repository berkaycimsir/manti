"use client";

import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import { Switch } from "@shared/components/ui/switch";

interface NetworkSettingsTabProps {
	keepAliveSeconds: number;
	onKeepAliveChange: (value: number) => void;
	autoReconnect: boolean;
	onAutoReconnectChange: (value: boolean) => void;
}

export function NetworkSettingsTab({
	keepAliveSeconds,
	onKeepAliveChange,
	autoReconnect,
	onAutoReconnectChange,
}: NetworkSettingsTabProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-lg">Network</h3>
				<p className="text-muted-foreground text-sm">Connection options</p>
			</div>
			<Separator />

			<div className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="keepAlive">Keep-alive (seconds)</Label>
					<div className="flex gap-4">
						<Input
							id="keepAlive"
							type="number"
							min={0}
							max={3600}
							value={keepAliveSeconds}
							onChange={e =>
								onKeepAliveChange(Number.parseInt(e.target.value) || 0)
							}
							className="max-w-[200px]"
						/>
					</div>
					<p className="text-muted-foreground text-xs">
						Ping interval (0 = disabled).
					</p>
				</div>

				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label>Auto-reconnect</Label>
						<p className="text-muted-foreground text-xs">
							Automatically reconnect on connection loss.
						</p>
					</div>
					<Switch
						checked={autoReconnect}
						onCheckedChange={onAutoReconnectChange}
					/>
				</div>
			</div>
		</div>
	);
}
