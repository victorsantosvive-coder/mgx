-- Add foreign key constraint between purchase_requests and equipments
ALTER TABLE public.purchase_requests 
ADD CONSTRAINT fk_purchase_requests_equipment 
FOREIGN KEY (equipment_id) REFERENCES public.equipments(id);