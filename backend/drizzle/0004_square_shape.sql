CREATE TABLE "levels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text,
	"elements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"screenshot_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "levels_user_id_idx" ON "levels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "levels_created_at_idx" ON "levels" USING btree ("created_at");