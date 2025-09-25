import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShoppingCart, Package, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
interface PurchaseRequest {
  id: string;
  request_number: string;
  description: string;
  equipment_id?: string;
  status: string;
  created_at: string;
  equipments?: { name: string; code: string };
}

interface PartsReminder {
  id: string;
  description: string;
  equipment_usage: string;
  created_at: string;
}

interface Equipment {
  id: string;
  name: string;
  code: string;
}

// Kanban Card Component
function KanbanCard({ request }: { request: PurchaseRequest }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: request.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pedido_pendente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'aprovacao': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pedido_aprovacao': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'finalizada': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-sm">{request.request_number}</span>
            <Badge className={getStatusColor(request.status)}>
              {request.status === 'pendente' ? 'Pendente' : 
               request.status === 'pedido_pendente' ? 'Pedido Pendente' :
               request.status === 'aprovacao' ? 'Para Aprovação' :
               request.status === 'pedido_aprovacao' ? 'Pedido em Aprovação' :
               'Finalizada'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{request.description}</p>
          {request.equipments && (
            <p className="text-xs text-muted-foreground">
              Equipamento: {request.equipments.name} ({request.equipments.code})
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  status, 
  title, 
  requests, 
  color 
}: { 
  status: string; 
  title: string; 
  requests: PurchaseRequest[]; 
  color: string;
}) {
  return (
    <div className="flex-1 min-w-80">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            {title}
            <Badge variant="secondary">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 min-h-96">
          <SortableContext items={requests.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {requests.map((request) => (
              <KanbanCard key={request.id} request={request} />
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SolicitacoesCompras() {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [partsReminders, setPartsReminders] = useState<PartsReminder[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showNewReminderDialog, setShowNewReminderDialog] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form states
  const [newRequest, setNewRequest] = useState({
    request_number: '',
    description: '',
    equipment_id: '',
  });

  const [newReminder, setNewReminder] = useState({
    description: '',
    equipment_usage: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPurchaseRequests(),
      loadPartsReminders(),
      loadEquipments()
    ]);
  };

  const loadPurchaseRequests = async () => {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select(`
        *,
        equipments!equipment_id (
          name,
          code
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de compras",
        variant: "destructive",
      });
      return;
    }

    setPurchaseRequests(data || []);
  };

  const loadPartsReminders = async () => {
    const { data, error } = await supabase
      .from('parts_reminders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lembretes de peças",
        variant: "destructive",
      });
      return;
    }

    setPartsReminders(data || []);
  };

  const loadEquipments = async () => {
    const { data, error } = await supabase
      .from('equipments')
      .select('id, name, code')
      .order('name');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      });
      return;
    }

    setEquipments(data || []);
  };

  const handleCreateRequest = async () => {
    if (!newRequest.request_number || !newRequest.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('purchase_requests')
      .insert([{
        request_number: newRequest.request_number,
        description: newRequest.description,
        equipment_id: newRequest.equipment_id || null,
      }]);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar solicitação de compra",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Solicitação de compra criada com sucesso",
    });

    setNewRequest({ request_number: '', description: '', equipment_id: '' });
    setShowNewRequestDialog(false);
    loadPurchaseRequests();
  };

  const handleCreateReminder = async () => {
    if (!newReminder.description || !newReminder.equipment_usage) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('parts_reminders')
      .insert([newReminder]);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar lembrete de peça",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Lembrete de peça criado com sucesso",
    });

    setNewReminder({ description: '', equipment_usage: '' });
    setShowNewReminderDialog(false);
    loadPartsReminders();
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('parts_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir lembrete",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Lembrete excluído com sucesso",
    });

    loadPartsReminders();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const activeRequest = purchaseRequests.find(r => r.id === activeId);
    if (!activeRequest) return;

    let newStatus = activeRequest.status;

    if (over.id === 'pendente') {
      newStatus = 'pendente';
    } else if (over.id === 'pedido_pendente') {
      newStatus = 'pedido_pendente';
    } else if (over.id === 'aprovacao') {
      newStatus = 'aprovacao';
    } else if (over.id === 'pedido_aprovacao') {
      newStatus = 'pedido_aprovacao';
    } else if (over.id === 'finalizada') {
      newStatus = 'finalizada';
    }

    if (newStatus !== activeRequest.status) {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: newStatus })
        .eq('id', activeId);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar status da solicitação",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });

      loadPurchaseRequests();
    }
  };

  // Requests filtrados por status
  const pendingRequests = purchaseRequests.filter(r => r.status === 'pendente');
  const pedidoPendingRequests = purchaseRequests.filter(r => r.status === 'pedido_pendente');
  const approvalRequests = purchaseRequests.filter(r => r.status === 'aprovacao');
  const pedidoApprovalRequests = purchaseRequests.filter(r => r.status === 'pedido_aprovacao');
  const finishedRequests = purchaseRequests.filter(r => r.status === 'finalizada');

  const activeRequest = purchaseRequests.find(r => r.id === activeId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solicitações de Compras</h1>
            <p className="text-muted-foreground">Gerencie solicitações de compras e lembretes de peças</p>
          </div>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Solicitações de Compras
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Lembrete de Peças
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Solicitação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nova Solicitação de Compra</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova solicitação de compra ao sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="request_number">Número da Solicitação *</Label>
                      <Input
                        id="request_number"
                        value={newRequest.request_number}
                        onChange={(e) => setNewRequest({ ...newRequest, request_number: e.target.value })}
                        placeholder="Ex: SC-2024-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={newRequest.description}
                        onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                        placeholder="Descreva a solicitação de compra..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="equipment">Equipamento</Label>
                      <Select value={newRequest.equipment_id} onValueChange={(value) => setNewRequest({ ...newRequest, equipment_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipments.map((equipment) => (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              {equipment.name} ({equipment.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateRequest}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <DndContext 
              onDragStart={handleDragStart} 
              onDragEnd={handleDragEnd}
              collisionDetection={closestCenter}
            >
              <div className="flex gap-6 overflow-x-auto pb-4">
                <DroppableColumn
                  status="pendente"
                  title="Pendente"
                  requests={pendingRequests}
                  color="bg-yellow-500"
                />
                <DroppableColumn
                  status="pedido_pendente"
                  title="Pedido Pendente"
                  requests={pedidoPendingRequests}
                  color="bg-orange-500"
                />
                <DroppableColumn
                  status="aprovacao"
                  title="Para Aprovação"
                  requests={approvalRequests}
                  color="bg-blue-500"
                />
                <DroppableColumn
                  status="pedido_aprovacao"
                  title="Pedido em Aprovação"
                  requests={pedidoApprovalRequests}
                  color="bg-purple-500"
                />
                <DroppableColumn
                  status="finalizada"
                  title="Finalizada"
                  requests={finishedRequests}
                  color="bg-green-500"
                />
              </div>
              <DragOverlay>
                {activeRequest && <KanbanCard request={activeRequest} />}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showNewReminderDialog} onOpenChange={setShowNewReminderDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lembrete
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Novo Lembrete de Peça</DialogTitle>
                    <DialogDescription>
                      Adicione um lembrete para peças que ainda não foram cadastradas.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reminder_description">Descrição da Peça *</Label>
                      <Textarea
                        id="reminder_description"
                        value={newReminder.description}
                        onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                        placeholder="Descreva a peça que precisa ser cadastrada..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="equipment_usage">Onde será usada *</Label>
                      <Input
                        id="equipment_usage"
                        value={newReminder.equipment_usage}
                        onChange={(e) => setNewReminder({ ...newReminder, equipment_usage: e.target.value })}
                        placeholder="Informe onde a peça será utilizada"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewReminderDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateReminder}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partsReminders.map((reminder) => (
                <Card key={reminder.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-center">
                      {reminder.description}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </CardTitle>
                    <CardDescription>{reminder.equipment_usage}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(reminder.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
