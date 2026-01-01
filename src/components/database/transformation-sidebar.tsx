"use client";

import {
	ArrowDown,
	ArrowUp,
	Braces,
	Calendar,
	CaseSensitive,
	CheckCircle2,
	Eye,
	Hash,
	Plus,
	Scissors,
	Settings2,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

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

type TransformationType =
	| "date"
	| "number"
	| "boolean"
	| "json"
	| "truncate"
	| "mask"
	| "uppercase"
	| "lowercase"
	| "capitalize"
	| "custom";

interface TransformationOption {
	type: TransformationType;
	label: string;
	icon: React.ReactNode;
	description: string;
	defaultOptions: Record<string, unknown>;
}

const TRANSFORMATION_OPTIONS: TransformationOption[] = [
	{
		type: "date",
		label: "Date Format",
		icon: <Calendar className="h-4 w-4" />,
		description: "Format date/timestamp values",
		defaultOptions: { format: "YYYY-MM-DD HH:mm:ss", timezone: "local" },
	},
	{
		type: "number",
		label: "Number Format",
		icon: <Hash className="h-4 w-4" />,
		description: "Format numeric values",
		defaultOptions: {
			decimals: 2,
			thousandsSeparator: ",",
			prefix: "",
			suffix: "",
		},
	},
	{
		type: "boolean",
		label: "Boolean Display",
		icon: <CheckCircle2 className="h-4 w-4" />,
		description: "Customize true/false display",
		defaultOptions: { trueLabel: "✓ Yes", falseLabel: "✗ No" },
	},
	{
		type: "json",
		label: "JSON Pretty Print",
		icon: <Braces className="h-4 w-4" />,
		description: "Format JSON with indentation",
		defaultOptions: { indent: 2 },
	},
	{
		type: "truncate",
		label: "Truncate Text",
		icon: <Scissors className="h-4 w-4" />,
		description: "Limit text length",
		defaultOptions: { maxLength: 50, suffix: "..." },
	},
	{
		type: "mask",
		label: "Mask Data",
		icon: <Eye className="h-4 w-4" />,
		description: "Hide sensitive data",
		defaultOptions: { maskChar: "*", showFirst: 0, showLast: 4 },
	},
	{
		type: "uppercase",
		label: "Uppercase",
		icon: <ArrowUp className="h-4 w-4" />,
		description: "Convert to uppercase",
		defaultOptions: {},
	},
	{
		type: "lowercase",
		label: "Lowercase",
		icon: <ArrowDown className="h-4 w-4" />,
		description: "Convert to lowercase",
		defaultOptions: {},
	},
	{
		type: "capitalize",
		label: "Capitalize",
		icon: <CaseSensitive className="h-4 w-4" />,
		description: "Capitalize first letter",
		defaultOptions: {},
	},
];

const DATE_FORMATS = [
	{ label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
	{ label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
	{ label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
	{ label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
	{ label: "MMM DD, YYYY", value: "MMM DD, YYYY" },
	{ label: "Relative (2 hours ago)", value: "relative" },
	{ label: "ISO 8601", value: "ISO" },
];

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

	// Fetch existing transformations
	const { data: transformations = [], isLoading } =
		api.database.listColumnTransformations.useQuery(
			{ connectionId, tableName },
			{ enabled: isOpen },
		);

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
		},
	});

	const handleAddTransformation = (
		columnName: string,
		type: TransformationType,
	) => {
		const option = TRANSFORMATION_OPTIONS.find((o) => o.type === type);
		createMutation.mutate({
			connectionId,
			tableName,
			columnName,
			transformationType: type,
			options: option?.defaultOptions ?? {},
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
		options: Record<string, unknown>,
	) => {
		updateMutation.mutate({
			id,
			options,
		});
	};

	const handleDelete = (id: number) => {
		deleteMutation.mutate({ id });
	};

	const getTransformationIcon = (type: string) => {
		const option = TRANSFORMATION_OPTIONS.find((o) => o.type === type);
		return option?.icon ?? <Settings2 className="h-4 w-4" />;
	};

	const getTransformationLabel = (type: string) => {
		const option = TRANSFORMATION_OPTIONS.find((o) => o.type === type);
		return option?.label ?? type;
	};

	// Get columns without transformations
	const columnsWithoutTransformations = columns.filter(
		(col) => !transformations.some((t) => t.columnName === col.name),
	);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop overlay */}
			<div
				className="fixed inset-0 z-20 bg-black/50"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
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
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
						</div>
					) : (
						<div className="space-y-4">
							{/* Existing transformations */}
							{transformations.length > 0 && (
								<div className="space-y-3">
									<h3 className="font-medium text-foreground text-sm">
										Active Transformations
									</h3>
									{transformations.map((transformation) => (
										<Card
											key={transformation.id}
											className={cn(
												"p-3",
												!transformation.isEnabled && "opacity-50",
											)}
										>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													{getTransformationIcon(
														transformation.transformationType,
													)}
													<div>
														<p className="font-medium text-foreground text-sm">
															{transformation.columnName}
														</p>
														<p className="text-muted-foreground text-xs">
															{getTransformationLabel(
																transformation.transformationType,
															)}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-1">
													<button
														type="button"
														className={cn(
															"relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
															transformation.isEnabled
																? "bg-primary"
																: "bg-muted",
														)}
														onClick={() =>
															handleToggleEnabled(
																transformation.id,
																transformation.isEnabled ?? true,
															)
														}
													>
														<span
															className={cn(
																"inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
																transformation.isEnabled
																	? "translate-x-6"
																	: "translate-x-1",
															)}
														/>
													</button>
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
												<TransformationOptionsEditor
													type={
														transformation.transformationType as TransformationType
													}
													options={
														(transformation.options as Record<
															string,
															unknown
														>) ?? {}
													}
													onSave={(options) =>
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
													{TRANSFORMATION_OPTIONS.map((option) => (
														<Button
															key={option.type}
															variant="outline"
															size="sm"
															className="h-auto flex-col items-start gap-1 p-3"
															onClick={() =>
																handleAddTransformation(
																	selectedColumn,
																	option.type,
																)
															}
														>
															<div className="flex items-center gap-2">
																{option.icon}
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
													{columnsWithoutTransformations.map((column) => (
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

// Options editor component for each transformation type
function TransformationOptionsEditor({
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

	const updateOption = (key: string, value: unknown) => {
		setLocalOptions((prev) => ({ ...prev, [key]: value }));
	};

	const renderOptions = () => {
		switch (type) {
			case "date":
				return (
					<div className="space-y-2">
						<span className="text-muted-foreground text-xs">Format</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm" className="w-full">
									{(localOptions.format as string) || "Select format"}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								{DATE_FORMATS.map((format) => (
									<DropdownMenuItem
										key={format.value}
										onClick={() => updateOption("format", format.value)}
									>
										{format.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);

			case "number":
				return (
					<div className="space-y-2">
						<div>
							<span className="text-muted-foreground text-xs">Decimals</span>
							<Input
								type="number"
								value={(localOptions.decimals as number) ?? 2}
								onChange={(e) =>
									updateOption("decimals", Number.parseInt(e.target.value, 10))
								}
								className="mt-1 h-8"
							/>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">Prefix</span>
							<Input
								value={(localOptions.prefix as string) ?? ""}
								onChange={(e) => updateOption("prefix", e.target.value)}
								placeholder="e.g. $"
								className="mt-1 h-8"
							/>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">Suffix</span>
							<Input
								value={(localOptions.suffix as string) ?? ""}
								onChange={(e) => updateOption("suffix", e.target.value)}
								placeholder="e.g. %"
								className="mt-1 h-8"
							/>
						</div>
					</div>
				);

			case "boolean":
				return (
					<div className="space-y-2">
						<div>
							<span className="text-muted-foreground text-xs">True Label</span>
							<Input
								value={(localOptions.trueLabel as string) ?? "✓ Yes"}
								onChange={(e) => updateOption("trueLabel", e.target.value)}
								className="mt-1 h-8"
							/>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">False Label</span>
							<Input
								value={(localOptions.falseLabel as string) ?? "✗ No"}
								onChange={(e) => updateOption("falseLabel", e.target.value)}
								className="mt-1 h-8"
							/>
						</div>
					</div>
				);

			case "truncate":
				return (
					<div className="space-y-2">
						<div>
							<span className="text-muted-foreground text-xs">Max Length</span>
							<Input
								type="number"
								value={(localOptions.maxLength as number) ?? 50}
								onChange={(e) =>
									updateOption("maxLength", Number.parseInt(e.target.value, 10))
								}
								className="mt-1 h-8"
							/>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">Suffix</span>
							<Input
								value={(localOptions.suffix as string) ?? "..."}
								onChange={(e) => updateOption("suffix", e.target.value)}
								className="mt-1 h-8"
							/>
						</div>
					</div>
				);

			case "mask":
				return (
					<div className="space-y-2">
						<div>
							<span className="text-muted-foreground text-xs">
								Mask Character
							</span>
							<Input
								value={(localOptions.maskChar as string) ?? "*"}
								onChange={(e) => updateOption("maskChar", e.target.value)}
								maxLength={1}
								className="mt-1 h-8"
							/>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">
								Show Last N Characters
							</span>
							<Input
								type="number"
								value={(localOptions.showLast as number) ?? 4}
								onChange={(e) =>
									updateOption("showLast", Number.parseInt(e.target.value, 10))
								}
								className="mt-1 h-8"
							/>
						</div>
					</div>
				);

			case "json":
				return (
					<div>
						<span className="text-muted-foreground text-xs">Indent</span>
						<Input
							type="number"
							value={(localOptions.indent as number) ?? 2}
							onChange={(e) =>
								updateOption("indent", Number.parseInt(e.target.value, 10))
							}
							className="mt-1 h-8"
						/>
					</div>
				);

			default:
				return (
					<p className="text-muted-foreground text-xs">
						No additional options for this transformation
					</p>
				);
		}
	};

	return (
		<div className="mt-3 space-y-3 border-border border-t pt-3">
			{renderOptions()}
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
