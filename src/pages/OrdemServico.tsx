import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, FileDown, CheckCircle, Trash2, Edit, XCircle, RotateCcw, AlertTriangle, Clock, ThumbsUp, ThumbsDown, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderForm } from "@/components/forms/WorkOrderForm";
import { generateWorkOrderPDF } from "@/utils/pdfGenerator";
import { generateWorkOrdersExcel } from "@/utils/excelGenerator";

// Types
interface WorkOrder {
  id: string;
  code: string;
  type: string;
  equipment_id: string;
  status: string;
  priority: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  description?: string;
  machine_down: boolean;
  equipments?: { name: string; code: string };
  maintainers?: Array<{ name: string; role?: string }>;
  parts?: Array<{ name: string; code: string; quantity_used: number }>;
}

interface MaintenanceRequest {
  id: string;
  equipment_id: string;
  description: string;
  priority: string;
  status: string;
  requested_by: string;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  work_order_id?: string;
  equipments?: { name: string; code: string };
}

export default function OrdemServico() {
  const [showNewOSDialog, setShowNewOSDialog] = useState(false);
  const [showEditOSDialog, setShowEditOSDialog] = useState(false);
  const [editingOS, setEditingOS] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkOrders();
    loadMaintenanceRequests();

    const workOrderChannel = supabase
      .channel('work-order-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, loadWorkOrders)
      .subscribe();

    const requestsChannel = supabase
      .channel('maintenance-request-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, loadMaintenanceRequests)
      .subscribe();

    return () => { 
      supabase.removeChannel(workOrderChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const loadWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          equipments!inner(name, code),
          work_order_maintainers(maintainers(name, role)),
          work_order_parts(quantity_used, parts(name, code))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedData = data?.map(order => ({
        ...order,
        maintainers: order.work_order_maintainers?.map((wom: any) => wom.maintainers) || [],
        parts: order.work_order_parts?.map((wop: any) => ({
          ...wop.parts,
          quantity_used: wop.quantity_used
        })) || []
      })) || [];
      
      setWorkOrders(transformedData);
    } catch (error) {
      console.error('Error loading work orders:', error);
      toast({ title: "Erro", description: "Erro ao carregar ordens de serviço", variant: "destructive" });
    }
  };

  const loadMaintenanceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          *,
          equipments!inner(name, code)
        `)
        .eq('status', 'pendente')
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      setMaintenanceRequests(data || []);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
      toast({ title: "Erro", description: "Erro ao carregar solicitações de manutenção", variant: "destructive" });
    }
  };

  const handleGeneratePDF = async (workOrder: WorkOrder) => {
    try {
      generateWorkOrderPDF(workOrder);
      toast({ title: "PDF gerado", description: "PDF da ordem de serviço foi gerado com sucesso!" });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Erro", description: "Erro ao gerar PDF", variant: "destructive" });
    }
  };

  const handleEditOrder = (workOrder: WorkOrder) => {
    setEditingOS(workOrder);
    setShowEditOSDialog(true);
  };

  const handleStartOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'em_andamento', started_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: "Ordem iniciada", description: "Ordem de serviço iniciada com sucesso!" });
      loadWorkOrders();
    } catch (error) {
      console.error('Error starting order:', error);
      toast({ title: "Erro", description: "Erro ao iniciar ordem de serviço", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: 'finalizada', completed_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast({ title: "Ordem finalizada", description: "Ordem de serviço finalizada com sucesso!" });
      loadWorkOrders();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({ title: "Erro", description: "Erro ao finalizar ordem de serviço", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('work_orders').delete().eq('id', orderId);
      if (error) throw error;
      toast({ title: "Ordem excluída", description: "Ordem de serviço excluída com sucesso!" });
      loadWorkOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({ title: "Erro", description: "Erro ao excluir ordem de serviço", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programada': return 'outline';
      case 'em_andamento': return 'default';
      case 'finalizada': return 'secondary';
      case 'cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'programada': return 'Programada';
      case 'em_andamento': return 'Em Andamento';
      case 'finalizada': return 'Finalizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'secondary';
      case 'media': return 'outline';
      case 'alta': return 'default';
      case 'critica': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'critica': return 'Crítica';
      default: return priority;
    }
  };

  const handleApproveRequest = async (request: MaintenanceRequest) => {
    setLoading(true);
    try {
      // Create work order from request
      const workOrderData = {
        code: `OS-${Date.now()}`,
        type: 'corretiva',
        equipment_id: request.equipment_id,
        priority: request.priority,
        description: `Solicitação aprovada - ${request.description}`,
        scheduled_date: new Date().toISOString(),
        machine_down: request.priority === 'critica'
      };

      const { data: workOrder, error: workOrderError } = await supabase
        .from('work_orders')
        .insert(workOrderData)
        .select()
        .single();

      if (workOrderError) throw workOrderError;

      // Update request status
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'aprovada',
          reviewed_at: new Date().toISOString(),
          work_order_id: workOrder.id
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast({
        title: "Solicitação aprovada",
        description: "Ordem de serviço criada com sucesso!",
      });

      loadMaintenanceRequests();
      loadWorkOrders();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'rejeitada',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Solicitação rejeitada",
        description: "Solicitação foi rejeitada com sucesso",
      });

      loadMaintenanceRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithPrompt = (requestId: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (reason && reason.trim()) {
      handleRejectRequest(requestId, reason.trim());
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
            <p className="text-muted-foreground">Gerencie todas as ordens de serviço de manutenção</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateWorkOrdersExcel(workOrders)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => setShowNewOSDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem
            </Button>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders">
              Ordens de Serviço
              {workOrders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {workOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Solicitações
              {maintenanceRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {maintenanceRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4">
              {workOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                workOrders.map((workOrder) => (
                  <Card key={workOrder.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {workOrder.code}
                            <Badge variant={getStatusColor(workOrder.status)}>
                              {getStatusLabel(workOrder.status)}
                            </Badge>
                            {workOrder.machine_down && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Máquina Parada
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-4">
                                <span><strong>Tipo:</strong> {workOrder.type?.charAt(0).toUpperCase() + workOrder.type?.slice(1)}</span>
                                <span><strong>Equipamento:</strong> {workOrder.equipments?.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span><strong>Programada:</strong> {new Date(workOrder.scheduled_date).toLocaleDateString('pt-BR')}</span>
                                {workOrder.completed_at && (
                                  <span><strong>Finalizada:</strong> {new Date(workOrder.completed_at).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {workOrder.description && (
                        <div className="mb-4">
                          <strong>Descrição:</strong>
                          <p className="text-muted-foreground mt-1">{workOrder.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => handleEditOrder(workOrder)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleGeneratePDF(workOrder)}>
                          <FileDown className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {workOrder.status === 'programada' && (
                          <Button size="sm" onClick={() => handleStartOrder(workOrder.id)} disabled={loading}>
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {workOrder.status === 'em_andamento' && (
                          <Button size="sm" onClick={() => handleCompleteOrder(workOrder.id)} disabled={loading}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(workOrder.id)} disabled={loading}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="grid gap-4">
              {maintenanceRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
                  </CardContent>
                </Card>
              ) : (
                maintenanceRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Solicitação #{request.id.slice(0, 8)}
                            <Badge variant={getPriorityColor(request.priority)}>
                              {getPriorityLabel(request.priority)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            <div className="space-y-1">
                              <div className="flex items-center gap-4">
                                <span><strong>Equipamento:</strong> {request.equipments?.code} - {request.equipments?.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span><strong>Solicitado por:</strong> {request.requested_by}</span>
                                <span><strong>Data:</strong> {new Date(request.requested_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <strong>Descrição do Problema:</strong>
                        <p className="text-muted-foreground mt-1">{request.description}</p>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveRequest(request)} 
                          disabled={loading}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRejectWithPrompt(request.id)} 
                          disabled={loading}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <WorkOrderForm
        open={showNewOSDialog || showEditOSDialog}
        onOpenChange={(open) => {
          setShowNewOSDialog(open);
          setShowEditOSDialog(open);
          if (!open) setEditingOS(null);
        }}
        onSuccess={loadWorkOrders}
        editingOrder={editingOS}
      />
    </AppLayout>
  );
}