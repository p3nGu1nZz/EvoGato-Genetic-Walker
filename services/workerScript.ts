export const WORKER_SCRIPT = `
class SimpleNeuralNetwork {
  constructor(config, weights, biases) {
    this.config = config;
    
    // Calculate total weights and biases needed for Deep Network
    let weightsCount = 0;
    let biasesCount = 0;
    const layers = [config.inputNodes, ...config.hiddenLayers, config.outputNodes];

    for (let i = 0; i < layers.length - 1; i++) {
        weightsCount += layers[i] * layers[i+1];
        biasesCount += layers[i+1];
    }

    if (weights) {
      this.weights = weights;
    } else {
      this.weights = new Float32Array(weightsCount);
      for (let i = 0; i < weightsCount; i++) {
        this.weights[i] = Math.random() * 2 - 1;
      }
    }

    if (biases) {
      this.biases = biases;
    } else {
      this.biases = new Float32Array(biasesCount);
      for (let i = 0; i < biasesCount; i++) {
        this.biases[i] = Math.random() * 2 - 1;
      }
    }
  }

  static mutate(network, rate, amount) {
    const newWeights = new Float32Array(network.weights.length);
    const newBiases = new Float32Array(network.biases.length);

    for (let i = 0; i < network.weights.length; i++) {
      if (Math.random() < rate) {
        newWeights[i] = network.weights[i] + (Math.random() * 2 - 1) * amount;
      } else {
        newWeights[i] = network.weights[i];
      }
    }

    for (let i = 0; i < network.biases.length; i++) {
      if (Math.random() < rate) {
        newBiases[i] = network.biases[i] + (Math.random() * 2 - 1) * amount;
      } else {
        newBiases[i] = network.biases[i];
      }
    }

    return new SimpleNeuralNetwork(network.config, newWeights, newBiases);
  }
  
  static crossover(parentA, parentB) {
      const lenW = parentA.weights.length;
      const newWeights = new Float32Array(lenW);
      for(let i=0; i<lenW; i++) {
        newWeights[i] = Math.random() < 0.5 ? parentA.weights[i] : parentB.weights[i];
      }

      const lenB = parentA.biases.length;
      const newBiases = new Float32Array(lenB);
      for(let i=0; i<lenB; i++) {
        newBiases[i] = Math.random() < 0.5 ? parentA.biases[i] : parentB.biases[i];
      }
      
      return new SimpleNeuralNetwork(parentA.config, newWeights, newBiases);
  }
}

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type === 'EVOLVE') {
    const { oldPopulation, config, nnConfig } = payload;
    const newPopulationData = evolvePopulation(oldPopulation, config, nnConfig);
    self.postMessage({ type: 'EVOLVE_COMPLETE', payload: newPopulationData });
  }
};

function evolvePopulation(oldPopulation, config, nnConfig) {
    const sortedPop = oldPopulation.sort((a, b) => b.fitness - a.fitness);
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

function tournamentSelect(pop) {
    const k = 3;
    let best = pop[Math.floor(Math.random() * pop.length)];
    for(let i=0; i<k; i++) {
        const candidate = pop[Math.floor(Math.random() * pop.length)];
        if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
}
`;