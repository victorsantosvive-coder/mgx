export interface Equipment {
  id: string;
  code: string;
  name: string;
  description?: string;
  location?: string;
  manufacturer?: string;
  acquisition_date?: string;
  parent_id?: string;
  position_x?: number;
  position_y?: number;
  card_width?: number;
  card_height?: number;
  criticality?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  custom_color?: string;
  created_at: string;
  updated_at: string;
}

export const criticalityColors = {
  none: '',
  low: 'border-success/20 bg-success/5',
  medium: 'border-warning/20 bg-warning/5',
  high: 'border-danger/20 bg-danger/5',
  critical: 'border-destructive/20 bg-destructive/5'
};

export const criticalityLabels = {
  none: 'Nenhuma',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica'
};