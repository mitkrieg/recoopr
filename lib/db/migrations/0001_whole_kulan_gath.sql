CREATE TABLE "theater_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"label" varchar(10) NOT NULL,
	"display_label" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theater_seats" (
	"id" serial PRIMARY KEY NOT NULL,
	"row_id" integer NOT NULL,
	"seat_number" varchar(10) NOT NULL,
	"display_number" varchar(10),
	"price" integer,
	"status" varchar(20),
	"accessible" boolean DEFAULT false,
	"restricted_view" boolean DEFAULT false,
	"house_seat" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theater_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"theater_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"category_key" integer,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theaters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"url" varchar(255) NOT NULL,
	"venue_id" varchar(50),
	"venue_slug" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theater_rows" ADD CONSTRAINT "theater_rows_section_id_theater_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."theater_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_seats" ADD CONSTRAINT "theater_seats_row_id_theater_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."theater_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_sections" ADD CONSTRAINT "theater_sections_theater_id_theaters_id_fk" FOREIGN KEY ("theater_id") REFERENCES "public"."theaters"("id") ON DELETE no action ON UPDATE no action;