'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggablePanelProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initialPosition?: { x: number; y: number };
  defaultMinimized?: boolean;
}

export function DraggablePanel({ 
  id, 
  title, 
  children, 
  className, 
  style: externalStyle,
  initialPosition = { x: 0, y: 0 },
  defaultMinimized = false
}: DraggablePanelProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = {
    ...externalStyle,
    transform: transform ? CSS.Translate.toString(transform) : externalStyle?.transform,
    top: initialPosition.y,
    left: initialPosition.x,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute z-50 transition-shadow",
        !transform && "transition-all duration-300",
        className
      )}
    >
      <div className="group relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        {/* Drag Handle & Toolbar */}
        <div className={cn(
          "flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/10 transition-opacity duration-300",
          "md:opacity-40 md:group-hover:opacity-100"
        )}>
          <div 
            {...listeners} 
            {...attributes}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-acid transition-all"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all"
              aria-label={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Square className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isMinimized ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100"
        )}>
          {children}
        </div>
        
        {/* Minimized Indicator */}
        {isMinimized && (
          <div 
            onClick={() => setIsMinimized(false)}
            className="px-4 py-2 cursor-pointer hover:bg-white/5 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-acid animate-pulse" />
            <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
              {title || "Painel Minimizado"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
