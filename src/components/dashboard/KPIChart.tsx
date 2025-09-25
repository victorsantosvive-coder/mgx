import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";

interface MTBFChartProps {
  data?: Array<{ month: string; mtbf: number; mttr: number }>;
}

interface CostChartProps {
  data?: Array<{ month: string; preventiva: number; corretiva: number }>;
}

export function MTBFChart({ data = [] }: MTBFChartProps) {
  const displayData = data.length > 0 ? data : [
    { month: "Jan", mtbf: 0, mttr: 0 },
    { month: "Fev", mtbf: 0, mttr: 0 },
    { month: "Mar", mtbf: 0, mttr: 0 },
    { month: "Abr", mtbf: 0, mttr: 0 },
    { month: "Mai", mtbf: 0, mttr: 0 },
    { month: "Jun", mtbf: 0, mttr: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>MTBF & MTTR</CardTitle>
        <CardDescription>Tempo médio entre falhas e tempo médio de reparo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => [
                `${value} horas`, 
                name === 'mtbf' ? 'MTBF' : 'MTTR'
              ]}
            />
            <Bar yAxisId="left" dataKey="mtbf" fill="hsl(var(--primary))" name="MTBF (horas)" />
            <Line yAxisId="right" type="monotone" dataKey="mttr" stroke="hsl(var(--danger))" name="MTTR (horas)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CostChart({ data = [] }: CostChartProps) {
  const displayData = data.length > 0 ? data : [
    { month: "Jan", preventiva: 0, corretiva: 0 },
    { month: "Fev", preventiva: 0, corretiva: 0 },
    { month: "Mar", preventiva: 0, corretiva: 0 },
    { month: "Abr", preventiva: 0, corretiva: 0 },
    { month: "Mai", preventiva: 0, corretiva: 0 },
    { month: "Jun", preventiva: 0, corretiva: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custos de Manutenção</CardTitle>
        <CardDescription>Comparativo preventiva vs corretiva</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                `R$ ${value.toLocaleString()}`, 
                name === 'preventiva' ? 'Preventiva' : 'Corretiva'
              ]}
            />
            <Bar dataKey="preventiva" fill="hsl(var(--success))" name="Preventiva" />
            <Bar dataKey="corretiva" fill="hsl(var(--danger))" name="Corretiva" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}