import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  code: string;
  name: string;
}

interface Maintainer {
  id: string;
  name: string;
  role?: string;
}

interface Part {
  id: string;
  code: string;
  name: string;
  stock_quantity: number;
}

interface WorkOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingOrder?: any;
}

export function WorkOrderForm({ open, onOpenChange, onSuccess, editingOrder }: WorkOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [maintainers, setMaintainers] = useState<Maintainer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: '',
    equipment_id: '',
    scheduled_date: '',
    scheduled_time: '',
    end_date: '',
    end_time: '',
    machine_down: false,
    priority: 'media',
    description: '',
    selected_maintainers: [] as string[],
    selected_parts: [] as Array<{ part_id: string; quantity: number }>
  });

  useEffect(() => {
    if (open) {
      loadEquipments();
      loadMaintainers();
      loadParts();
      
      if (editingOrder) {
        setFormData({
          type: editingOrder.type || '',
          equipment_id: editingOrder.equipment_id || '',
          scheduled_date: editingOrder.scheduled_date ? editingOrder.scheduled_date.split('T')[0] : '',
          scheduled_time: editingOrder.scheduled_date ? editingOrder.scheduled_date.split('T')[1]?.slice(0, 5) : '',
          end_date: editingOrder.completed_at ? editingOrder.completed_at.split('T')[0] : '',
          end_time: editingOrder.completed_at ? editingOrder.completed_at.split('T')[1]?.slice(0, 5) : '',
          machine_down: editingOrder.machine_down || false,
          priority: editingOrder.priority || 'media',
          description: editingOrder.description || '',
          selected_maintainers: [],
          selected_parts: []
        });
      } else {
        resetForm();
      }
    }
  }, [open, editingOrder]);

  const resetForm = () => {
    setFormData({
      type: '',
      equipment_id: '',
      scheduled_date: '',
      scheduled_time: '',
      end_date: '',
      end_time: '',
      machine_down: false,
      priority: 'media',
      description: '',
      selected_maintainers: [],
      selected_parts: []
    });
  };

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('id, code, name')
        .order('name');
      
      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Error loading equipments:', error);
    }
  };

  const loadMaintainers = async () => {
    try {
      const { data, error } = await supabase
        .from('maintainers')
        .select('id, name, role')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setMaintainers(data || []);
    } catch (error) {
      console.error('Error loading maintainers:', error);
    }
  };

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('id, code, name, stock_quantity')
        .gt('stock_quantity', 0)
        .order('name');
      
      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const addMaintainer = (maintainerId: string) => {
    if (!formData.selected_maintainers.includes(maintainerId)) {
      setFormData(prev => ({
        ...prev,
        selected_maintainers: [...prev.selected_maintainers, maintainerId]
      }));
    }
  };

  const removeMaintainer = (maintainerId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_maintainers: prev.selected_maintainers.filter(id => id !== maintainerId)
    }));
  };

  const addPart = (partId: string) => {
    if (!formData.selected_parts.find(p => p.part_id === partId)) {
      setFormData(prev => ({
        ...prev,
        selected_parts: [...prev.selected_parts, { part_id: partId, quantity: 1 }]
      }));
    }
  };

  const removePart = (partId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_parts: prev.selected_parts.filter(p => p.part_id !== partId)
    }));
  };

  const updatePartQuantity = (partId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      selected_parts: prev.selected_parts.map(p => 
        p.part_id === partId ? { ...p, quantity } : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduledDateTime = formData.scheduled_date && formData.scheduled_time 
        ? `${formData.scheduled_date}T${formData.scheduled_time}:00`
        : null;

      const endDateTime = formData.end_date && formData.end_time 
        ? `${formData.end_date}T${formData.end_time}:00`
        : null;

      const workOrderData = {
        code: editingOrder ? editingOrder.code : `OS-${Date.now()}`,
        type: formData.type,
        equipment_id: formData.equipment_id,
        scheduled_date: scheduledDateTime,
        completed_at: endDateTime,
        machine_down: formData.machine_down,
        priority: formData.priority,
        description: formData.description || null
      };

      let workOrderId: string;

      if (editingOrder) {
        // Update existing work orderrrrr
        const { error } = await supabase
          .from('work_orders')
          .update(workOrderData)
          .eq('id', editingOrder.id);

        if (error) throw error;
        workOrderId = editingOrder.id;
      } else {
        // Create new work order
        const { data, error } = await supabase
          .from('work_orders')
          .insert(workOrderData)
          .select()
          .single();

        if (error) throw error;
        workOrderId = data.id;
      }

      // Handle maintainers
      if (formData.selected_maintainers.length > 0) {
        // Remove existing maintainers if editing
        if (editingOrder) {
          await supabase
            .from('work_order_maintainers')
            .delete()
            .eq('work_order_id', workOrderId);
        }

        // Add new maintainers
        const maintainerInserts = formData.selected_maintainers.map(maintainerId => ({
          work_order_id: workOrderId,
          maintainer_id: maintainerId
        }));

        const { error: maintainerError } = await supabase
          .from('work_order_maintainers')
          .insert(maintainerInserts);

        if (maintainerError) throw maintainerError;
      }

      // Handle parts
      if (formData.selected_parts.length > 0) {
        // Remove existing parts if editing
        if (editingOrder) {
          await supabase
            .from('work_order_parts')
            .delete()
            .eq('work_order_id', workOrderId);
        }

        // Add new parts
        const partInserts = formData.selected_parts.map(part => ({
          work_order_id: workOrderId,
          part_id: part.part_id,
          quantity_used: part.quantity
        }));

        const { error: partError } = await supabase
          .from('work_order_parts')
          .insert(partInserts);

        if (partError) throw partError;
      }

      toast({
        title: editingOrder ? "Ordem atualizada" : "Ordem criada",
        description: editingOrder ? "Ordem de serviço atualizada com sucesso!" : "Nova ordem de serviço criada com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving work order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar ordem de serviço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaintainerName = (id: string) => {
    return maintainers.find(m => m.id === id)?.name || 'Mantenedor não encontrado';
  };

  const getPartName = (id: string) => {
    return parts.find(p => p.id === id)?.name || 'Peça não encontrada';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </DialogTitle>
          <DialogDescription>
            {editingOrder ? 'Edite os dados da ordem de serviço' : 'Preencha os dados para criar uma nova ordem de serviço'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Manutenção *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                  <SelectItem value="preditiva">Preditiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamento *</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.code} - {equipment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Data Programada *</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Hora Programada *</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Fim</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="machine_down"
                checked={formData.machine_down}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, machine_down: !!checked }))
                }
              />
              <Label htmlFor="machine_down">Máquina parada durante manutenção</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              placeholder="Descreva o trabalho a ser realizado..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Maintainers Section */}
          <div className="space-y-4">
            <div>
              <Label>Manutentores Responsáveis</Label>
              <div className="flex gap-2 mt-2">
                <Select onValueChange={addMaintainer}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar mantenedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintainers
                      .filter(m => !formData.selected_maintainers.includes(m.id))
                      .map((maintainer) => (
                        <SelectItem key={maintainer.id} value={maintainer.id}>
                          {maintainer.name} {maintainer.role && `(${maintainer.role})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.selected_maintainers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.selected_maintainers.map((maintainerId) => (
                  <Badge key={maintainerId} variant="secondary" className="flex items-center gap-1">
                    {getMaintainerName(maintainerId)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeMaintainer(maintainerId)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Parts Section */}
          <div className="space-y-4">
            <div>
              <Label>Peças a Utilizar</Label>
              <div className="flex gap-2 mt-2">
                <Select onValueChange={addPart}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar peça" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts
                      .filter(p => !formData.selected_parts.find(sp => sp.part_id === p.id))
                      .map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.code} - {part.name} (Estoque: {part.stock_quantity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.selected_parts.length > 0 && (
              <div className="space-y-2">
                {formData.selected_parts.map((selectedPart) => (
                  <div key={selectedPart.part_id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{getPartName(selectedPart.part_id)}</span>
                    <Input
                      type="number"
                      min="1"
                      value={selectedPart.quantity}
                      onChange={(e) => updatePartQuantity(selectedPart.part_id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(selectedPart.part_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingOrder ? "Atualizar" : "Criar Ordem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}