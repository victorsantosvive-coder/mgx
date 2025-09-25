import * as XLSX from 'xlsx';

interface WorkOrderExcel {
  id: string;
  code: string;
  type: string;
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

export const generateWorkOrdersExcel = (workOrders: WorkOrderExcel[]) => {
  const worksheet_data = workOrders.map(order => ({
    'Código': order.code,
    'Tipo': order.type?.charAt(0).toUpperCase() + order.type?.slice(1),
    'Status': getStatusLabel(order.status),
    'Prioridade': order.priority?.charAt(0).toUpperCase() + order.priority?.slice(1),
    'Equipamento': order.equipments?.name || 'N/A',
    'Código Equipamento': order.equipments?.code || 'N/A',
    'Data Programada': formatDate(order.scheduled_date),
    'Data Início': order.started_at ? formatDate(order.started_at) : 'Não iniciada',
    'Data Conclusão': order.completed_at ? formatDate(order.completed_at) : 'Não concluída',
    'Máquina Parada': order.machine_down ? 'Sim' : 'Não',
    'Descrição': order.description || 'N/A',
    'Manutentores': order.maintainers?.map(m => m.name).join(', ') || 'N/A',
    'Peças Utilizadas': order.parts?.map(p => `${p.name} (${p.quantity_used})`).join(', ') || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheet_data);
  
  // Auto-width columns
  const colWidths = Object.keys(worksheet_data[0] || {}).map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordens de Serviço');

  const fileName = `ordens_servico_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};