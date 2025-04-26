CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	CONSTRAINT "teams_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "teams_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
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
	"x" real,
	"y" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theater_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"theater_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"category_key" integer,
	"color" varchar(20),
	"parent_section" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theaters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"url" varchar(255),
	"venue_id" varchar(50),
	"venue_slug" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_rows" ADD CONSTRAINT "theater_rows_section_id_theater_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."theater_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_seats" ADD CONSTRAINT "theater_seats_row_id_theater_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."theater_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theater_sections" ADD CONSTRAINT "theater_sections_theater_id_theaters_id_fk" FOREIGN KEY ("theater_id") REFERENCES "public"."theaters"("id") ON DELETE no action ON UPDATE no action;