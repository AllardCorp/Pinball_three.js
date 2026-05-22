CREATE TYPE "public"."device_login_status" AS ENUM('pending', 'approved', 'expired');--> statement-breakpoint
CREATE TYPE "public"."score_claim_status" AS ENUM('pending', 'approved', 'expired');--> statement-breakpoint
CREATE TABLE "score_claim_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"claim_code" text NOT NULL,
	"status" "score_claim_status" DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "device_login_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."device_login_status";--> statement-breakpoint
ALTER TABLE "device_login_requests" ALTER COLUMN "status" SET DATA TYPE "public"."device_login_status" USING "status"::"public"."device_login_status";--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "score_claim_requests" ADD CONSTRAINT "score_claim_requests_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_claim_requests" ADD CONSTRAINT "score_claim_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "score_claim_requests_game_id_unique" ON "score_claim_requests" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "score_claim_requests_claim_code_unique" ON "score_claim_requests" USING btree ("claim_code");--> statement-breakpoint
CREATE INDEX "score_claim_requests_status_idx" ON "score_claim_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "score_claim_requests_user_id_idx" ON "score_claim_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "games_user_id_idx" ON "games" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "games_final_score_idx" ON "games" USING btree ("final_score");--> statement-breakpoint
CREATE INDEX "games_played_at_idx" ON "games" USING btree ("played_at");