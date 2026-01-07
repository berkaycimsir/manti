"use client";

import { Button } from "@shared/components/ui/button";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@shared/components/ui/table";
import { STORAGE_KEYS, resolveOverrideLabel } from "@shared/lib/settings-utils";
import { useGlobalSettingsStore } from "@shared/stores/global-settings-store";
import {
	Archive,
	Database,
	HardDrive,
	Loader2,
	RefreshCw,
	Settings2,
	Trash2,
	Type,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useHomeViewStore } from "~/features/connections";
import { useQueryViewStore } from "~/features/saved-queries";
import {
	useTableDensityStore,
	useTableOptionsStore,
	useTextViewOptionsStore,
} from "~/features/table-explorer";
import { useDataManagement } from "../hooks/use-settings";
import { OverrideIndicator, ToggleOption } from "./shared";

interface DataStorageTabProps {
	onOpenExplorer: (tab: "server" | "local") => void;
}

export function DataStorageTab({ onOpenExplorer }: DataStorageTabProps) {
	// Global Settings
	const {
		defaultDensity,
		defaultTableOptions,
		defaultTextViewOptions,
		setDefaultDensity,
		setDefaultTableOptions,
		setDefaultTextViewOptions,
	} = useGlobalSettingsStore();

	const { viewMode: homeViewMode, setViewMode: setHomeViewMode } =
		useHomeViewStore();
	const { viewMode: queryViewMode, setViewMode: setQueryViewMode } =
		useQueryViewStore();

	// Overrides detection
	const densityModes = useTableDensityStore(state => state.densityModes);
	const tableOptionsMap = useTableOptionsStore(state => state.options);
	const textViewOptionsMap = useTextViewOptionsStore(state => state.options);

	const densityOverrides = Object.keys(densityModes);
	const optionsOverrides = Object.keys(tableOptionsMap);
	const textViewOverrides = Object.keys(textViewOptionsMap);

	// Data management hook
	const {
		dataSummary,
		connections,
		isLoadingData,
		handleClearCloudData,
		isClearingData,
	} = useDataManagement();

	// Local storage state
	const [storageUsage, setStorageUsage] = useState<
		{ key: string; label: string; size: number }[]
	>([]);

	useEffect(() => {
		const calculateStorage = () => {
			const usage = STORAGE_KEYS.map(item => {
				const value = localStorage.getItem(item.key);
				const size = value ? new Blob([value]).size : 0;
				return { ...item, size };
			});
			setStorageUsage(usage);
		};
		calculateStorage();
		const interval = setInterval(calculateStorage, 2000);
		return () => clearInterval(interval);
	}, []);

	const handleClearLocalStorage = (key: string) => {
		localStorage.removeItem(key);
		setStorageUsage(prev =>
			prev.map(item => (item.key === key ? { ...item, size: 0 } : item))
		);
	};

	const onClearCloudData = (
		type: "connections" | "queries" | "tabs" | "filters" | "transformations"
	) => {
		if (confirm(`Are you sure you want to delete all ${type}?`)) {
			handleClearCloudData(type);
		}
	};

	const resolveLabel = (key: string) => resolveOverrideLabel(key, connections);

	return (
		<div className="space-y-8">
			{/* Global Preferences */}
			<div className="space-y-4">
				<div>
					<div className="flex items-center gap-2">
						<Settings2 className="h-5 w-5" />
						<h3 className="font-medium text-lg">Global Preferences</h3>
					</div>
					<p className="text-muted-foreground text-sm">
						Set default behaviors and view settings for the entire application.
					</p>
				</div>
				<Separator />
				<div className="space-y-6">
					{/* View Settings Grid */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Label>Default Table Density</Label>
								<OverrideIndicator
									overrides={densityOverrides}
									resolveLabel={resolveLabel}
								/>
							</div>
							<Select
								value={defaultDensity}
								onValueChange={(v: any) => setDefaultDensity(v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compact">Compact</SelectItem>
									<SelectItem value="default">Default</SelectItem>
									<SelectItem value="comfortable">Comfortable</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-[0.8rem] text-muted-foreground">
								Applies to all tables unless overridden.
							</p>
						</div>

						<div className="space-y-2">
							<Label>Home Page View</Label>
							<Select
								value={homeViewMode}
								onValueChange={(v: any) => setHomeViewMode(v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="grid">Grid View</SelectItem>
									<SelectItem value="list">List View</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Query Page View</Label>
							<Select
								value={queryViewMode}
								onValueChange={(v: any) => setQueryViewMode(v)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="kanban">Kanban Board</SelectItem>
									<SelectItem value="tabs">Tabs View</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Table Options */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Label className="text-base">Default Table Options</Label>
							<OverrideIndicator
								overrides={optionsOverrides}
								resolveLabel={resolveLabel}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<ToggleOption
								label="Row Numbers"
								description="Show row index column"
								checked={defaultTableOptions.showRowNumbers}
								onCheckedChange={c =>
									setDefaultTableOptions({ showRowNumbers: c })
								}
							/>
							<ToggleOption
								label="Zebra Striping"
								description="Alternating row colors"
								checked={defaultTableOptions.zebraStriping}
								onCheckedChange={c =>
									setDefaultTableOptions({ zebraStriping: c })
								}
							/>
							<ToggleOption
								label="Word Wrap"
								description="Wrap long text in cells"
								checked={defaultTableOptions.wordWrap}
								onCheckedChange={c => setDefaultTableOptions({ wordWrap: c })}
							/>
							<ToggleOption
								label="Show Null/Distinct"
								description="Distinguish null vs empty"
								checked={defaultTableOptions.showNullDistinct}
								onCheckedChange={c =>
									setDefaultTableOptions({ showNullDistinct: c })
								}
							/>
							<ToggleOption
								label="Full Width"
								description="Expand table to container"
								checked={defaultTableOptions.fullWidth}
								onCheckedChange={c => setDefaultTableOptions({ fullWidth: c })}
							/>
						</div>
					</div>

					{/* Text View Options */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Label className="flex items-center gap-2 text-base">
								<Type className="h-4 w-4" />
								Text View Defaults
							</Label>
							<OverrideIndicator
								overrides={textViewOverrides}
								resolveLabel={resolveLabel}
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Max Characters</Label>
								<Input
									type="number"
									value={defaultTextViewOptions.maxCharacters}
									onChange={e =>
										setDefaultTextViewOptions({
											maxCharacters: Number.parseInt(e.target.value) || 100,
										})
									}
								/>
								<p className="text-[0.8rem] text-muted-foreground">
									Truncate long text content
								</p>
							</div>
							<div className="space-y-2">
								<Label>Alignment Mode</Label>
								<Select
									value={defaultTextViewOptions.alignmentMode}
									onValueChange={(v: any) =>
										setDefaultTextViewOptions({ alignmentMode: v })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="freeText">Free Text</SelectItem>
										<SelectItem value="verticalAligned">
											Vertical Aligned
										</SelectItem>
										<SelectItem value="horizontalAligned">
											Horizontal Aligned
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-[0.8rem] text-muted-foreground">
									How to layout field text
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Cloud Data */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							<h3 className="font-medium text-lg">Cloud Data (Server-Side)</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							Manage your data stored on our servers.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenExplorer("server")}
					>
						Manage Details
					</Button>
				</div>
				<Separator />
				<div>
					{isLoadingData ? (
						<div className="flex justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{[
								{
									label: "Database Connections",
									key: "connections",
									count: dataSummary?.connections,
									icon: Database,
								},
								{
									label: "Saved Queries",
									key: "queries",
									count: dataSummary?.queries,
									icon: Archive,
								},
								{
									label: "Query Tabs",
									key: "tabs",
									count: dataSummary?.tabs,
									icon: Database,
								},
								{
									label: "Column Filters",
									key: "filters",
									count: dataSummary?.filters,
									icon: RefreshCw,
								},
								{
									label: "Visual Transformations",
									key: "transformations",
									count: dataSummary?.transformations,
									icon: RefreshCw,
								},
							].map(item => (
								<div
									key={item.key}
									className="flex flex-col justify-between rounded-lg border p-4 shadow-sm"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
											<item.icon className="h-4 w-4" />
											{item.label}
										</div>
										<div className="font-bold text-2xl">{item.count ?? 0}</div>
									</div>
									<Button
										variant="outline"
										size="sm"
										className="mt-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
										onClick={() => onClearCloudData(item.key as any)}
										disabled={!item.count || isClearingData}
									>
										<Trash2 className="mr-2 h-3 w-3" />
										Clear All
									</Button>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Local Storage */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<HardDrive className="h-5 w-5" />
							<h3 className="font-medium text-lg">Local Storage (Browser)</h3>
						</div>
						<p className="text-muted-foreground text-sm">
							Manage data stored locally in your browser.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenExplorer("local")}
					>
						Manage Details
					</Button>
				</div>
				<Separator />
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Data Type</TableHead>
								<TableHead>Storage Key</TableHead>
								<TableHead>Size</TableHead>
								<TableHead className="text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{storageUsage.map(item => (
								<TableRow key={item.key}>
									<TableCell className="font-medium">{item.label}</TableCell>
									<TableCell className="font-mono text-muted-foreground text-xs">
										{item.key}
									</TableCell>
									<TableCell>
										{item.size > 0 ? (
											`${(item.size / 1024).toFixed(2)} KB`
										) : (
											<span className="text-muted-foreground italic">
												Empty
											</span>
										)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleClearLocalStorage(item.key)}
											disabled={item.size === 0}
											className="text-muted-foreground hover:text-destructive"
										>
											Clear
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
