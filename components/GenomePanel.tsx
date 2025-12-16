import React, { useState } from 'react';
import { Minus, Maximize2, Grid3X3, MonitorPlay } from 'lucide-react';
import { Genome, GenerationStats } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface GenomePanelProps {
  population: Genome[];
  selectedId: string | null;
  history: GenerationStats[];
}

export const GenomePanel: React.FC<GenomePanelProps> = ({ population, selectedId, history }) => {
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hoveredWeight, setHoveredWeight] = useState<{index: number, value: number} | null>(null);

  // Default to leader (first in sorted list usually, or selected)
  const targetGenome = selectedId 
    ? population.find(g => g.id === selectedId) || population[0] 
    : population[0];

  const getWeightColor = (w: number) => {
    const normalized = (w + 1) / 2; // 0 to 1
    const r = Math.floor(normalized * 255);
    const b = Math.floor((1 - normalized) * 255);
    return `rgb(${r}, 0, ${b})`;
  };

  // Construct chart data for the hovered weight index
  const getWeightHistoryData = (idx: number) => {
      return history.map(stat => ({
          gen: stat.generation,
          val: stat.bestGenomeWeights ? stat.bestGenomeWeights[idx] : 0
      }));
  };

  if (minimized) {
    return (
        <div 
            onClick={() => setMinimized(false)}
            className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors z-10"
        >
            <MonitorPlay size={20} className="text-indigo-400" />
        </div>
    );
  }

  // Expanded View: 4x3 Grid (Using grid-cols-4 for 12 items = 3 rows)
  if (expanded) {
      return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl">
                 <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Grid3X3 className="text-indigo-500" />
                        Population Matrix <span className="text-slate-500 text-sm font-normal">(12 Agents)</span>
                    </h2>
                    <button onClick={() => setExpanded(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <Maximize2 size={20} className="rotate-180" />
                    </button>
                </div>
                
                <div className="flex-1 p-6 overflow-auto">
                    <div className="grid grid-cols-4 gap-4 h-full">
                        {population.slice(0, 12).map((genome, idx) => (
                            <div key={genome.id} className="bg-slate-950 rounded-lg border border-slate-800 p-2 flex flex-col gap-2 relative group hover:border-indigo-500/50 transition-colors">
                                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: genome.color}}></div>
                                        {genome.id}
                                    </span>
                                    <span className="font-mono text-indigo-400">{genome.fitness.toFixed(1)}</span>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-8 gap-px content-start opacity-70 group-hover:opacity-100 transition-opacity">
                                     {genome.weights.slice(0, 64).map((w, i) => (
                                        <div 
                                            key={i} 
                                            className="w-full pt-[100%] rounded-[1px]"
                                            style={{ backgroundColor: getWeightColor(w) }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // Standard View
  return (
    <div className="absolute bottom-24 right-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 w-64 shadow-2xl z-10 flex flex-col gap-2 animate-in slide-in-from-right fade-in duration-500">
      
      {/* Weight History Tooltip/Overlay */}
      {hoveredWeight && (
          <div className="absolute -left-52 top-0 bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl w-48 z-20 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                  <span>Weight #{hoveredWeight.index}</span>
                  <span className="font-mono text-white">{hoveredWeight.value.toFixed(4)}</span>
              </div>
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getWeightHistoryData(hoveredWeight.index)}>
                        <Area type="monotone" dataKey="val" stroke="#818cf8" fill="#3730a3" strokeWidth={1} />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor: targetGenome?.color || '#fff'}}></span>
            {targetGenome ? (targetGenome.id === selectedId ? 'Selected Agent' : 'Alpha Genome') : 'No Data'}
        </h3>
        <div className="flex gap-2">
            <button onClick={() => setExpanded(true)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Expand Grid">
                <Grid3X3 size={14} />
            </button>
            <button onClick={() => setMinimized(true)} className="text-slate-500 hover:text-white transition-colors">
                <Minus size={14} />
            </button>
        </div>
      </div>

      {targetGenome && (
        <>
            <div className="grid grid-cols-8 gap-1 p-2 bg-slate-950/50 rounded-lg">
                {targetGenome.weights.slice(0, 64).map((w, i) => (
                    <div 
                        key={i} 
                        onMouseEnter={() => setHoveredWeight({index: i, value: w})}
                        onMouseLeave={() => setHoveredWeight(null)}
                        className="w-full pt-[100%] rounded-sm relative cursor-crosshair hover:ring-1 ring-white/50 z-10"
                        style={{ backgroundColor: getWeightColor(w) }}
                    >
                    </div>
                ))}
            </div>
            <div className="text-[10px] text-slate-500 font-mono text-center flex justify-between px-2">
                <span>ID: {targetGenome.id}</span>
                <span>FIT: {targetGenome.fitness.toFixed(0)}</span>
            </div>
        </>
      )}
    </div>
  );
};