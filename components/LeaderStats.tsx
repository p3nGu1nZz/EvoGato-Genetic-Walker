import React from 'react';
import { Zap, Ruler } from 'lucide-react';

interface LeaderStatsProps {
  distance: number;
  height: number;
  velocity: number;
  color: string;
}

export const LeaderStats: React.FC<LeaderStatsProps> = ({ distance, height, velocity, color }) => {
  return (
    <div className="flex flex-col gap-3">
        <div className="space-y-4">
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Ruler size={10} /> Dist</span>
                    <span className="text-sm font-mono text-white">{(distance / 100).toFixed(1)}m</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{width: `${Math.min(100, (distance/5000)*100)}%`}}></div>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1"><Zap size={10} /> Speed</span>
                    <span className="text-sm font-mono text-white">{velocity.toFixed(1)} m/s</span>
                </div>
                 <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-100" style={{width: `${Math.min(100, velocity * 10)}%`}}></div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Phenotype</div>
                <div className="flex-1 h-3 rounded bg-slate-800" style={{backgroundColor: color}}></div>
            </div>
        </div>
    </div>
  );
};
