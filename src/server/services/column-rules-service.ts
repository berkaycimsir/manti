import { TRPCError } from "@trpc/server";
import { and, eq, isNull, or } from "drizzle-orm";

import { columnFilters, columnTransformations } from "~/server/db/schema";

type Db = typeof import("~/server/db").db;

// ==================== TRANSFORMATIONS ====================

export type TransformationType =
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

export interface CreateTransformationInput {
	connectionId: number;
	tableName: string | null;
	columnName: string;
	transformationType: TransformationType;
	options?: Record<string, unknown>;
	isEnabled?: boolean;
}

export interface UpdateTransformationInput {
	transformationType?: TransformationType;
	options?: Record<string, unknown>;
	isEnabled?: boolean;
}

// ==================== FILTERS ====================

export type FilterType =
	| "contains"
	| "equals"
	| "not_equals"
	| "starts_with"
	| "ends_with"
	| "greater_than"
	| "less_than"
	| "between"
	| "is_null"
	| "is_not_null"
	| "in_list";

export interface CreateFilterInput {
	connectionId: number;
	tableName: string | null;
	columnName: string;
	filterType: FilterType;
	filterValue?: string | null;
	filterValueEnd?: string | null;
	isEnabled?: boolean;
}

export interface UpdateFilterInput {
	filterType?: FilterType;
	filterValue?: string | null;
	filterValueEnd?: string | null;
	isEnabled?: boolean;
}

export const columnRulesService = {
	// ==================== TRANSFORMATIONS ====================

	async listGlobalTransformations(
		db: Db,
		userId: string,
		connectionId: number
	) {
		return db
			.select()
			.from(columnTransformations)
			.where(
				and(
					eq(columnTransformations.userId, userId),
					eq(columnTransformations.connectionId, connectionId),
					isNull(columnTransformations.tableName)
				)
			);
	},

	async listTableTransformations(
		db: Db,
		userId: string,
		connectionId: number,
		tableName: string
	) {
		return db
			.select()
			.from(columnTransformations)
			.where(
				and(
					eq(columnTransformations.userId, userId),
					eq(columnTransformations.connectionId, connectionId),
					or(
						eq(columnTransformations.tableName, tableName),
						isNull(columnTransformations.tableName)
					)
				)
			);
	},

	async createTransformation(
		db: Db,
		userId: string,
		input: CreateTransformationInput
	) {
		// Check if transformation already exists for this column/table context
		const queryConditions = [
			eq(columnTransformations.userId, userId),
			eq(columnTransformations.connectionId, input.connectionId),
			eq(columnTransformations.columnName, input.columnName),
		];

		if (input.tableName === null) {
			queryConditions.push(isNull(columnTransformations.tableName));
		} else {
			queryConditions.push(
				eq(columnTransformations.tableName, input.tableName)
			);
		}

		const existing = await db
			.select()
			.from(columnTransformations)
			.where(and(...queryConditions));

		if (existing.length > 0) {
			const existingTransformation = existing[0];
			if (!existingTransformation) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to find existing transformation",
				});
			}

			// Update existing transformation
			const updated = await db
				.update(columnTransformations)
				.set({
					transformationType: input.transformationType,
					options: input.options,
					isEnabled: input.isEnabled,
				})
				.where(eq(columnTransformations.id, existingTransformation.id))
				.returning();

			return updated[0];
		}

		// Create new transformation
		const result = await db
			.insert(columnTransformations)
			.values({
				userId: userId,
				connectionId: input.connectionId,
				tableName: input.tableName,
				columnName: input.columnName,
				transformationType: input.transformationType,
				options: input.options,
				isEnabled: input.isEnabled ?? true,
			})
			.returning();

		return result[0];
	},

	async updateTransformation(
		db: Db,
		userId: string,
		id: number,
		input: UpdateTransformationInput
	) {
		const result = await db
			.update(columnTransformations)
			.set({
				...(input.transformationType && {
					transformationType: input.transformationType,
				}),
				...(input.options !== undefined && { options: input.options }),
				...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
			})
			.where(
				and(
					eq(columnTransformations.id, id),
					eq(columnTransformations.userId, userId)
				)
			)
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Transformation not found",
			});
		}

		return result[0];
	},

	async deleteTransformation(db: Db, userId: string, id: number) {
		const result = await db
			.delete(columnTransformations)
			.where(
				and(
					eq(columnTransformations.id, id),
					eq(columnTransformations.userId, userId)
				)
			)
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Transformation not found",
			});
		}

		return { success: true };
	},

	// ==================== FILTERS ====================

	async listGlobalFilters(db: Db, userId: string, connectionId: number) {
		return db
			.select()
			.from(columnFilters)
			.where(
				and(
					eq(columnFilters.userId, userId),
					eq(columnFilters.connectionId, connectionId),
					isNull(columnFilters.tableName)
				)
			);
	},

	async listTableFilters(
		db: Db,
		userId: string,
		connectionId: number,
		tableName: string
	) {
		return db
			.select()
			.from(columnFilters)
			.where(
				and(
					eq(columnFilters.userId, userId),
					eq(columnFilters.connectionId, connectionId),
					or(
						eq(columnFilters.tableName, tableName),
						isNull(columnFilters.tableName)
					)
				)
			);
	},

	async createFilter(db: Db, userId: string, input: CreateFilterInput) {
		// Note: The original router did NOT check for existing filters.
		// It allowed multiple filters per column.
		// But for transformations it did check.
		// Wait, looking at original code:
		// createGlobalFilter -> No check. Input has columnName. Allow multiple?
		// createColumnFilter -> No check.
		// BUT createGlobalTransformation -> Checks existing!
		// createColumnTransformation -> Checks existing!

		// So Transformations are 1 per column (per scope).
		// Filters are N per column.

		const result = await db
			.insert(columnFilters)
			.values({
				userId: userId,
				connectionId: input.connectionId,
				tableName: input.tableName,
				columnName: input.columnName,
				filterType: input.filterType,
				filterValue: input.filterValue,
				filterValueEnd: input.filterValueEnd,
				isEnabled: input.isEnabled ?? true,
			})
			.returning();

		return result[0];
	},

	async updateFilter(
		db: Db,
		userId: string,
		id: number,
		input: UpdateFilterInput
	) {
		const result = await db
			.update(columnFilters)
			.set({
				...(input.filterType && { filterType: input.filterType }),
				...(input.filterValue !== undefined && {
					filterValue: input.filterValue,
				}),
				...(input.filterValueEnd !== undefined && {
					filterValueEnd: input.filterValueEnd,
				}),
				...(input.isEnabled !== undefined && { isEnabled: input.isEnabled }),
			})
			.where(and(eq(columnFilters.id, id), eq(columnFilters.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Filter not found",
			});
		}

		return result[0];
	},

	async deleteFilter(db: Db, userId: string, id: number) {
		const result = await db
			.delete(columnFilters)
			.where(and(eq(columnFilters.id, id), eq(columnFilters.userId, userId)))
			.returning();

		if (!result.length) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Filter not found",
			});
		}

		return { success: true };
	},
};
