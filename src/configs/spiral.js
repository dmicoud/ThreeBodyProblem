// Spiral configuration - creates spiral and rosette patterns
// Based on quasi-periodic orbits with spiral-like trajectories

export default {
  id: 'spiral',
  name: 'Spiral Dance',
  description: 'Spiral and rosette patterns with complex trajectories',
  category: 'chaotic',
  bodies: [
    { 
      id: 1, 
      x: -0.3,
      y: 0.7,
      vx: -0.6,
      vy: -0.2,
      mass: 1.2,
      color: '#ff9800' 
    },
    { 
      id: 2, 
      x: 0.9,
      y: -0.1,
      vx: 0.1,
      vy: 0.7,
      mass: 0.8,
      color: '#673ab7' 
    },
    { 
      id: 3, 
      x: -0.6,
      y: -0.6,
      vx: 0.5,
      vy: -0.5,
      mass: 1.0,
      color: '#009688' 
    }
  ],
  settings: {
    timeSpeed: 0.5,
    trailLength: 500,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};