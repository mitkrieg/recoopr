ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_production_id_productions_id_fk";
--> statement-breakpoint
ALTER TABLE "productions" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "productions" ADD CONSTRAINT "productions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;