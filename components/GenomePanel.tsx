import React, { useState } from 'react';
import { Genome, GenerationStats } from '../types';
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts';

interface GenomePanelProps {
  population: Genome[];
  selectedId: string | null;
  history: GenerationStats[];
}

export const GenomePanel: React.FC<GenomePanelProps> = ({ population, selectedId, history }) => {
  const [hoveredWeight, setHoveredWeight] = useState<{index: number, value: number} | null>(null);

  const targetGenome = selectedId 
    ? population.find(g => g.id === selectedId) || population[0] 
    : population[0];

  const getWeightColor = (w: number) => {
    const normalized = (w + 1) / 2; // 0 to 1
    const r = Math.floor(normalized * 255);
    const b = Math.floor((1 - normalized) * 255);
    return `rgb(${r}, 0, ${b})`;
  };

  const getWeightHistoryData = (idx: number) => {
      return history.map(stat => ({
          gen: stat.generation,
          val: stat.bestGenomeWeights ? stat.bestGenomeWeights[idx] : 0
      }));
  };

  return (
    <div className="flex flex-col gap-2 relative">
      
      {/* Weight History Tooltip/Overlay */}
      {hoveredWeight && (
          <div className="absolute bottom-full left-0 mb-2 bg-slate-950/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-2xl w-56 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <div className="text-[10px] text-slate-400 mb-1 flex justify-between font-bold">
                  <span>Weight Index #{hoveredWeight.index}</span>
                  <span className="font-mono text-white">{hoveredWeight.value.toFixed(4)}</span>
              </div>
              <div className="h-20 w-full bg-slate-900/50 rounded overflow-hidden relative">
                {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getWeightHistoryData(hoveredWeight.index)}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="val" 
                                stroke="#818cf8" 
                                fill="url(#colorVal)" 
                                strokeWidth={2} 
                                isAnimationActive={false} 
                            />
                            <YAxis hide domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">
                        Gathering History...
                    </div>
                )}
              </div>
          </div>
      )}

      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor: targetGenome?.color || '#fff'}}></span>
            {targetGenome ? (targetGenome.id === selectedId ? 'Selected Agent' : 'Alpha Genome') : 'No Data'}
        </h3>
      </div>

      {targetGenome && (
        <>
            {/* Show only first 64 weights for layout sanity */}
            <div className="grid grid-cols-8 gap-1 p-2 bg-slate-950/50 rounded-lg">
                {targetGenome.weights.slice(0, 64).map((w, i) => (
                    <div 
                        key={i} 
                        onMouseEnter={() => setHoveredWeight({index: i, value: w})}
                        onMouseLeave={() => setHoveredWeight(null)}
                        className="w-full pt-[100%] rounded-sm relative cursor-crosshair hover:ring-2 ring-white z-10 transition-shadow"
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
