CREATE TABLE "manti_saved_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" integer NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"last_result" jsonb,
	"last_executed_at" timestamp,
	"execution_time_ms" integer,
	"row_count" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "manti_database_connections" ADD COLUMN "ssl_mode" text DEFAULT 'disable';--> statement-breakpoint
ALTER TABLE "manti_saved_queries" ADD CONSTRAINT "manti_saved_queries_connection_id_manti_database_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."manti_database_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_queries_connection_id_idx" ON "manti_saved_queries" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "saved_queries_user_id_idx" ON "manti_saved_queries" USING btree ("user_id");