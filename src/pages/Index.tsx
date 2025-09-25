import { 
  ClipboardList, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Wrench
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MTBFChart, CostChart } from "@/components/dashboard/KPIChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { stats, loading } = useDashboardData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'default';
      case 'programada':
        return 'outline';
      case 'finalizada':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em andamento';
      case 'programada':
        return 'Programada';
      case 'finalizada':
        return 'Finalizada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle':
        return AlertTriangle;
      case 'Activity':
        return Activity;
      case 'CheckCircle':
        return CheckCircle;
      default:
        return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema de manutenção industrial
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema de manutenção industrial
            </p>
          </div>
          <Link to="/solicitacao-login">
            <Button variant="outline" size="lg">
              <Wrench className="h-5 w-5 mr-2" />
              Solicitar Manutenção
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Ordens Abertas"
            value={stats.totalWorkOrders}
            description={`${stats.inProgressCount + stats.scheduledCount} ativas`}
            icon={ClipboardList}
            variant="warning"
          />
          <StatsCard
            title="Em Andamento"
            value={stats.inProgressCount}
            description="Sendo executadas agora"
            icon={PlayCircle}
            variant="success"
          />
          <StatsCard
            title="Programadas"
            value={stats.scheduledCount}
            description="Aguardando execução"
            icon={Clock}
          />
          <StatsCard
            title="Disponibilidade"
            value={`${stats.availability}%`}
            description="Equipamentos operacionais"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <MTBFChart data={stats.mtbfData} />
          <CostChart data={stats.costData} />
        </div>

        {/* Recent OS Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ordens de Serviço Recentes</CardTitle>
              <CardDescription>Últimas OS iniciadas ou programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentWorkOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma ordem de serviço encontrada
                  </p>
                ) : (
                  stats.recentWorkOrders.map((os) => (
                    <div key={os.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{os.code} - {os.equipment}</p>
                        <p className="text-sm text-muted-foreground capitalize">{os.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityVariant(os.priority)}>
                          {os.priority}
                        </Badge>
                        <Badge variant={getStatusColor(os.status)}>
                          {getStatusLabel(os.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
              <CardDescription>Itens que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum alerta no momento
                  </p>
                ) : (
                  stats.alerts.map((alert, index) => {
                    const IconComponent = getIconComponent(alert.icon);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          alert.type === 'warning' ? 'bg-warning/10 border-warning/20' :
                          alert.type === 'info' ? 'bg-info/10 border-info/20' :
                          'bg-success/10 border-success/20'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${
                          alert.type === 'warning' ? 'text-warning' :
                          alert.type === 'info' ? 'text-info' :
                          'text-success'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
