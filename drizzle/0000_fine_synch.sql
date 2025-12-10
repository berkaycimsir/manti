CREATE TABLE "manti_database_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"connection_type" text NOT NULL,
	"connection_string" text,
	"host" text,
	"port" integer,
	"username" text,
	"password" text,
	"database" text,
	"ssl" boolean DEFAULT false,
	"is_active" boolean DEFAULT false,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "db_connections_user_id_idx" ON "manti_database_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "db_connections_user_id_active_idx" ON "manti_database_connections" USING btree ("user_id","is_active");