CREATE TABLE "game_saves" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"state" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_saves" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_contributions" (
	"mission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "guild_contributions_mission_id_user_id_pk" PRIMARY KEY("mission_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "guild_contributions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_members" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"guild_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guild_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guild_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" uuid NOT NULL,
	"week" text NOT NULL,
	"title" text NOT NULL,
	"target" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "guild_missions_guild_week" UNIQUE("guild_id","week")
);
--> statement-breakpoint
ALTER TABLE "guild_missions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guilds_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "guilds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "login_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"event" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "login_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "guild_contributions" ADD CONSTRAINT "guild_contributions_mission_id_guild_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."guild_missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_missions" ADD CONSTRAINT "guild_missions_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guild_members_guild_idx" ON "guild_members" USING btree ("guild_id");--> statement-breakpoint
CREATE INDEX "login_events_ip_idx" ON "login_events" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "login_events_email_idx" ON "login_events" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "login_events_user_idx" ON "login_events" USING btree ("user_id","created_at");