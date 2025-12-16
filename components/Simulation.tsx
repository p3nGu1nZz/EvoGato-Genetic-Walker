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
import { DraggablePanel } from './DraggablePanel';

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
      handleZoom,
      loadSession,
      getSimulationState
  } = useSimulation();

  // Panel Visibility State
  const [showStats, setShowStats] = useState(true);
  const [showLeader, setShowLeader] = useState(true);
  const [showGenome, setShowGenome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  // Panel Z-Index Management (Stacking Order)
  const [panelOrder, setPanelOrder] = useState<string[]>(['stats', 'leader', 'genome', 'settings', 'research']);

  const bringToFront = (id: string) => {
      setPanelOrder(prev => {
          const newOrder = prev.filter(p => p !== id);
          newOrder.push(id);
          return newOrder;
      });
  };

  const getZIndex = (id: string) => {
      return 10 + panelOrder.indexOf(id);
  };

  const handleSaveSession = () => {
      const sessionData = getSimulationState();
      const blob = new Blob([JSON.stringify(sessionData)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evogato-gen${currentGen}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleLoadSession = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.stats || data.population) {
                  loadSession(data);
                  alert(`Session loaded! Resuming from Generation ${data.stats && data.stats.length > 0 ? data.stats[data.stats.length-1].generation + 1 : 1}`);
              } else {
                  alert("Invalid session file.");
              }
          } catch(err) {
              console.error(err);
              alert("Error parsing session file.");
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
      
      {/* Evolution Overlay - High Z-Index */}
      {appState === 'TRANSITION' && (
          <div className="absolute inset-0 z-[100]">
            <TransitionScreen generation={currentGen} />
          </div>
      )}

      {appState !== 'START' && (
        <>
            <div className="absolute top-4 left-4 p-4 text-white/50 pointer-events-none z-0">
                <h1 className="text-3xl font-black italic tracking-tighter mb-1 text-white">EVO<span className="text-indigo-500">GATO</span></h1>
                <p className="text-[10px] tracking-widest uppercase">Genetic Neural Network</p>
            </div>

            {/* Draggable Panels */}
            
            <DraggablePanel 
                id="stats" 
                title="Live Stats" 
                initialX={window.innerWidth - 340} 
                initialY={20} 
                width="w-80"
                visible={showStats}
                onClose={() => setShowStats(false)}
                zIndex={getZIndex('stats')}
                onFocus={() => bringToFront('stats')}
            >
                <StatsPanel 
                    stats={stats} 
                    generation={currentGen}
                    bestDistance={bestDist}
                    activeCount={activeCount}
                    timeRemaining={timeLeft}
                />
            </DraggablePanel>

            <DraggablePanel 
                id="leader" 
                title="Telemetry" 
                initialX={20} 
                initialY={120} 
                width="w-56"
                visible={showLeader}
                onClose={() => setShowLeader(false)}
                zIndex={getZIndex('leader')}
                onFocus={() => bringToFront('leader')}
            >
                <LeaderStats 
                    distance={bestDist}
                    height={0}
                    velocity={leaderVelocity}
                    color={leaderColor}
                />
            </DraggablePanel>

            <DraggablePanel 
                id="genome" 
                title="Population Grid" 
                initialX={window.innerWidth - 300} 
                initialY={window.innerHeight - 350} 
                width="w-64"
                visible={showGenome}
                onClose={() => setShowGenome(false)}
                zIndex={getZIndex('genome')}
                onFocus={() => bringToFront('genome')}
            >
                <GenomePanel 
                    population={populationData}
                    selectedId={selectedCatId}
                    history={stats}
                />
            </DraggablePanel>
            
            <DraggablePanel 
                id="settings" 
                title="Settings" 
                initialX={window.innerWidth / 2 - 200} 
                initialY={window.innerHeight / 2 - 250} 
                width="w-96"
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                zIndex={getZIndex('settings')}
                onFocus={() => bringToFront('settings')}
            >
                <SettingsPanel config={config} onUpdate={updateConfig} />
            </DraggablePanel>

            <DraggablePanel 
                id="research" 
                title="Research" 
                initialX={window.innerWidth / 2 - 400} 
                initialY={100} 
                width="w-[800px]"
                height="h-[600px]"
                visible={showResearch}
                onClose={() => setShowResearch(false)}
                zIndex={getZIndex('research')}
                onFocus={() => bringToFront('research')}
            >
                <ResearchPanel />
            </DraggablePanel>

            <ControlBar 
                isPlaying={appState === 'RUNNING'} 
                onTogglePlay={handleTogglePlay}
                onReset={handleReset}
                speed={speed}
                onSpeedChange={setSpeed}
                onSave={handleSaveSession}
                onLoad={handleLoadSession}
                onZoom={handleZoom}
                
                showStats={showStats}
                toggleStats={() => { setShowStats(!showStats); bringToFront('stats'); }}
                showLeader={showLeader}
                toggleLeader={() => { setShowLeader(!showLeader); bringToFront('leader'); }}
                showGenome={showGenome}
                toggleGenome={() => { setShowGenome(!showGenome); bringToFront('genome'); }}
                showSettings={showSettings}
                toggleSettings={() => { setShowSettings(!showSettings); bringToFront('settings'); }}
                showResearch={showResearch}
                toggleResearch={() => { setShowResearch(!showResearch); bringToFront('research'); }}
            />
        </>
      )}
    </div>
  );
};
