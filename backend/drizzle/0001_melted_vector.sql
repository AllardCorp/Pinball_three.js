CREATE TABLE "device_login_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "device_login_requests" ADD CONSTRAINT "device_login_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "device_login_requests_device_code_unique" ON "device_login_requests" USING btree ("device_code");--> statement-breakpoint
CREATE INDEX "device_login_requests_user_id_idx" ON "device_login_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_login_requests_status_idx" ON "device_login_requests" USING btree ("status");