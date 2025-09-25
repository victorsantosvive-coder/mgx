import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalWorkOrders: number;
  inProgressCount: number;
  scheduledCount: number;
  completedToday: number;
  availability: number;
  mtbfData: Array<{ month: string; mtbf: number; mttr: number }>;
  costData: Array<{ month: string; preventiva: number; corretiva: number }>;
  recentWorkOrders: Array<{
    id: string;
    code: string;
    equipment: string;
    type: string;
    status: string;
    priority: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    icon: string;
  }>;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkOrders: 0,
    inProgressCount: 0,
    scheduledCount: 0,
    completedToday: 0,
    availability: 0,
    mtbfData: [],
    costData: [],
    recentWorkOrders: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch work orders with equipment data
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select(`
          *,
          equipments!inner(name, code)
        `)
        .order('created_at', { ascending: false });

      // Fetch equipment data for availability calculation
      const { data: equipments } = await supabase
        .from('equipments')
        .select('*');

      // Fetch parts for low stock alerts
      const { data: parts } = await supabase
        .from('parts')
        .select('*')
        .lt('stock_quantity', 'minimum_stock');

      if (workOrders && equipments) {
        // Calculate basic stats
        const totalWorkOrders = workOrders.length;
        const inProgressCount = workOrders.filter(wo => wo.status === 'em_andamento').length;
        const scheduledCount = workOrders.filter(wo => wo.status === 'programada').length;
        
        const today = new Date().toISOString().split('T')[0];
        const completedToday = workOrders.filter(wo => 
          wo.status === 'finalizada' && 
          wo.completed_at?.split('T')[0] === today
        ).length;

        // Calculate availability based on equipment status
        const machinesDown = workOrders.filter(wo => 
          wo.machine_down && wo.status === 'em_andamento'
        ).length;
        const availability = ((equipments.length - machinesDown) / equipments.length) * 100;

        // Calculate MTBF and MTTR data (simplified calculation)
        const mtbfData = calculateMTBFData(workOrders);
        const costData = calculateCostData(workOrders);

        // Get recent work orders
        const recentWorkOrders = workOrders.slice(0, 3).map(wo => ({
          id: wo.id,
          code: wo.code,
          equipment: wo.equipments?.name || 'N/A',
          type: wo.type,
          status: wo.status,
          priority: wo.priority
        }));

        // Generate alerts
        const alerts = generateAlerts(workOrders, parts || []);

        setStats({
          totalWorkOrders,
          inProgressCount,
          scheduledCount,
          completedToday,
          availability: Math.round(availability * 100) / 100,
          mtbfData,
          costData,
          recentWorkOrders,
          alerts
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const workOrdersChannel = supabase
      .channel('dashboard-work-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const partsChannel = supabase
      .channel('dashboard-parts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parts'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workOrdersChannel);
      supabase.removeChannel(partsChannel);
    };
  }, []);

  return { stats, loading, refresh: fetchDashboardData };
};

// Helper functions
const calculateMTBFData = (workOrders: any[]) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  
  return months.map(month => {
    // Simplified MTBF calculation - in real scenario would use actual failure data
    const monthlyOrders = workOrders.filter(wo => {
      const orderMonth = new Date(wo.created_at).getMonth();
      return orderMonth === months.indexOf(month);
    });

    const correctiveOrders = monthlyOrders.filter(wo => wo.type === 'corretiva');
    const avgRepairTime = correctiveOrders.length > 0 
      ? correctiveOrders.reduce((acc, wo) => {
          if (wo.started_at && wo.completed_at) {
            const duration = new Date(wo.completed_at).getTime() - new Date(wo.started_at).getTime();
            return acc + (duration / (1000 * 60 * 60)); // Convert to hours
          }
          return acc + 4; // Default 4 hours if no data
        }, 0) / correctiveOrders.length
      : 4;

    // MTBF = Operating time / Number of failures
    const mtbf = correctiveOrders.length > 0 ? (30 * 24) / correctiveOrders.length : 720;
    
    return {
      month,
      mtbf: Math.round(mtbf),
      mttr: Math.round(avgRepairTime * 10) / 10
    };
  });
};

const calculateCostData = (workOrders: any[]) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  
  return months.map(month => {
    const monthlyOrders = workOrders.filter(wo => {
      const orderMonth = new Date(wo.created_at).getMonth();
      return orderMonth === months.indexOf(month);
    });

    // Simplified cost calculation - would need actual cost data in real scenario
    const preventiva = monthlyOrders.filter(wo => wo.type === 'preventiva').length * 2500;
    const corretiva = monthlyOrders.filter(wo => wo.type === 'corretiva').length * 4500;

    return {
      month,
      preventiva,
      corretiva
    };
  });
};

const generateAlerts = (workOrders: any[], lowStockParts: any[]) => {
  const alerts = [];

  // Low stock alerts
  if (lowStockParts.length > 0) {
    const part = lowStockParts[0];
    alerts.push({
      type: 'warning' as const,
      title: 'Estoque baixo',
      description: `Peça: ${part.name} (${part.stock_quantity} unidades)`,
      icon: 'AlertTriangle'
    });
  }

  // Overdue maintenance
  const overdueOrders = workOrders.filter(wo => {
    if (wo.status === 'programada' && wo.scheduled_date) {
      return new Date(wo.scheduled_date) < new Date();
    }
    return false;
  });

  if (overdueOrders.length > 0) {
    alerts.push({
      type: 'info' as const,
      title: 'Manutenção preventiva vencida',
      description: `${overdueOrders.length} ordem(ns) em atraso`,
      icon: 'Activity'
    });
  }

  // Recent completions
  const recentCompletions = workOrders.filter(wo => {
    if (wo.status === 'finalizada' && wo.completed_at) {
      const completedDate = new Date(wo.completed_at);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return completedDate >= yesterday;
    }
    return false;
  });

  if (recentCompletions.length > 0) {
    const latest = recentCompletions[0];
    alerts.push({
      type: 'success' as const,
      title: 'OS finalizada',
      description: `${latest.code}: Manutenção concluída`,
      icon: 'CheckCircle'
    });
  }

  return alerts.slice(0, 3); // Limit to 3 alerts
};