"use client";

import { Filter, Loader2, Pencil, Plus, Trash2, Wand2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import type { TransformationType } from "~/types/transformations";
import type { FilterType } from "~/types/filters";
import {
	TRANSFORMATION_OPTIONS,
	getDefaultTransformationOptions,
	getTransformationIconName,
} from "~/lib/constants/transformation-options";
import {
	FILTER_OPTIONS,
	filterNeedsValue,
} from "~/lib/constants/filter-options";
import { formatOptions } from "~/lib/column-config-utils";
import { useGlobalRules } from "~/hooks/use-global-rules";
import { LucideIcon, TransformationOptionsEditor } from "./shared";

interface GlobalRulesTabProps {
	connectionId: number;
}

export function GlobalRulesTab({ connectionId }: GlobalRulesTabProps) {
	// Transformation form state
	const [selectedColumn, setSelectedColumn] = useState<string>("");
	const [newTransformationType, setNewTransformationType] = useState<
		TransformationType | ""
	>("");
	const [transformationOptions, setTransformationOptions] = useState<
		Record<string, unknown>
	>({});
	const [editingTransformationId, setEditingTransformationId] = useState<
		number | null
	>(null);
	const [editingOptions, setEditingOptions] = useState<Record<string, unknown>>(
		{}
	);

	// Filter form state
	const [filterSelectedColumn, setFilterSelectedColumn] = useState<string>("");
	const [newFilterType, setNewFilterType] = useState<FilterType | "">("");
	const [newFilterValue, setNewFilterValue] = useState("");

	const resetTransformationForm = () => {
		setSelectedColumn("");
		setNewTransformationType("");
		setTransformationOptions({});
	};

	const resetFilterForm = () => {
		setFilterSelectedColumn("");
		setNewFilterType("");
		setNewFilterValue("");
	};

	const {
		globalTransformations,
		globalFilters,
		commonColumns,
		isLoading,
		loadingColumns,
		createTransformation,
		updateTransformationOptions: updateOptions,
		deleteTransformation,
		createFilter,
		deleteFilter,
		isCreatingTransformation,
		isUpdatingTransformation,
		isDeletingTransformation,
		isCreatingFilter,
		isDeletingFilter,
	} = useGlobalRules({
		connectionId,
		onTransformationCreated: resetTransformationForm,
		onFilterCreated: resetFilterForm,
	});

	const handleTransformationTypeChange = (type: TransformationType) => {
		setNewTransformationType(type);
		setTransformationOptions(getDefaultTransformationOptions(type));
	};

	const handleAddTransformation = () => {
		if (!selectedColumn || !newTransformationType) return;
		createTransformation(
			selectedColumn,
			newTransformationType,
			transformationOptions
		);
	};

	const handleUpdateTransformationOptions = (id: number) => {
		updateOptions(id, editingOptions);
		setEditingTransformationId(null);
	};

	const handleAddFilter = () => {
		if (!filterSelectedColumn || !newFilterType) return;

		const needsValue = filterNeedsValue(newFilterType as FilterType);
		if (needsValue && !newFilterValue.trim()) return;

		createFilter(
			filterSelectedColumn,
			newFilterType,
			needsValue ? newFilterValue : null
		);
	};

	// All columns for selection (not just multi-table)
	const allColumns = commonColumns;

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-semibold text-lg">Global Rules</h3>
				<p className="text-muted-foreground text-sm">
					Apply transformations and filters to all tables with matching columns
				</p>
			</div>
			<Separator />

			<Tabs defaultValue="transformations" className="w-full">
				<TabsList className="mb-4 grid w-full grid-cols-2">
					<TabsTrigger value="transformations" className="gap-2">
						<Wand2 className="h-4 w-4" />
						Transformations
						{globalTransformations.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{globalTransformations.length}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="filters" className="gap-2">
						<Filter className="h-4 w-4" />
						Filters
						{globalFilters.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{globalFilters.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="transformations" className="space-y-4">
					{/* Add New Transformation */}
					<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
						<h4 className="font-medium text-sm">Add Transformation</h4>

						<div className="flex gap-2">
							<Select value={selectedColumn} onValueChange={setSelectedColumn}>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="Select column..." />
								</SelectTrigger>
								<SelectContent>
									{loadingColumns ? (
										<div className="flex items-center justify-center p-2">
											<Loader2 className="h-4 w-4 animate-spin" />
										</div>
									) : allColumns.length === 0 ? (
										<div className="p-2 text-muted-foreground text-sm">
											No columns found
										</div>
									) : (
										allColumns.map(col => (
											<SelectItem key={col.name} value={col.name}>
												<div className="flex items-center gap-2">
													<span>{col.name}</span>
													{col.tableCount >= 2 && (
														<span className="text-muted-foreground text-xs">
															({col.tableCount} tables)
														</span>
													)}
												</div>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							<Select
								value={newTransformationType}
								onValueChange={v =>
									handleTransformationTypeChange(v as TransformationType)
								}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Transform type" />
								</SelectTrigger>
								<SelectContent>
									{TRANSFORMATION_OPTIONS.map(opt => (
										<SelectItem key={opt.type} value={opt.type}>
											<div className="flex items-center gap-2">
												<LucideIcon name={opt.icon} className="h-4 w-4" />
												{opt.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Options editor for the selected type */}
						{newTransformationType && (
							<div className="rounded border bg-background p-3">
								<TransformationOptionsEditor
									type={newTransformationType}
									options={transformationOptions}
									onChange={setTransformationOptions}
								/>
							</div>
						)}

						<Button
							onClick={handleAddTransformation}
							disabled={
								!selectedColumn ||
								!newTransformationType ||
								isCreatingTransformation
							}
							size="sm"
							className="w-full"
						>
							{isCreatingTransformation ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							Add Transformation
						</Button>
					</div>

					{/* List of Global Transformations */}
					{isLoading ? (
						<div className="flex justify-center p-4">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : globalTransformations.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No global transformations yet.
						</p>
					) : (
						<div className="space-y-2">
							{globalTransformations.map(t => {
								const iconName = getTransformationIconName(
									t.transformationType
								);
								const isEditing = editingTransformationId === t.id;

								return (
									<div
										key={t.id}
										className="rounded-md border bg-background p-3"
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<LucideIcon
													name={iconName}
													className="h-4 w-4 text-muted-foreground"
													fallback={
														<Wand2 className="h-4 w-4 text-muted-foreground" />
													}
												/>
												<div>
													<p className="font-medium text-sm">{t.columnName}</p>
													<p className="text-muted-foreground text-xs">
														{t.transformationType}
														{formatOptions(t.options) && (
															<span className="ml-1">
																({formatOptions(t.options)})
															</span>
														)}
													</p>
												</div>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														if (isEditing) {
															setEditingTransformationId(null);
														} else {
															setEditingTransformationId(t.id);
															setEditingOptions(
																(t.options as Record<string, unknown>) ?? {}
															);
														}
													}}
													className="h-7 w-7 p-0 text-muted-foreground"
												>
													{isEditing ? (
														<X className="h-4 w-4" />
													) : (
														<Pencil className="h-4 w-4" />
													)}
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => deleteTransformation(t.id)}
													disabled={isDeletingTransformation}
													className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										{/* Inline options editor */}
										{isEditing && (
											<div className="mt-3 space-y-3 border-t pt-3">
												<TransformationOptionsEditor
													type={t.transformationType as TransformationType}
													options={editingOptions}
													onChange={setEditingOptions}
												/>
												<div className="flex gap-2">
													<Button
														size="sm"
														onClick={() =>
															handleUpdateTransformationOptions(t.id)
														}
														disabled={isUpdatingTransformation}
													>
														{isUpdatingTransformation ? (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														) : null}
														Save
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setEditingTransformationId(null)}
													>
														Cancel
													</Button>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="filters" className="space-y-4">
					{/* Add New Filter */}
					<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
						<h4 className="font-medium text-sm">Add Filter</h4>

						<div className="flex gap-2">
							<Select
								value={filterSelectedColumn}
								onValueChange={setFilterSelectedColumn}
							>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="Select column..." />
								</SelectTrigger>
								<SelectContent>
									{loadingColumns ? (
										<div className="flex items-center justify-center p-2">
											<Loader2 className="h-4 w-4 animate-spin" />
										</div>
									) : allColumns.length === 0 ? (
										<div className="p-2 text-muted-foreground text-sm">
											No columns found
										</div>
									) : (
										allColumns.map(col => (
											<SelectItem key={col.name} value={col.name}>
												<div className="flex items-center gap-2">
													<span>{col.name}</span>
													{col.tableCount >= 2 && (
														<span className="text-muted-foreground text-xs">
															({col.tableCount} tables)
														</span>
													)}
												</div>
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
							<Select
								value={newFilterType}
								onValueChange={v => setNewFilterType(v as FilterType)}
							>
								<SelectTrigger className="w-40">
									<SelectValue placeholder="Filter type" />
								</SelectTrigger>
								<SelectContent>
									{FILTER_OPTIONS.map(opt => (
										<SelectItem key={opt.type} value={opt.type}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Filter value input */}
						{newFilterType && filterNeedsValue(newFilterType as FilterType) && (
							<Input
								placeholder="Filter value..."
								value={newFilterValue}
								onChange={e => setNewFilterValue(e.target.value)}
							/>
						)}

						<Button
							onClick={handleAddFilter}
							disabled={
								!filterSelectedColumn ||
								!newFilterType ||
								(filterNeedsValue(newFilterType as FilterType) &&
									!newFilterValue.trim()) ||
								isCreatingFilter
							}
							size="sm"
							className="w-full"
						>
							{isCreatingFilter ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Plus className="mr-2 h-4 w-4" />
							)}
							Add Filter
						</Button>
					</div>

					{/* List of Global Filters */}
					{isLoading ? (
						<div className="flex justify-center p-4">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : globalFilters.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							No global filters yet.
						</p>
					) : (
						<div className="space-y-2">
							{globalFilters.map(f => (
								<div
									key={f.id}
									className="flex items-center justify-between rounded-md border bg-background p-3"
								>
									<div className="flex items-center gap-3">
										<Filter className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium text-sm">{f.columnName}</p>
											<p className="text-muted-foreground text-xs">
												{f.filterType}
												{f.filterValue && (
													<span className="font-mono">: "{f.filterValue}"</span>
												)}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => deleteFilter(f.id)}
										disabled={isDeletingFilter}
										className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
