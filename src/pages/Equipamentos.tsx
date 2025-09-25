import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Search, Edit, Trash2, Move, Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, useDraggable, DragOverlay, DragStartEvent } from "@dnd-kit/core";

interface Equipment {
  id: string;
  code: string;
  name: string;
  description?: string;
  manufacturer?: string;
  location?: string;
  acquisition_date?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  position_x?: number;
  position_y?: number;
  card_width?: number;
  card_height?: number;
}

interface DraggableEquipmentCardProps {
  equipment: Equipment;
  onDelete: (id: string) => void;
  onEdit: (equipment: Equipment) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
}

function DraggableEquipmentCard({ equipment, onDelete, onEdit, onUpdatePosition, onUpdateSize }: DraggableEquipmentCardProps) {
  const [isResizing, setIsResizing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: equipment.id,
    disabled: isResizing,
  });

  const style = transform ? {
    transform: translate3d(${transform.x}px, ${transform.y}px, 0),
  } : undefined;

  const handleResize = (direction: 'increase' | 'decrease') => {
    const currentWidth = equipment.card_width || 320;
    const currentHeight = equipment.card_height || 280;
    
    if (direction === 'increase') {
      onUpdateSize(equipment.id, Math.min(currentWidth + 40, 600), Math.min(currentHeight + 40, 500));
    } else {
      onUpdateSize(equipment.id, Math.max(currentWidth - 40, 280), Math.max(currentHeight - 40, 200));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: equipment.position_x || 0,
        top: equipment.position_y || 0,
        width: equipment.card_width || 320,
        height: equipment.card_height || 280,
        zIndex: isDragging ? 1000 : 1,
      }}
      {...attributes}
    >
      <Card 
        ref={cardRef}
        className={h-full transition-shadow select-none ${isDragging ? 'shadow-2xl opacity-50' : 'hover:shadow-md'}}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg truncate">{equipment.name}</CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleResize('decrease')}
                onMouseDown={() => setIsResizing(true)}
                onMouseUp={() => setIsResizing(false)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleResize('increase')}
                onMouseDown={() => setIsResizing(true)}
                onMouseUp={() => setIsResizing(false)}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                {...listeners}
                className="cursor-move"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(equipment)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(equipment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            <Badge variant="outline" className="w-fit">
              {equipment.code}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="space-y-2">
            {equipment.manufacturer && (
              <p className="text-sm">
                <span className="font-medium">Fabricante:</span> {equipment.manufacturer}
              </p>
            )}
            {equipment.location && (
              <p className="text-sm">
                <span className="font-medium">Localização:</span> {equipment.location}
              </p>
            )}
            {equipment.acquisition_date && (
              <p className="text-sm">
                <span className="font-medium">Aquisição:</span> {new Date(equipment.acquisition_date).toLocaleDateString('pt-BR')}
              </p>
            )}
            {equipment.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {equipment.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Equipamentos() {
  const [showNewEquipmentDialog, setShowNewEquipmentDialog] = useState(false);
  const [showEditEquipmentDialog, setShowEditEquipmentDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [equipmentForm, setEquipmentForm] = useState({
    code: "",
    name: "",
    description: "",
    manufacturer: "",
    location: "",
    acquisition_date: "",
    parent_id: ""
  });

  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    description: "",
    manufacturer: "",
    location: "",
    acquisition_date: "",
    parent_id: ""
  });

  // Load equipments from Supabase
  useEffect(() => {
    loadEquipments();

    // Set up real-time subscription for equipments
    const equipmentChannel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments'
        },
        () => {
          loadEquipments(); // Reload when equipment changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(equipmentChannel);
    };
  }, []);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Error loading equipments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);

    if (!delta) return;

    const equipment = equipments.find(eq => eq.id === active.id);
    if (!equipment) return;

    const newX = (equipment.position_x || 0) + delta.x;
    const newY = (equipment.position_y || 0) + delta.y;

    // Update in database
    await updateEquipmentPosition(active.id as string, newX, newY);
  };

  const updateEquipmentPosition = async (id: string, x: number, y: number) => {
    try {
      // Round values to integers since database expects integer values
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      
      const { error } = await supabase
        .from('equipments')
        .update({ position_x: roundedX, position_y: roundedY })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEquipments(prev => prev.map(eq => 
        eq.id === id ? { ...eq, position_x: roundedX, position_y: roundedY } : eq
      ));
    } catch (error) {
      console.error('Error updating equipment position:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar posição do equipamento",
        variant: "destructive",
      });
    }
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setEditForm({
      code: equipment.code,
      name: equipment.name,
      description: equipment.description || "",
      manufacturer: equipment.manufacturer || "",
      location: equipment.location || "",
      acquisition_date: equipment.acquisition_date || "",
      parent_id: equipment.parent_id || ""
    });
    setShowEditEquipmentDialog(true);
  };

  const handleUpdateEquipment = async () => {
    if (!editingEquipment || !editForm.code || !editForm.name) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const equipmentData = {
        code: editForm.code,
        name: editForm.name,
        description: editForm.description || null,
        manufacturer: editForm.manufacturer || null,
        location: editForm.location || null,
        acquisition_date: editForm.acquisition_date || null,
        parent_id: editForm.parent_id === "none" ? null : editForm.parent_id || null,
      };

      const { error } = await supabase
        .from('equipments')
        .update(equipmentData)
        .eq('id', editingEquipment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso!",
      });

      setShowEditEquipmentDialog(false);
      setEditingEquipment(null);
      setEditForm({
        code: "",
        name: "",
        description: "",
        manufacturer: "",
        location: "",
        acquisition_date: "",
        parent_id: ""
      });
      
      // Reload equipments
      loadEquipments();
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEquipmentSize = async (id: string, width: number, height: number) => {
    try {
      // Round values to integers since database expects integer values
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);
      
      const { error } = await supabase
        .from('equipments')
        .update({ card_width: roundedWidth, card_height: roundedHeight })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setEquipments(prev => prev.map(eq => 
        eq.id === id ? { ...eq, card_width: roundedWidth, card_height: roundedHeight } : eq
      ));
    } catch (error) {
      console.error('Error updating equipment size:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tamanho do equipamento",
        variant: "destructive",
      });
    }
  };

  const handleCreateEquipment = async () => {
    if (!equipmentForm.code || !equipmentForm.name) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const equipmentData = {
        code: equipmentForm.code,
        name: equipmentForm.name,
        description: equipmentForm.description || null,
        manufacturer: equipmentForm.manufacturer || null,
        location: equipmentForm.location || null,
        acquisition_date: equipmentForm.acquisition_date || null,
        parent_id: equipmentForm.parent_id === "none" ? null : equipmentForm.parent_id || null,
      };

      const { error } = await supabase
        .from('equipments')
        .insert(equipmentData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento cadastrado com sucesso!",
      });

      setShowNewEquipmentDialog(false);
      setEquipmentForm({
        code: "",
        name: "",
        description: "",
        manufacturer: "",
        location: "",
        acquisition_date: "",
        parent_id: ""
      });
      
      // Reload equipments
      loadEquipments();
    } catch (error) {
      console.error('Error creating equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', equipmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso!",
      });

      loadEquipments();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir equipamento",
        variant: "destructive",
      });
    }
  };

  const filteredEquipments = equipments.filter(equipment =>
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipamentos</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro de equipamentos
            </p>
          </div>
          
          <Dialog open={showNewEquipmentDialog} onOpenChange={setShowNewEquipmentDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Equipamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados do equipamento
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: EQ-001"
                      value={equipmentForm.code}
                      onChange={(e) => setEquipmentForm({...equipmentForm, code: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Compressor Central"
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({...equipmentForm, name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Fabricante</Label>
                    <Input
                      id="manufacturer"
                      placeholder="Ex: Atlas Copco"
                      value={equipmentForm.manufacturer}
                      onChange={(e) => setEquipmentForm({...equipmentForm, manufacturer: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Setor A - Linha 1"
                      value={equipmentForm.location}
                      onChange={(e) => setEquipmentForm({...equipmentForm, location: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acquisition_date">Data de Aquisição</Label>
                    <Input
                      id="acquisition_date"
                      type="date"
                      value={equipmentForm.acquisition_date}
                      onChange={(e) => setEquipmentForm({...equipmentForm, acquisition_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent">Equipamento Pai</Label>
                    <Select value={equipmentForm.parent_id} onValueChange={(value) => setEquipmentForm({...equipmentForm, parent_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {equipments.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} ({eq.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição detalhada do equipamento..."
                    value={equipmentForm.description}
                    onChange={(e) => setEquipmentForm({...equipmentForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-4">
                   <Button variant="outline" onClick={() => setShowNewEquipmentDialog(false)}>
                     Cancelar
                   </Button>
                   <Button onClick={handleCreateEquipment} disabled={loading}>
                     {loading ? "Cadastrando..." : "Cadastrar"}
                   </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Equipment Dialog */}
          <Dialog open={showEditEquipmentDialog} onOpenChange={setShowEditEquipmentDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Equipamento</DialogTitle>
                <DialogDescription>
                  Atualize os dados do equipamento
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Código *</Label>
                    <Input
                      id="edit-code"
                      placeholder="Ex: EQ-001"
                      value={editForm.code}
                      onChange={(e) => setEditForm({...editForm, code: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome *</Label>
                    <Input
                      id="edit-name"
                      placeholder="Ex: Compressor Central"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-manufacturer">Fabricante</Label>
                    <Input
                      id="edit-manufacturer"
                      placeholder="Ex: Atlas Copco"
                      value={editForm.manufacturer}
                      onChange={(e) => setEditForm({...editForm, manufacturer: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Localização</Label>
                    <Input
                      id="edit-location"
                      placeholder="Ex: Setor A - Linha 1"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-acquisition_date">Data de Aquisição</Label>
                    <Input
                      id="edit-acquisition_date"
                      type="date"
                      value={editForm.acquisition_date}
                      onChange={(e) => setEditForm({...editForm, acquisition_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-parent">Equipamento Pai</Label>
                    <Select value={editForm.parent_id} onValueChange={(value) => setEditForm({...editForm, parent_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {equipments
                          .filter(eq => eq.id !== editingEquipment?.id) // Don't allow self-reference
                          .map((eq) => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name} ({eq.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Descrição detalhada do equipamento..."
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-4">
                   <Button variant="outline" onClick={() => setShowEditEquipmentDialog(false)}>
                     Cancelar
                   </Button>
                   <Button onClick={handleUpdateEquipment} disabled={loading}>
                     {loading ? "Atualizando..." : "Atualizar"}
                   </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos por nome, código, fabricante ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Equipment Canvas */}
        <div className="border rounded-lg bg-muted/30 overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
          {filteredEquipments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum equipamento encontrado" : "Nenhum equipamento cadastrado"}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece cadastrando um novo equipamento
                  </p>
                )}
              </div>
            </div>
          ) : (
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div 
                ref={containerRef}
                className="relative w-full h-full p-4"
                style={{ minHeight: '800px' }}
              >
                {filteredEquipments.map((equipment) => (
                  <DraggableEquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    onDelete={handleDeleteEquipment}
                    onEdit={handleEditEquipment}
                    onUpdatePosition={updateEquipmentPosition}
                    onUpdateSize={updateEquipmentSize}
                  />
                ))}
              </div>
              
              <DragOverlay>
                {activeId ? (
                  <div className="opacity-90">
                    {/* Simplified preview of dragged card */}
                    <Card className="shadow-2xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                          {equipments.find(eq => eq.id === activeId)?.name}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
