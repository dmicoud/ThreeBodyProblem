// Goerli configuration - creates flower-like patterns
// Based on periodic solutions with petal-like trajectories

export default {
  id: 'goerli',
  name: 'Goerli Flower',
  description: 'Flower-like pattern with multiple petals',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: -0.51394,
      y: 0.88984,
      vx: 0.37415,
      vy: 0.21605,
      mass: 1,
      color: '#e91e63' 
    },
    { 
      id: 2, 
      x: 1.02787,
      y: 0,
      vx: 0.37415,
      vy: 0.21605,
      mass: 1,
      color: '#9c27b0' 
    },
    { 
      id: 3, 
      x: -0.51394,
      y: -0.88984,
      vx: -0.7483,
      vy: -0.4321,
      mass: 1,
      color: '#3f51b5' 
    }
  ],
  settings: {
    timeSpeed: 0.6,
    trailLength: 350,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};