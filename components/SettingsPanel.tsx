import React from 'react';
import { X, Sliders } from 'lucide-react';
import { SimulationConfig } from '../types';

interface SettingsPanelProps {
  config: SimulationConfig;
  onUpdate: (key: keyof SimulationConfig, value: number) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdate, onClose }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders size={20} className="text-indigo-500" />
                    Simulation Parameters
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
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
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                Changes apply on next generation reset.
            </div>
        </div>
    </div>
  );
};