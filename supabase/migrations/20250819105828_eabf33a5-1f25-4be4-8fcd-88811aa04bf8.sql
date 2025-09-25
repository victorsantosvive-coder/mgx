-- Create maintenance requests table
CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipments(id),
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  requested_by TEXT DEFAULT 'Colaborador',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  work_order_id UUID REFERENCES public.work_orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance requests
CREATE POLICY "Everyone can view maintenance requests" 
ON public.maintenance_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Everyone can create maintenance requests" 
ON public.maintenance_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance requests" 
ON public.maintenance_requests 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete maintenance requests" 
ON public.maintenance_requests 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_equipment ON public.maintenance_requests(equipment_id);