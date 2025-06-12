
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const ArraySection = ({ 
  title, 
  items, 
  onAdd, 
  onRemove, 
  children,
  className 
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">{title}</h3>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="relative bg-muted/50 rounded-lg p-4 border">
            {items.length > 1 && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-3 right-3 p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="pr-8">
              {children(item, index)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArraySection;