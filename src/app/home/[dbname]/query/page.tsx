"use client";

import { Button } from "@shared/components/ui/button";
import { useMutationFactory } from "@shared/hooks/use-mutation-factory";
import { useLayoutStore } from "@shared/stores/layout-store";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { QueryTabsManager } from "~/features/saved-queries";
import { api } from "~/trpc/react";

export default function SavedQueriesPage() {
	const router = useRouter();
	const params = useParams();
	const dbname = params?.dbname as string;
	const [expandedQueries, setExpandedQueries] = useState<Set<number>>(
		new Set()
	);
	const utils = api.useUtils();
	const _isLayoutVisible = useLayoutStore(state => state.isLayoutVisible);

	// Decode the connection ID from the dbname param
	const connectionId = Number.parseInt(dbname.split("-").pop() || "0", 10);

	// Delete mutation
	const deleteMutation = api.database.deleteSavedQuery.useMutation(
		useMutationFactory({
			successMessage: "Saved query deleted",
			onSuccess: () => {
				void utils.database.listSavedQueries.invalidate({ connectionId });
			},
		})
	);

	// Execute mutation
	const executeMutation = api.database.executeSavedQuery.useMutation(
		useMutationFactory({
			onSuccess: () => {
				void utils.database.listSavedQueries.invalidate({ connectionId });
			},
		})
	);

	const _toggleExpanded = (id: number) => {
		const newExpanded = new Set(expandedQueries);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedQueries(newExpanded);
	};

	const handleCreateNew = () => {
		router.push(`/home/${dbname}/query/new`);
	};

	const handleEdit = (id: number) => {
		router.push(`/home/${dbname}/query/edit?id=${id}`);
	};

	const _handleDelete = (id: number, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this query?")) {
			deleteMutation.mutate({ id });
		}
	};

	const _handleExecute = (id: number, e: React.MouseEvent) => {
		e.stopPropagation();
		executeMutation.mutate({ id });
	};

	const _formatValue = (value: unknown): string => {
		if (value === null || value === undefined) return "∅";
		if (typeof value === "object") return JSON.stringify(value);
		return String(value);
	};

	const _formatDate = (date: Date | null) => {
		if (!date) return "Never";
		return new Date(date).toLocaleString();
	};

	return (
		<div className="relative space-y-4">
			{/* Header with create button */}
			<div className="flex items-center justify-between">
				<h3 className="font-semibold text-foreground text-lg">Saved Queries</h3>
				<Button onClick={handleCreateNew} className="gap-2">
					<Plus className="h-4 w-4" />
					New Query
				</Button>
			</div>

			<QueryTabsManager
				connectionId={connectionId}
				onEditQuery={handleEdit}
				onExecuteQuery={id => executeMutation.mutate({ id })}
			/>
		</div>
	);
}
