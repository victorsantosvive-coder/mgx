import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wrench } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  code: string;
  location?: string;
}

const Solicitacao = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    requested_by: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEquipments();
  }, []);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, name, code, location')
        .order('name');

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha a descrição do problema",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const dataToInsert = {
      equipment_id: formData.equipment_id || null,
      description: formData.description.trim(),
      priority: formData.priority,
      requested_by: formData.requested_by.trim() || 'Colaborador'
    };

    console.log('Dados enviados para Supabase:', dataToInsert);

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .insert([dataToInsert]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Solicitação de manutenção enviada com sucesso!",
      });

      setFormData({
        equipment_id: '',
        description: '',
        priority: 'media',
        requested_by: ''
      });
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
              <Wrench className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Solicitação de Manutenção</CardTitle>
            <CardDescription className="text-base">
              Preencha os dados abaixo para solicitar uma manutenção
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="requested_by">Nome do Solicitante</Label>
                <Input
                  id="requested_by"
                  value={formData.requested_by}
                  onChange={(e) => setFormData(prev => ({...prev, requested_by: e.target.value}))}
                  placeholder="Digite seu nome (opcional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipamento</Label>
                <Select 
                  value={formData.equipment_id} 
                  onValueChange={(value) => setFormData(prev => ({...prev, equipment_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.code} - {equipment.name}
                        {equipment.location && ` (${equipment.location})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'baixa' | 'media' | 'alta' | 'critica') => 
                    setFormData(prev => ({...prev, priority: value}))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Problema *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Descreva detalhadamente o problema encontrado no equipamento..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Solicitacao;
