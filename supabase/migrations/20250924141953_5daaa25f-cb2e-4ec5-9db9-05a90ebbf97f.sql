-- Create purchase_requests table for kanban-style purchase request management
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  equipment_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovacao', 'finalizada')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parts_reminders table for parts that need to be registered
CREATE TABLE public.parts_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  equipment_usage TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_requests
CREATE POLICY "Authenticated users can view purchase requests" 
ON public.purchase_requests 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create purchase requests" 
ON public.purchase_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update purchase requests" 
ON public.purchase_requests 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete purchase requests" 
ON public.purchase_requests 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create policies for parts_reminders
CREATE POLICY "Authenticated users can view parts reminders" 
ON public.parts_reminders 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create parts reminders" 
ON public.parts_reminders 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update parts reminders" 
ON public.parts_reminders 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete parts reminders" 
ON public.parts_reminders 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_reminders_updated_at
BEFORE UPDATE ON public.parts_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX idx_purchase_requests_equipment ON public.purchase_requests(equipment_id);
CREATE INDEX idx_parts_reminders_created_by ON public.parts_reminders(created_by);