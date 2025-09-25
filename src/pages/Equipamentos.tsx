import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Equipment, criticalityColors, criticalityLabels } from "@/types/equipment";
import { CreditCard as Edit, Trash2, Move, Maximize2, Minimize2 } from "lucide-react";

interface DraggableEquipmentCardProps {
  equipment: Equipment;
  onDelete: (id: string) => void;
  onEdit: (equipment: Equipment) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  scale: number;
}

export function DraggableEquipmentCard({ 
  equipment, 
  onDelete, 
  onEdit, 
  onUpdatePosition, 
  onUpdateSize,
  scale 
}: DraggableEquipmentCardProps) {
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
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
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

  const criticality = equipment.criticality || 'none';
  const cardColorClass = equipment.custom_color 
    ? '' 
    : criticalityColors[criticality];

  const customColorStyle = equipment.custom_color 
    ? {
        borderColor: equipment.custom_color,
        backgroundColor: ${equipment.custom_color}15, // 15 = ~8% opacity in hex
      }
    : {};

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
      {...listeners}
    >
      <Card 
        ref={cardRef}
        style={customColorStyle}
        className={`h-full transition-all duration-200 select-none cursor-move border-2 ${cardColorClass} ${
          isDragging ? 'shadow-2xl opacity-60 scale-105' : 'hover:shadow-lg hover:scale-[1.02]'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg truncate">{equipment.name}</CardTitle>
            <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleResize('decrease')}
                onMouseDown={() => setIsResizing(true)}
                onMouseUp={() => setIsResizing(false)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleResize('increase')}
                onMouseDown={() => setIsResizing(true)}
                onMouseUp={() => setIsResizing(false)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(equipment)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(equipment.id)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="flex gap-2 items-center">
            <Badge variant="outline" className="w-fit">
              {equipment.code}
            </Badge>
            {criticality !== 'none' && (
              <Badge 
                variant={
                  criticality === 'critical' ? 'destructive' :
                  criticality === 'high' ? 'destructive' :
                  criticality === 'medium' ? 'secondary' :
                  criticality === 'low' ? 'outline' :
                  'outline'
                }
                className="text-xs"
              >
                {criticalityLabels[criticality]}
              </Badge>
            )}
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
