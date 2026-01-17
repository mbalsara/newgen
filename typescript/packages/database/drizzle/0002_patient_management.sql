-- Migration: Add patient management features
-- 1. Split patients.name into first_name and last_name
-- 2. Create appointments table

-- Add first_name and last_name columns to patients table
ALTER TABLE "patients" ADD COLUMN "first_name" text;
ALTER TABLE "patients" ADD COLUMN "last_name" text;

--> statement-breakpoint

-- Migrate existing data: split name into first_name and last_name
UPDATE "patients" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from position(' ' in "name") + 1)
    ELSE ''
  END;

--> statement-breakpoint

-- Make first_name and last_name NOT NULL
ALTER TABLE "patients" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "last_name" SET NOT NULL;

--> statement-breakpoint

-- Make the old name column nullable (keeping for backwards compatibility)
ALTER TABLE "patients" ALTER COLUMN "name" DROP NOT NULL;

--> statement-breakpoint

-- Create appointments table
CREATE TABLE "appointments" (
  "id" serial PRIMARY KEY NOT NULL,
  "patient_id" text NOT NULL,
  "visit_date" date NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Add foreign key constraint for appointments
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk"
  FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;
