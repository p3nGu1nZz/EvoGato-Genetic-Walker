import { SimpleNeuralNetwork } from "./neuralNet";

// Define message types
type WorkerMessage = 
  | { type: 'EVOLVE', payload: { oldPopulation: any[], config: any, nnConfig: any } };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  if (type === 'EVOLVE') {
    const { oldPopulation, config, nnConfig } = payload;
    const newPopulationData = evolvePopulation(oldPopulation, config, nnConfig);
    self.postMessage({ type: 'EVOLVE_COMPLETE', payload: newPopulationData });
  }
};

function evolvePopulation(oldPopulation: any[], config: any, nnConfig: any) {
    const sortedPop = [...oldPopulation].sort((a, b) => b.fitness - a.fitness);
    const newPopData = [];

    // Elitism
    for(let i=0; i<config.elitsmCount; i++) {
        if (i < sortedPop.length) {
            newPopData.push({
                weights: sortedPop[i].brain.weights,
                biases: sortedPop[i].brain.biases,
                isElite: true
            });
        }
    }

    // Reproduction
    while(newPopData.length < config.populationSize) {
        const p1 = tournamentSelect(sortedPop);
        const p2 = tournamentSelect(sortedPop);
        
        // Reconstruct brains for crossover (Worker needs to reinstantiate class logic or just do array math)
        // Since SimpleNeuralNetwork methods are static, we can try to use them if imported, 
        // but often simpler to just replicate simple math here to avoid complex imports in some bundlers.
        // We will stick to the imported class method for cleaner code, assuming bundler handles it.
        
        const brain1 = new SimpleNeuralNetwork(nnConfig, p1.brain.weights, p1.brain.biases);
        const brain2 = new SimpleNeuralNetwork(nnConfig, p2.brain.weights, p2.brain.biases);
        
        let childBrain = SimpleNeuralNetwork.crossover(brain1, brain2);
        childBrain = SimpleNeuralNetwork.mutate(childBrain, config.mutationRate, config.mutationAmount);

        newPopData.push({
            weights: childBrain.weights,
            biases: childBrain.biases,
            isElite: false
        });
    }

    return newPopData;
}

function tournamentSelect(pop: any[]) {
    const k = 3;
    let best = pop[Math.floor(Math.random() * pop.length)];
    for(let i=0; i<k; i++) {
        const candidate = pop[Math.floor(Math.random() * pop.length)];
        if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
}
