ALTER TABLE "scenario_seatmap_pricing" DROP CONSTRAINT "scenario_seatmap_pricing_scenario_seatmap_id_scenario_seatmaps_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_seatmaps" DROP CONSTRAINT "scenario_seatmaps_scenario_id_scenarios_id_fk";
--> statement-breakpoint
ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_theater_id_theaters_id_fk";
--> statement-breakpoint
ALTER TABLE "theater_rows" DROP CONSTRAINT "theater_rows_section_id_theater_sections_id_fk";
--> statement-breakpoint
ALTER TABLE "theater_seats" DROP CONSTRAINT "theater_seats_row_id_theater_rows_id_fk";
--> statement-breakpoint
ALTER TABLE "theater_sections" DROP CONSTRAINT "theater_sections_theater_id_theaters_id_fk";
--> statement-breakpoint
ALTER TABLE "scenario_seatmap_pricing" ADD CONSTRAINT "scenario_seatmap_pricing_scenario_seatmap_id_scenario_seatmaps_id_fk" FOREIGN KEY ("scenario_seatmap_id") REFERENCES "public"."scenario_seatmaps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_seatmaps" ADD CONSTRAINT "scenario_seatmaps_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_theater_id_theaters_id_fk" FOREIGN KEY ("theater_id") REFERENCES "public"."theaters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_rows" ADD CONSTRAINT "theater_rows_section_id_theater_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."theater_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_seats" ADD CONSTRAINT "theater_seats_row_id_theater_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."theater_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_sections" ADD CONSTRAINT "theater_sections_theater_id_theaters_id_fk" FOREIGN KEY ("theater_id") REFERENCES "public"."theaters"("id") ON DELETE cascade ON UPDATE no action;