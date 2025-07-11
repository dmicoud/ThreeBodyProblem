// Circular Chain configuration - three bodies orbiting in a chain pattern
// Based on periodic solutions with circular-like trajectories

export default {
  id: 'circular-chain',
  name: 'Circular Chain',
  description: 'Three bodies following circular chain-like orbits',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: -0.9700436,
      y: -0.24308753,
      vx: 0.466203685,
      vy: 0.43236573,
      mass: 1,
      color: '#ff4500' 
    },
    { 
      id: 2, 
      x: 0.9700436,
      y: 0.24308753,
      vx: 0.466203685,
      vy: 0.43236573,
      mass: 1,
      color: '#4169e1' 
    },
    { 
      id: 3, 
      x: 0,
      y: 0,
      vx: -0.93240737,
      vy: -0.86473146,
      mass: 1,
      color: '#00ff7f' 
    }
  ],
  settings: {
    timeSpeed: 1.0,
    trailLength: 300,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};