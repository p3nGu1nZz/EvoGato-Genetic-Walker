import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Save, Upload, BookOpen, ZoomIn, ZoomOut } from 'lucide-react';

interface ControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onOpenSettings: () => void;
  onOpenResearch: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  onZoom: (delta: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
    isPlaying, onTogglePlay, onReset, speed, onSpeedChange, 
    onOpenSettings, onOpenResearch, onSave, onLoad, onZoom
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onLoad(e.target.files[0]);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 shadow-2xl flex items-center gap-4 z-10 animate-in slide-in-from-bottom fade-in duration-700">
      <button 
        onClick={onTogglePlay}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
      </button>

      <div className="h-8 w-px bg-slate-700 mx-1"></div>

      <div className="flex items-center gap-1">
          <button onClick={() => onZoom(0.1)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Zoom In">
            <ZoomIn size={18} />
          </button>
           <button onClick={() => onZoom(-0.1)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Zoom Out">
            <ZoomOut size={18} />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1"></div>

          <button onClick={onReset} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Reset Population">
            <RotateCcw size={18} />
          </button>
          
           <button onClick={onSave} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Save Session">
            <Save size={18} />
          </button>

           <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Load Session">
            <Upload size={18} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

           <button onClick={onOpenResearch} className="p-2 text-indigo-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Research & Math">
            <BookOpen size={18} />
          </button>

           <button onClick={onOpenSettings} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Settings">
            <Settings size={18} />
          </button>
      </div>

      <div className="h-8 w-px bg-slate-700 mx-1"></div>

      <div className="flex items-center gap-1">
        {[1, 5, 10, 25, 50].map(s => (
            <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all min-w-[32px] ${speed === s ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
            >
                {s}x
            </button>
        ))}
      </div>
    </div>
  );
};