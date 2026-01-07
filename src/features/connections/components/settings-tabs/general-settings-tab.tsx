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
import { Switch } from "@shared/components/ui/switch";
import { THEME_COLORS } from "~/config/theme-config";

interface GeneralSettingsTabProps {
	name: string;
	onNameChange: (value: string) => void;
	color: string;
	onColorChange: (value: string) => void;
	defaultSchema: string | null;
	onDefaultSchemaChange: (value: string | null) => void;
	schemas: string[];
	useConnectionThemeColor: boolean;
	onUseConnectionThemeColorChange: (value: boolean) => void;
}

export function GeneralSettingsTab({
	name,
	onNameChange,
	color,
	onColorChange,
	defaultSchema,
	onDefaultSchemaChange,
	schemas,
	useConnectionThemeColor,
	onUseConnectionThemeColorChange,
}: GeneralSettingsTabProps) {
	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-lg">General</h3>
				<p className="text-muted-foreground text-sm">
					Display and interface preferences
				</p>
			</div>
			<Separator />

			<div className="space-y-6">
				<div className="grid gap-6 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="name">Connection Name</Label>
						<Input
							id="name"
							value={name}
							onChange={e => onNameChange(e.target.value)}
							placeholder="My Database"
						/>
					</div>
					<div className="space-y-2">
						<Label>Connection Color</Label>
						<div className="flex flex-wrap gap-2">
							{THEME_COLORS.map(c => (
								<button
									key={c.value}
									type="button"
									onClick={() => onColorChange(c.value)}
									className={`h-9 w-9 rounded-full ${c.class} ring-2 ring-offset-2 ring-offset-background transition-all hover:scale-105 ${
										color === c.value
											? "scale-105 shadow-md ring-primary"
											: "ring-transparent hover:ring-muted-foreground/30"
									}`}
									title={c.label}
								/>
							))}
						</div>
					</div>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					<div className="space-y-2">
						<Label>Default Schema</Label>
						<Select
							value={defaultSchema || "_none"}
							onValueChange={v =>
								onDefaultSchemaChange(v === "_none" ? null : v)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="No default schema" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="_none">No default schema</SelectItem>
								{schemas.map(s => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-muted-foreground text-xs">
							Default search path for queries.
						</p>
					</div>

					<div className="flex items-center justify-between rounded-lg border p-3">
						<div className="space-y-0.5">
							<Label className="text-sm">Use Connection Color</Label>
							<p className="line-clamp-1 text-muted-foreground text-xs">
								Apply this color to app theme.
							</p>
						</div>
						<Switch
							checked={useConnectionThemeColor}
							onCheckedChange={onUseConnectionThemeColorChange}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
