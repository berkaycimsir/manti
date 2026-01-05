ALTER TABLE "manti_database_connections" ADD COLUMN "color" text DEFAULT 'blue';--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "default_schema" text;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "query_timeout_seconds" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "row_limit" integer DEFAULT 500;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "is_read_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "confirm_destructive" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "keep_alive_seconds" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "auto_reconnect" boolean DEFAULT true;