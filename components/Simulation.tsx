import React, { useState } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { StatsPanel } from './StatsPanel';
import { ControlBar } from './ControlBar';
import { GenomePanel } from './GenomePanel';
import { LeaderStats } from './LeaderStats';
import { TransitionScreen } from './TransitionScreen';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { ResearchPanel } from './ResearchPanel';

export const Simulation: React.FC = () => {
  const {
      canvasRef,
      config,
      updateConfig,
      appState,
      speed,
      setSpeed,
      stats,
      currentGen,
      activeCount,
      bestDist,
      timeLeft,
      leaderGenome,
      leaderColor,
      leaderVelocity,
      populationData,
      selectedCatId,
      handleStart,
      handleTogglePlay,
      handleReset,
      handleCanvasClick,
      setStats,
      handleZoom
  } = useSimulation();

  const [showSettings, setShowSettings] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  const handleSaveSession = () => {
      const sessionData = { stats, config };
      const blob = new Blob([JSON.stringify(sessionData)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evogato-stats-gen${currentGen}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleLoadSession = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.stats) {
                  setStats(data.stats);
                  if (data.config) {
                       Object.keys(data.config).forEach(k => updateConfig(k as any, data.config[k]));
                  }
                  alert("Stats loaded from session.");
              }
          } catch(err) {
              console.error(err);
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden select-none font-sans">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      {appState === 'START' && <StartScreen onStart={handleStart} />}
      {appState === 'TRANSITION' && <TransitionScreen generation={currentGen} />}
      {showSettings && <SettingsPanel config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />}
      {showResearch && <ResearchPanel onClose={() => setShowResearch(false)} />}
      
      {appState !== 'START' && (
        <>
            <div className="absolute top-4 left-4 p-4 text-white/50 pointer-events-none z-0">
                <h1 className="text-3xl font-black italic tracking-tighter mb-1 text-white">EVO<span className="text-indigo-500">GATO</span></h1>
                <p className="text-[10px] tracking-widest uppercase">Genetic Neural Network</p>
            </div>

            <StatsPanel 
                stats={stats} 
                generation={currentGen}
                bestDistance={bestDist}
                activeCount={activeCount}
                timeRemaining={timeLeft}
            />
            
            <LeaderStats 
                distance={bestDist}
                height={0}
                velocity={leaderVelocity}
                color={leaderColor}
            />

            <GenomePanel 
                population={populationData}
                selectedId={selectedCatId}
                history={stats}
            />
            
            <ControlBar 
                isPlaying={appState === 'RUNNING'} 
                onTogglePlay={handleTogglePlay}
                onReset={handleReset}
                speed={speed}
                onSpeedChange={setSpeed}
                onOpenSettings={() => setShowSettings(true)}
                onOpenResearch={() => setShowResearch(true)}
                onSave={handleSaveSession}
                onLoad={handleLoadSession}
                onZoom={handleZoom}
            />
        </>
      )}
    </div>
  );
};