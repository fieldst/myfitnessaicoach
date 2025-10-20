/*
  # Create Fitness AI Coach Database Schema

  1. New Tables
    - `days`
      - `id` (uuid, primary key) - Unique identifier for each day entry
      - `user_id` (uuid, foreign key to auth.users) - Owner of the day entry
      - `date` (text) - Date in YYYY-MM-DD format
      - `totals` (jsonb) - Daily totals (food_cals, workout_cals, allowance, remaining, etc.)
      - `targets` (jsonb) - Daily macro targets (calories, protein, carbs, fat, label)
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

    - `foods`
      - `id` (uuid, primary key) - Unique identifier for each food entry
      - `user_id` (uuid, foreign key to auth.users) - Owner of the food entry
      - `date` (text) - Date in YYYY-MM-DD format
      - `name` (text) - Name of the food
      - `calories` (integer) - Calorie count
      - `created_at` (timestamptz) - When the record was created

    - `workouts`
      - `id` (uuid, primary key) - Unique identifier for each workout entry
      - `user_id` (uuid, foreign key to auth.users) - Owner of the workout entry
      - `date` (text) - Date in YYYY-MM-DD format
      - `activity` (text) - Name/description of the activity
      - `minutes` (integer) - Duration in minutes
      - `calories_burned` (integer) - Estimated calories burned
      - `intensity` (text) - Intensity level (low, moderate, high)
      - `notes` (text) - Additional notes
      - `order_index` (integer) - Display order
      - `source` (text) - Source of workout (plan, manual)
      - `created_at` (timestamptz) - When the record was created

    - `saved_workouts`
      - `id` (uuid, primary key) - Unique identifier for saved workout
      - `user_id` (uuid, foreign key to auth.users) - Owner of the saved workout
      - `name` (text) - Display name for the saved workout
      - `plan` (jsonb) - The workout plan data (PlanDay structure)
      - `created_at` (timestamptz) - When the record was created

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only read/write their own records

  3. Indexes
    - Add indexes on user_id and date columns for efficient queries
*/

CREATE TABLE IF NOT EXISTS days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  totals jsonb DEFAULT '{}'::jsonb,
  targets jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_days_user_date ON days(user_id, date);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own days"
  ON days FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own days"
  ON days FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own days"
  ON days FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own days"
  ON days FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  name text NOT NULL,
  calories integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_user_date ON foods(user_id, date);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own foods"
  ON foods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own foods"
  ON foods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foods"
  ON foods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods"
  ON foods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  activity text NOT NULL,
  minutes integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  intensity text DEFAULT '',
  notes text DEFAULT '',
  order_index integer DEFAULT 0,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS saved_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  plan jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_workouts_user ON saved_workouts(user_id, created_at DESC);

ALTER TABLE saved_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved workouts"
  ON saved_workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved workouts"
  ON saved_workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved workouts"
  ON saved_workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved workouts"
  ON saved_workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
