import React from 'react';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { GenerationStats } from '../types';

interface StatsPanelProps {
  stats: GenerationStats[];
  generation: number;
  bestDistance: number;
  activeCount: number;
  timeRemaining: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, generation, bestDistance, activeCount, timeRemaining }) => {
  return (
    <div className="text-xs flex flex-col gap-4">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider">Generation</span>
                <span className="text-xl font-mono text-white">{generation}</span>
            </div>
            <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider">Best Dist</span>
                <span className="text-xl font-mono text-yellow-400">{(bestDistance / 100).toFixed(1)}m</span>
            </div>
             <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider">Survivors</span>
                <span className="text-xl font-mono text-white">{activeCount}</span>
            </div>
             <div className="bg-slate-800 p-2 rounded">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider">Time Left</span>
                <span className="text-xl font-mono text-white">{timeRemaining}s</span>
            </div>
        </div>
      </div>

      {/* Fitness Chart */}
      <div className="bg-slate-800/50 rounded-lg p-2">
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">FITNESS</p>
        <div className="w-full" style={{ height: 100 }}>
          {stats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
            <AreaChart data={stats}>
              <defs>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <YAxis hide domain={[0, 'dataMax + 10']} />
              <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number) => [value.toFixed(2), 'Max Fitness']}
              />
              <Area 
                  type="monotone" 
                  dataKey="maxFitness" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorMax)" 
                  strokeWidth={2}
                  isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 italic">
                No data yet...
            </div>
          )}
        </div>
      </div>

      {/* Loss/Penalty Chart */}
      <div className="bg-slate-800/50 rounded-lg p-2">
        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">LOSS</p>
        <div className="w-full" style={{ height: 100 }}>
          {stats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={50}>
            <AreaChart data={stats}>
              <defs>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fca5a5' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: number) => [value.toFixed(2), 'Avg Loss']}
              />
              <Area 
                  type="monotone" 
                  dataKey="avgLoss" 
                  stroke="#f43f5e" 
                  fillOpacity={1} 
                  fill="url(#colorLoss)" 
                  strokeWidth={2}
                  isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-600 italic">
                No data yet...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
