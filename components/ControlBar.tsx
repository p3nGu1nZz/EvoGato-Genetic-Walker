import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Save, Upload, BookOpen, ZoomIn, ZoomOut, Activity, Trophy, Dna, Sliders } from 'lucide-react';

interface ControlBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  onZoom: (delta: number) => void;
  
  // Panel Toggles
  showStats: boolean;
  toggleStats: () => void;
  showLeader: boolean;
  toggleLeader: () => void;
  showGenome: boolean;
  toggleGenome: () => void;
  showSettings: boolean;
  toggleSettings: () => void;
  showResearch: boolean;
  toggleResearch: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
    isPlaying, onTogglePlay, onReset, speed, onSpeedChange, 
    onSave, onLoad, onZoom,
    showStats, toggleStats,
    showLeader, toggleLeader,
    showGenome, toggleGenome,
    showSettings, toggleSettings,
    showResearch, toggleResearch
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onLoad(e.target.files[0]);
    }
  };

  const ToggleButton = ({ active, onClick, icon: Icon, title }: { active: boolean, onClick: () => void, icon: any, title: string }) => (
      <button 
        onClick={onClick} 
        className={`p-2 rounded-full transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        title={title}
      >
        <Icon size={18} />
      </button>
  );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        
        {/* Main Control Pill */}
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 shadow-2xl flex items-center gap-3 pointer-events-auto">
            {/* Playback Controls */}
            <button 
                onClick={onTogglePlay}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            {/* Sim Speed */}
             <div className="flex items-center gap-1">
                {[1, 5, 10, 25].map(s => (
                    <button
                        key={s}
                        onClick={() => onSpeedChange(s)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all min-w-[28px] ${speed === s ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            {/* Camera & Actions */}
            <div className="flex items-center gap-1">
                 <button onClick={() => onZoom(0.1)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Zoom In">
                    <ZoomIn size={16} />
                </button>
                <button onClick={() => onZoom(-0.1)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Zoom Out">
                    <ZoomOut size={16} />
                </button>
                 <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button onClick={onReset} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Reset Population">
                    <RotateCcw size={16} />
                </button>
                <button onClick={onSave} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Save Session">
                    <Save size={16} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full" title="Load Session">
                    <Upload size={16} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            </div>
        </div>

        {/* Panel Toggles (The "New Section") */}
        <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-2 pointer-events-auto transform translate-y-0 hover:-translate-y-1 transition-transform">
            <ToggleButton active={showStats} onClick={toggleStats} icon={Activity} title="Live Stats" />
            <ToggleButton active={showLeader} onClick={toggleLeader} icon={Trophy} title="Leader Telemetry" />
            <ToggleButton active={showGenome} onClick={toggleGenome} icon={Dna} title="Genome View" />
            <div className="w-px h-4 bg-slate-700"></div>
            <ToggleButton active={showResearch} onClick={toggleResearch} icon={BookOpen} title="Research & Math" />
            <ToggleButton active={showSettings} onClick={toggleSettings} icon={Sliders} title="Settings" />
        </div>

    </div>
  );
};
