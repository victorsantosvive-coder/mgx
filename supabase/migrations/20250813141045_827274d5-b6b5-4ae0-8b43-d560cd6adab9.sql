-- Create equipments table with hierarchy support
CREATE TABLE public.equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manufacturer TEXT,
  acquisition_date DATE,
  parent_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create maintainers table
CREATE TABLE public.maintainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  contact TEXT,
  certifications TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parts table
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  supplier TEXT,
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create work orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('preventiva', 'corretiva', 'preditiva')),
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'programada' CHECK (status IN ('programada', 'em_andamento', 'finalizada', 'cancelada')),
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  machine_down BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create work order maintainers junction table
CREATE TABLE public.work_order_maintainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  maintainer_id UUID REFERENCES public.maintainers(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(work_order_id, maintainer_id)
);

-- Create work order parts junction table
CREATE TABLE public.work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
  quantity_used INTEGER NOT NULL DEFAULT 1,
  UNIQUE(work_order_id, part_id)
);

-- Enable RLS on all tables
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_maintainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for equipments
CREATE POLICY "Authenticated users can view equipments" ON public.equipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert equipments" ON public.equipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update equipments" ON public.equipments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete equipments" ON public.equipments FOR DELETE TO authenticated USING (true);

-- Create RLS policies for maintainers
CREATE POLICY "Authenticated users can view maintainers" ON public.maintainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintainers" ON public.maintainers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintainers" ON public.maintainers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete maintainers" ON public.maintainers FOR DELETE TO authenticated USING (true);

-- Create RLS policies for parts
CREATE POLICY "Authenticated users can view parts" ON public.parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parts" ON public.parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parts" ON public.parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete parts" ON public.parts FOR DELETE TO authenticated USING (true);

-- Create RLS policies for work orders
CREATE POLICY "Authenticated users can view work orders" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert work orders" ON public.work_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update work orders" ON public.work_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete work orders" ON public.work_orders FOR DELETE TO authenticated USING (true);

-- Create RLS policies for junction tables
CREATE POLICY "Authenticated users can view work order maintainers" ON public.work_order_maintainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert work order maintainers" ON public.work_order_maintainers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update work order maintainers" ON public.work_order_maintainers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete work order maintainers" ON public.work_order_maintainers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view work order parts" ON public.work_order_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert work order parts" ON public.work_order_parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update work order parts" ON public.work_order_parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete work order parts" ON public.work_order_parts FOR DELETE TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_equipments_updated_at BEFORE UPDATE ON public.equipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintainers_updated_at BEFORE UPDATE ON public.maintainers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate work order codes automatically
CREATE OR REPLACE FUNCTION public.generate_work_order_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    -- Get the current count of work orders today
    SELECT COUNT(*) + 1 INTO counter
    FROM public.work_orders
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Generate code in format OS-YYYYMMDD-001
    new_code := 'OS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.work_orders WHERE code = new_code) LOOP
      counter := counter + 1;
      new_code := 'OS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    NEW.code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for work order code generation
CREATE TRIGGER generate_work_order_code_trigger
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_work_order_code();

-- Insert sample data
INSERT INTO public.equipments (code, name, description, location, manufacturer) VALUES
('COMP-001', 'Compressor A1', 'Compressor principal da linha A', 'Setor A', 'Atlas Copco'),
('EST-002', 'Esteira B2', 'Esteira transportadora setor B', 'Setor B', 'Siemens'),
('MOT-003', 'Motor C3', 'Motor elétrico 50HP', 'Setor C', 'WEG');

INSERT INTO public.maintainers (name, role, contact) VALUES
('João Silva', 'Técnico Mecânico', '(11) 99999-1111'),
('Maria Santos', 'Técnico Elétrico', '(11) 99999-2222'),
('Pedro Costa', 'Técnico Industrial', '(11) 99999-3333');

INSERT INTO public.parts (code, name, description, stock_quantity, minimum_stock, supplier) VALUES
('ROL-001', 'Rolamento SKF 6205', 'Rolamento de esferas SKF 6205', 5, 2, 'SKF do Brasil'),
('COR-002', 'Correia V 13x850', 'Correia em V perfil 13 comprimento 850mm', 8, 3, 'Gates do Brasil'),
('OLE-003', 'Óleo Lubrificante ISO 68', 'Óleo lubrificante industrial ISO VG 68', 12, 5, 'Shell Brasil');