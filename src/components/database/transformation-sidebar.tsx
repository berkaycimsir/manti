"use client";

import { Plus, Settings2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

import { LucideIcon } from "~/components/database/shared/lucide-icon";
import { ToggleSwitch } from "~/components/database/shared/toggle-switch";
import { TransformationOptionsEditor } from "~/components/database/shared/transformation-options-editor";
import { formatOptions } from "~/lib/column-config-utils";
import {
	getDefaultTransformationOptions,
	getTransformationIconName,
	getTransformationLabel,
	TRANSFORMATION_OPTIONS,
} from "~/lib/constants/transformation-options";
import type { TransformationType } from "~/types/transformations";

interface Column {
	name: string;
	type: string;
}

interface TransformationSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	connectionId: number;
	tableName: string;
	columns: Column[];
}

export function TransformationSidebar({
	isOpen,
	onClose,
	connectionId,
	tableName,
	columns,
}: TransformationSidebarProps) {
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [editingTransformation, setEditingTransformation] = useState<
		number | null
	>(null);

	const utils = api.useUtils();

	// Fetch existing transformations for this table (includes both table-specific AND global)
	const { data: allTransformations = [], isLoading } =
		api.database.listColumnTransformations.useQuery(
			{ connectionId, tableName },
			{ enabled: isOpen }
		);

	// Fetch global transformations separately for display purposes
	const { data: globalTransformations = [], isLoading: loadingGlobal } =
		api.database.listGlobalTransformations.useQuery(
			{ connectionId },
			{ enabled: isOpen }
		);

	// Filter to only table-specific transformations (exclude global ones)
	const transformations = allTransformations.filter(t => t.tableName !== null);

	// Compute which global transformations are overridden by ENABLED table-specific ones
	const getGlobalOverrideStatus = (columnName: string) => {
		return transformations.some(
			t => t.columnName === columnName && t.isEnabled
		);
	};

	// Create transformation mutation
	const createMutation = api.database.createColumnTransformation.useMutation({
		onSuccess: () => {
			void utils.database.listColumnTransformations.invalidate({
				connectionId,
				tableName,
			});
			setSelectedColumn(null);
		},
	});

	// Update transformation mutation
	const updateMutation = api.database.updateColumnTransformation.useMutation({
		onSuccess: () => {
			void utils.database.listColumnTransformations.invalidate({
				connectionId,
				tableName,
			});
			setEditingTransformation(null);
		},
	});

	// Delete transformation mutation
	const deleteMutation = api.database.deleteColumnTransformation.useMutation({
		onSuccess: () => {
			void utils.database.listColumnTransformations.invalidate({
				connectionId,
				tableName,
			});
			// Also invalidate global transformations in case a global one was deleted
			void utils.database.listGlobalTransformations.invalidate({
				connectionId,
			});
		},
	});

	const handleAddTransformation = (
		columnName: string,
		type: TransformationType
	) => {
		createMutation.mutate({
			connectionId,
			tableName,
			columnName,
			transformationType: type,
			options: getDefaultTransformationOptions(type),
			isEnabled: true,
		});
	};

	const handleToggleEnabled = (id: number, currentEnabled: boolean) => {
		updateMutation.mutate({
			id,
			isEnabled: !currentEnabled,
		});
	};

	const handleUpdateOptions = (
		id: number,
		options: Record<string, unknown>
	) => {
		updateMutation.mutate({
			id,
			options,
		});
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	// Get columns without transformations
	const columnsWithoutTransformations = columns.filter(
		col => !transformations.some(t => t.columnName === col.name)
	);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop overlay */}
			<div
				className="fixed inset-0 z-20 bg-black/50"
				onClick={onClose}
				onKeyDown={e => e.key === "Escape" && onClose()}
				role="button"
				tabIndex={0}
				aria-label="Close sidebar"
			/>
			<div className="fixed top-0 right-0 z-30 flex h-full w-[480px] flex-col border-border border-l bg-card shadow-lg">
				{/* Header */}
				<div className="flex items-center justify-between border-border border-b p-4">
					<div>
						<h2 className="font-semibold text-foreground text-lg">
							Column Transformations
						</h2>
						<p className="text-muted-foreground text-sm">{tableName}</p>
					</div>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<X className="h-5 w-5" />
					</Button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					{isLoading || loadingGlobal ? (
						<div className="flex items-center justify-center py-8">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
						</div>
					) : (
						<div className="space-y-4">
							{/* Global transformations */}
							{globalTransformations.length > 0 && (
								<div className="space-y-3">
									<h3 className="flex items-center gap-2 font-medium text-foreground text-sm">
										Global Transformations
										<Badge variant="secondary" className="text-xs">
											Connection-wide
										</Badge>
									</h3>
									{globalTransformations.map(globalT => {
										const isOverridden = getGlobalOverrideStatus(
											globalT.columnName
										);
										return (
											<Card
												key={`global-${globalT.id}`}
												className={cn(
													"border-dashed p-3",
													isOverridden && "bg-muted/30 opacity-50"
												)}
											>
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-2">
														<LucideIcon
															name={getTransformationIconName(
																globalT.transformationType
															)}
															className="h-4 w-4"
															fallback={<Settings2 className="h-4 w-4" />}
														/>
														<div>
															<p
																className={cn(
																	"font-medium text-sm",
																	isOverridden && "line-through"
																)}
															>
																{globalT.columnName}
															</p>
															<p className="text-muted-foreground text-xs">
																{getTransformationLabel(
																	globalT.transformationType
																)}
																{formatOptions(globalT.options) && (
																	<span className="ml-1">
																		({formatOptions(globalT.options)})
																	</span>
																)}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-1">
														{isOverridden && (
															<Badge
																variant="outline"
																className="border-orange-300 text-orange-600 text-xs"
															>
																Overridden
															</Badge>
														)}
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 text-destructive hover:text-destructive"
															onClick={() => handleDelete(globalT.id)}
															title="Delete global transformation"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</Card>
										);
									})}
								</div>
							)}

							{/* Existing table-specific transformations */}
							{transformations.length > 0 && (
								<div className="space-y-3">
									<h3 className="font-medium text-foreground text-sm">
										Active Transformations
									</h3>
									{transformations.map(transformation => (
										<Card
											key={transformation.id}
											className={cn(
												"p-3",
												!transformation.isEnabled && "opacity-50"
											)}
										>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													<LucideIcon
														name={getTransformationIconName(
															transformation.transformationType
														)}
														className="h-4 w-4"
														fallback={<Settings2 className="h-4 w-4" />}
													/>
													<div>
														<p className="font-medium text-foreground text-sm">
															{transformation.columnName}
														</p>
														<p className="text-muted-foreground text-xs">
															{getTransformationLabel(
																transformation.transformationType
															)}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-1">
													<ToggleSwitch
														enabled={transformation.isEnabled ?? true}
														onChange={() =>
															handleToggleEnabled(
																transformation.id,
																transformation.isEnabled ?? true
															)
														}
													/>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-destructive hover:text-destructive"
														onClick={() => handleDelete(transformation.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>

											{/* Options editor */}
											{editingTransformation === transformation.id ? (
												<TransformationOptionsEditorWithSave
													type={
														transformation.transformationType as TransformationType
													}
													options={
														(transformation.options as Record<
															string,
															unknown
														>) ?? {}
													}
													onSave={options =>
														handleUpdateOptions(transformation.id, options)
													}
													onCancel={() => setEditingTransformation(null)}
												/>
											) : (
												<Button
													variant="ghost"
													size="sm"
													className="mt-2 h-7 text-xs"
													onClick={() =>
														setEditingTransformation(transformation.id)
													}
												>
													Edit options
												</Button>
											)}
										</Card>
									))}
								</div>
							)}

							{/* Add new transformation */}
							<div className="space-y-3">
								<h3 className="font-medium text-foreground text-sm">
									Add Transformation
								</h3>

								{columnsWithoutTransformations.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										All columns have transformations
									</p>
								) : (
									<div className="space-y-2">
										{selectedColumn ? (
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<p className="font-medium text-foreground text-sm">
														{selectedColumn}
													</p>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setSelectedColumn(null)}
													>
														Cancel
													</Button>
												</div>
												<div className="grid grid-cols-2 gap-2">
													{TRANSFORMATION_OPTIONS.map(option => (
														<Button
															key={option.type}
															variant="outline"
															size="sm"
															className="h-auto flex-col items-start gap-1 p-3"
															onClick={() =>
																handleAddTransformation(
																	selectedColumn,
																	option.type
																)
															}
														>
															<div className="flex items-center gap-2">
																<LucideIcon
																	name={option.icon}
																	className="h-4 w-4"
																/>
																<span className="text-xs">{option.label}</span>
															</div>
														</Button>
													))}
												</div>
											</div>
										) : (
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="outline" className="w-full gap-2">
														<Plus className="h-4 w-4" />
														Select Column
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="max-h-64 w-80 overflow-y-auto">
													{columnsWithoutTransformations.map(column => (
														<DropdownMenuItem
															key={column.name}
															onClick={() => setSelectedColumn(column.name)}
														>
															<div className="flex flex-col">
																<span>{column.name}</span>
																<span className="text-muted-foreground text-xs">
																	{column.type}
																</span>
															</div>
														</DropdownMenuItem>
													))}
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

// Wrapper component with Save/Cancel buttons that uses the shared editor
function TransformationOptionsEditorWithSave({
	type,
	options,
	onSave,
	onCancel,
}: {
	type: TransformationType;
	options: Record<string, unknown>;
	onSave: (options: Record<string, unknown>) => void;
	onCancel: () => void;
}) {
	const [localOptions, setLocalOptions] =
		useState<Record<string, unknown>>(options);

	return (
		<div className="mt-3 space-y-3 border-border border-t pt-3">
			<TransformationOptionsEditor
				type={type}
				options={localOptions}
				onChange={setLocalOptions}
				compact
			/>
			<div className="flex gap-2">
				<Button
					size="sm"
					className="flex-1"
					onClick={() => onSave(localOptions)}
				>
					Save
				</Button>
				<Button variant="outline" size="sm" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	);
}
