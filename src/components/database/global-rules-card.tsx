"use client";

import { Filter, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
	getTransformationIconName,
} from "~/lib/constants/transformation-options";
import { FILTER_OPTIONS } from "~/lib/constants/filter-options";
import { useGlobalRules } from "~/hooks/use-global-rules";
import { LucideIcon } from "./shared";

interface GlobalRulesCardProps {
	connectionId: number;
}

export function GlobalRulesCard({ connectionId }: GlobalRulesCardProps) {
	const [newColumnName, setNewColumnName] = useState("");
	const [newTransformationType, setNewTransformationType] = useState<
		TransformationType | ""
	>("");
	const [newFilterType, setNewFilterType] = useState<FilterType | "">("");
	const [newFilterValue, setNewFilterValue] = useState("");
	const [newFilterColumnName, setNewFilterColumnName] = useState("");

	const resetTransformationForm = () => {
		setNewColumnName("");
		setNewTransformationType("");
	};

	const resetFilterForm = () => {
		setNewFilterColumnName("");
		setNewFilterType("");
		setNewFilterValue("");
	};

	const {
		globalTransformations,
		globalFilters,
		isLoading,
		createTransformation,
		deleteTransformation,
		createFilter,
		deleteFilter,
		isCreatingTransformation,
		isDeletingTransformation,
		isCreatingFilter,
		isDeletingFilter,
	} = useGlobalRules({
		connectionId,
		onTransformationCreated: resetTransformationForm,
		onFilterCreated: resetFilterForm,
	});

	const handleAddTransformation = () => {
		if (!newColumnName || !newTransformationType) return;
		createTransformation(newColumnName, newTransformationType);
	};

	const handleAddFilter = () => {
		if (!newFilterColumnName || !newFilterType) return;
		createFilter(newFilterColumnName, newFilterType, newFilterValue || null);
	};

	return (
		<Card className="border-border/50 shadow-sm">
			<CardContent className="p-6">
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
						<div className="flex gap-2">
							<Input
								placeholder="Column name (e.g., created_at)"
								value={newColumnName}
								onChange={e => setNewColumnName(e.target.value)}
								className="flex-1"
							/>
							<Select
								value={newTransformationType}
								onValueChange={v =>
									setNewTransformationType(v as TransformationType)
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
							<Button
								onClick={handleAddTransformation}
								disabled={
									!newColumnName ||
									!newTransformationType ||
									isCreatingTransformation
								}
								size="sm"
							>
								{isCreatingTransformation ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
							</Button>
						</div>

						<Separator />

						{/* List of Global Transformations */}
						{isLoading ? (
							<div className="flex justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : globalTransformations.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								No global transformations. Add one above to apply a
								transformation to all tables with matching column names.
							</p>
						) : (
							<div className="space-y-2">
								{globalTransformations.map(t => (
									<div
										key={t.id}
										className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
									>
										<div className="flex items-center gap-3">
											<LucideIcon
												name={getTransformationIconName(t.transformationType)}
												className="h-4 w-4 text-muted-foreground"
												fallback={
													<Wand2 className="h-4 w-4 text-muted-foreground" />
												}
											/>
											<div>
												<p className="font-medium text-sm">{t.columnName}</p>
												<p className="text-muted-foreground text-xs">
													{t.transformationType}
												</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => deleteTransformation(t.id)}
											disabled={isDeletingTransformation}
											className="text-muted-foreground hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="filters" className="space-y-4">
						{/* Add New Filter */}
						<div className="flex gap-2">
							<Input
								placeholder="Column name"
								value={newFilterColumnName}
								onChange={e => setNewFilterColumnName(e.target.value)}
								className="flex-1"
							/>
							<Select
								value={newFilterType}
								onValueChange={v => setNewFilterType(v as FilterType)}
							>
								<SelectTrigger className="w-[140px]">
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
							<Input
								placeholder="Value"
								value={newFilterValue}
								onChange={e => setNewFilterValue(e.target.value)}
								className="w-[120px]"
							/>
							<Button
								onClick={handleAddFilter}
								disabled={
									!newFilterColumnName || !newFilterType || isCreatingFilter
								}
								size="sm"
							>
								{isCreatingFilter ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
							</Button>
						</div>

						<Separator />

						{/* List of Global Filters */}
						{isLoading ? (
							<div className="flex justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : globalFilters.length === 0 ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								No global filters. Add one above to filter data in all tables
								with matching column names.
							</p>
						) : (
							<div className="space-y-2">
								{globalFilters.map(f => (
									<div
										key={f.id}
										className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
									>
										<div className="flex items-center gap-3">
											<Filter className="h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium text-sm">{f.columnName}</p>
												<p className="text-muted-foreground text-xs">
													{f.filterType}
													{f.filterValue && `: "${f.filterValue}"`}
												</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => deleteFilter(f.id)}
											disabled={isDeletingFilter}
											className="text-muted-foreground hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
