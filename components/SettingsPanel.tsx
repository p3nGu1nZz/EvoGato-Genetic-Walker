import React from 'react';
import { SimulationConfig } from '../types';

interface SettingsPanelProps {
  config: SimulationConfig;
  onUpdate: (key: keyof SimulationConfig, value: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-6 p-2">
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm text-slate-400">Population Size</label>
                <span className="text-sm font-mono text-indigo-400">{config.populationSize}</span>
            </div>
            <input 
                type="range" min="4" max="50" step="2" 
                value={config.populationSize}
                onChange={(e) => onUpdate('populationSize', parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
        </div>

        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm text-slate-400">Mutation Rate</label>
                <span className="text-sm font-mono text-indigo-400">{(config.mutationRate * 100).toFixed(0)}%</span>
            </div>
            <input 
                type="range" min="0.01" max="0.5" step="0.01" 
                value={config.mutationRate}
                onChange={(e) => onUpdate('mutationRate', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
        </div>

            <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm text-slate-400">Simulation Time (sec)</label>
                <span className="text-sm font-mono text-indigo-400">{config.simulationTimeSteps / 60}s</span>
            </div>
            <input 
                type="range" min="10" max="300" step="10" 
                value={config.simulationTimeSteps / 60}
                onChange={(e) => onUpdate('simulationTimeSteps', parseInt(e.target.value) * 60)}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Changes apply on next generation.
        </div>
    </div>
  );
};
