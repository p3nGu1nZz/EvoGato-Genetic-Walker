export interface NeuralNetworkConfig {
  inputNodes: number;
  hiddenNodes: number;
  outputNodes: number;
}

export interface Genome {
  id: string;
  weights: number[];
  bias: number[];
  fitness: number;
  color: string;
}

export interface SimulationConfig {
  populationSize: number;
  mutationRate: number;
  mutationAmount: number;
  simulationTimeSteps: number; // Max frames per generation
  timeScale: number;
  elitsmCount: number;
}

export interface GenerationStats {
  generation: number;
  maxFitness: number;
  avgFitness: number;
  avgLoss: number; // New metric for penalties/instability
  bestDistance: number;
  bestGenomeWeights?: number[]; // For history tracking
}

export interface WeightHistoryPoint {
  generation: number;
  value: number;
}