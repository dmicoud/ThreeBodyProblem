// Trefoil configuration - creates three-leaf clover patterns
// Based on periodic orbits with trefoil-like symmetry

export default {
  id: 'trefoil',
  name: 'Trefoil',
  description: 'Three-leaf clover pattern with intricate loops',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: -1.05,
      y: 0,
      vx: 0.2,
      vy: 0.6,
      mass: 1,
      color: '#ff6b35' 
    },
    { 
      id: 2, 
      x: 0.525,
      y: 0.909,
      vx: -0.5,
      vy: -0.1,
      mass: 1,
      color: '#4ecdc4' 
    },
    { 
      id: 3, 
      x: 0.525,
      y: -0.909,
      vx: 0.3,
      vy: -0.5,
      mass: 1,
      color: '#a8e6cf' 
    }
  ],
  settings: {
    timeSpeed: 0.9,
    trailLength: 400,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};