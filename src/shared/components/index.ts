/**
 * Shared components - barrel exports
 * All shared UI components should be imported through this file
 *
 * Note: For granular imports, use direct paths like:
 *   - @shared/components/ui/button
 *   - @shared/components/feedback
 */

export * from "./common";
export * from "./feedback";
export * from "./layout";
export * from "./theme-provider";

// UI components are not re-exported here due to naming conflicts
// Import directly from @shared/components/ui instead
