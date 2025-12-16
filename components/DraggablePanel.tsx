import React, { useState, useEffect, useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';

interface DraggablePanelProps {
  id: string;
  title: string;
  initialX: number;
  initialY: number;
  width?: string;
  height?: string;
  children: React.ReactNode;
  onClose: () => void;
  zIndex: number;
  onFocus: () => void;
  visible: boolean;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({ 
  title, initialX, initialY, width = "w-auto", height = "h-auto", children, onClose, zIndex, onFocus, visible
}) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  if (!visible) return null;

  return (
    <div 
      ref={panelRef}
      className={`absolute flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden ${width} ${height} transition-opacity duration-200 animate-in zoom-in-95`}
      style={{ 
        left: position.x, 
        top: position.y, 
        zIndex: zIndex,
        // Ensure panel stays somewhat on screen (optional simple constraint)
        maxWidth: '100vw',
        maxHeight: '100vh'
      }}
      onMouseDown={onFocus}
    >
      {/* Drag Handle Bar */}
      <div 
        className="h-8 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between px-3 cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <GripHorizontal size={14} />
            {title}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
};
