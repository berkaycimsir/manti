"use client";

import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import { Separator } from "@shared/components/ui/separator";

interface ExecutionSettingsTabProps {
	queryTimeoutSeconds: number;
	onQueryTimeoutChange: (value: number) => void;
	rowLimit: number;
	onRowLimitChange: (value: number) => void;
}

export function ExecutionSettingsTab({
	queryTimeoutSeconds,
	onQueryTimeoutChange,
	rowLimit,
	onRowLimitChange,
}: ExecutionSettingsTabProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-lg">Execution</h3>
				<p className="text-muted-foreground text-sm">Query runtime limits</p>
			</div>
			<Separator />

			<div className="grid gap-6 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="timeout">Query Timeout (seconds)</Label>
					<Input
						id="timeout"
						type="number"
						min={1}
						max={3600}
						value={queryTimeoutSeconds}
						onChange={e =>
							onQueryTimeoutChange(Number.parseInt(e.target.value) || 60)
						}
					/>
					<p className="text-muted-foreground text-xs">
						Hard limit on query execution time.
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="rowLimit">Table View Limit</Label>
					<Select
						value={String(rowLimit)}
						onValueChange={v => onRowLimitChange(Number.parseInt(v))}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="100">100 rows</SelectItem>
							<SelectItem value="500">500 rows</SelectItem>
							<SelectItem value="1000">1,000 rows</SelectItem>
							<SelectItem value="5000">5,000 rows</SelectItem>
							<SelectItem value="10000">10,000 rows</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-muted-foreground text-xs">
						Initial row count for table data.
					</p>
				</div>
			</div>
		</div>
	);
}
