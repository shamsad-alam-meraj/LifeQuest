-- Foreign keys to Supabase's auth.users (managed by Supabase, not Drizzle).
-- Deleting an account cascades its game data; login_events keeps the row with user_id nulled (audit trail).
ALTER TABLE "game_saves" ADD CONSTRAINT "game_saves_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guild_members" ADD CONSTRAINT "guild_members_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guild_missions" ADD CONSTRAINT "guild_missions_guild_id_fk" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guild_contributions" ADD CONSTRAINT "guild_contributions_mission_id_fk" FOREIGN KEY ("mission_id") REFERENCES "guild_missions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "guild_contributions" ADD CONSTRAINT "guild_contributions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
