-- Enable real-time for equipments table
ALTER TABLE public.equipments REPLICA IDENTITY FULL;

-- Add equipments table to real-time publication
BEGIN;
  -- Remove if exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create publication with tables that should have real-time updates
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.equipments, 
    public.work_orders, 
    public.maintainers, 
    public.parts;
COMMIT;