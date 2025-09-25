-- Add position and size columns to equipments table
ALTER TABLE public.equipments 
ADD COLUMN position_x integer DEFAULT 0,
ADD COLUMN position_y integer DEFAULT 0,
ADD COLUMN card_width integer DEFAULT 320,
ADD COLUMN card_height integer DEFAULT 280;