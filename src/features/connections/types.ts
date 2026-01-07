/**
 * Connection feature types
 * Single source of truth for all connection-related types
 */

export interface Connection {
	id: number;
	name: string;
	connectionType: "connection_string" | "manual";
	host: string | null;
	port: number | null;
	username: string | null;
	database: string | null;
	isActive: boolean | null;
	createdAt: Date | null;
	lastUsedAt?: Date | null;
}

export interface ConnectionFormData {
	name: string;
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	connectionString: string;
	sslMode: "disable" | "prefer" | "require" | "verify-full";
}

export type TestStatus = "idle" | "testing" | "success" | "failed";
