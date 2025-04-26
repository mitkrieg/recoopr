ALTER TABLE "theater_seats" ADD COLUMN "restricted_view" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "theater_seats" ADD COLUMN "section_label" varchar(50);