import React, { useState } from 'react';
import { Minus, Zap, Activity, Ruler } from 'lucide-react';

interface LeaderStatsProps {
  distance: number;
  height: number;
  velocity: number;
  color: string;
}

export const LeaderStats: React.FC<LeaderStatsProps> = ({ distance, height, velocity, color }) => {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
      return (
          <div 
              onClick={() => setMinimized(false)}
              className="absolute top-20 left-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors z-10"
          >
              <Activity size={16} className="text-indigo-400" />
          </div>
      );
  }

  return (
    <div className="absolute top-24 left-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 w-48 shadow-2xl z-10 flex flex-col gap-3 animate-in slide-in-from-left fade-in duration-500">
        <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} /> Telemetry
            </h3>
            <button onClick={() => setMinimized(true)} className="text-slate-500 hover:text-white">
                <Minus size={14} />
            </button>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Ruler size={10} /> Dist</span>
                <span className="text-sm font-mono text-white">{(distance / 100).toFixed(1)}m</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{width: `${Math.min(100, (distance/5000)*100)}%`}}></div>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Zap size={10} /> Speed</span>
                <span className="text-sm font-mono text-white">{velocity.toFixed(1)} m/s</span>
            </div>
             <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-100" style={{width: `${Math.min(100, velocity * 10)}%`}}></div>
            </div>
        </div>
    </div>
  );
};
