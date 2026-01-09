ALTER TABLE "agents" ADD COLUMN "voice_speed" real DEFAULT 0.9;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "model" text DEFAULT 'gpt-4o-mini';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "model_provider" text DEFAULT 'openai';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "wait_for_greeting" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "event_handling" jsonb;