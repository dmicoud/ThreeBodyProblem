// Infinity configuration - creates infinity symbol patterns
// Based on periodic solutions with figure-8 variations

export default {
  id: 'infinity',
  name: 'Infinity Symbol',
  description: 'Creates infinity symbol and related patterns',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: -0.8,
      y: 0.6,
      vx: 0.1,
      vy: -0.4,
      mass: 1,
      color: '#ff5722' 
    },
    { 
      id: 2, 
      x: 0.8,
      y: -0.6,
      vx: 0.1,
      vy: -0.4,
      mass: 1,
      color: '#00bcd4' 
    },
    { 
      id: 3, 
      x: 0,
      y: 0,
      vx: -0.2,
      vy: 0.8,
      mass: 1,
      color: '#8bc34a' 
    }
  ],
  settings: {
    timeSpeed: 0.8,
    trailLength: 200,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};