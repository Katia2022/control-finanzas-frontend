-- Drop legacy savings plan/move tables and enum types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_moves') THEN
    EXECUTE 'DROP TABLE IF EXISTS savings_moves CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'savings_plans') THEN
    EXECUTE 'DROP TABLE IF EXISTS savings_plans CASCADE';
  END IF;
  -- Drop enum types if they exist (PostgreSQL)
  BEGIN
    EXECUTE 'DROP TYPE IF EXISTS savings_move_status';
  EXCEPTION WHEN undefined_object THEN
    -- ignore
  END;
  BEGIN
    EXECUTE 'DROP TYPE IF EXISTS savings_plan_type';
  EXCEPTION WHEN undefined_object THEN
  END;
  BEGIN
    EXECUTE 'DROP TYPE IF EXISTS savings_plan_status';
  EXCEPTION WHEN undefined_object THEN
  END;
END$$;

