CREATE TABLE "manti_column_transformations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" integer NOT NULL,
	"table_name" text NOT NULL,
	"column_name" text NOT NULL,
	"transformation_type" text NOT NULL,
	"options" jsonb,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "manti_column_transformations" ADD CONSTRAINT "manti_column_transformations_connection_id_manti_database_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."manti_database_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "col_transforms_conn_table_idx" ON "manti_column_transformations" USING btree ("connection_id","table_name");--> statement-breakpoint
CREATE INDEX "col_transforms_user_id_idx" ON "manti_column_transformations" USING btree ("user_id");