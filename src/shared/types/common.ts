/**
 * Common utility types used throughout the application
 */

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make certain keys of an object type optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make certain keys of an object type required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
	Required<Pick<T, K>>;

/**
 * Make a type nullable
 */
export type Nullable<T> = T | null;

/**
 * Make a type possibly undefined
 */
export type Maybe<T> = T | undefined;

/**
 * Make a type nullable and possibly undefined
 */
export type Optional<T> = T | null | undefined;

/**
 * Extract the element type from an array type
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * Make all properties of an object deeply partial
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties of an object deeply readonly
 */
export type DeepReadonly<T> = {
	readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ============================================================================
// ID Types
// ============================================================================

/**
 * Branded type for strong typing of IDs
 */
export type Id<T extends string = string> = number & { readonly __brand: T };

/**
 * Connection ID type
 */
export type ConnectionId = Id<"Connection">;

/**
 * User ID type
 */
export type UserId = Id<"User">;

// ============================================================================
// Result Types
// ============================================================================

/**
 * Represents a successful result
 */
export type Success<T> = {
	success: true;
	data: T;
};

/**
 * Represents a failed result
 */
export type Failure<E = Error> = {
	success: false;
	error: E;
};

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

// ============================================================================
// Async Types
// ============================================================================

/**
 * Unwrap a Promise type
 */
export type Awaited<T> = T extends Promise<infer R> ? R : T;

/**
 * Type for async function
 */
export type AsyncFn<T = void> = () => Promise<T>;

/**
 * Type for async function with arguments
 */
export type AsyncFnWithArgs<TArgs extends unknown[], TResult = void> = (
	...args: TArgs
) => Promise<TResult>;

// ============================================================================
// React Types
// ============================================================================

/**
 * Props that accept children
 */
export type PropsWithChildren<P = object> = P & {
	children?: React.ReactNode;
};

/**
 * Props for components that need a className
 */
export type PropsWithClassName<P = object> = P & {
	className?: string;
};

/**
 * Common component props pattern
 */
export type ComponentProps<P = object> = PropsWithChildren<
	PropsWithClassName<P>
>;

// ============================================================================
// Record Types
// ============================================================================

/**
 * A record with string keys
 */
export type StringRecord<T = unknown> = Record<string, T>;

/**
 * A record with number keys
 */
export type NumberRecord<T = unknown> = Record<number, T>;

/**
 * Empty object type (for when you need an explicit empty object)
 */
export type EmptyObject = Record<string, never>;
