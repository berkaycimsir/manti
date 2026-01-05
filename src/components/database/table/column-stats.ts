import type { ColumnStats, Row } from "~/types/table";

export function calculateColumnStats(
	rows: Row[],
	columnName: string,
	columnType: string
): ColumnStats {
	const values = rows.map(r => r[columnName]);
	const nonNullValues = values.filter(v => v !== null && v !== undefined);
	const uniqueValues = new Set(nonNullValues.map(v => String(v)));

	const stats: ColumnStats = {
		count: values.length,
		nullCount: values.length - nonNullValues.length,
		uniqueCount: uniqueValues.size,
	};

	const isNumeric =
		columnType.toLowerCase().includes("int") ||
		columnType.toLowerCase().includes("float") ||
		columnType.toLowerCase().includes("double") ||
		columnType.toLowerCase().includes("decimal") ||
		columnType.toLowerCase().includes("numeric") ||
		columnType.toLowerCase().includes("real");

	if (isNumeric && nonNullValues.length > 0) {
		const numericValues = nonNullValues
			.map(v => Number(v))
			.filter(n => !Number.isNaN(n));
		if (numericValues.length > 0) {
			stats.sum = numericValues.reduce((a, b) => a + b, 0);
			stats.avg = stats.sum / numericValues.length;
			stats.min = Math.min(...numericValues);
			stats.max = Math.max(...numericValues);
		}
	} else if (nonNullValues.length > 0) {
		const stringValues = nonNullValues.map(v => String(v)).sort();
		stats.min = stringValues[0];
		stats.max = stringValues[stringValues.length - 1];
	}

	return stats;
}
