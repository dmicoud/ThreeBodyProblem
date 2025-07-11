// Circular Chain configuration - three bodies in rotating triangular formation
// Based on equal mass bodies in circular orbits around their common center

export default {
  id: 'circular-chain',
  name: 'Circular Chain',
  description: 'Three equal masses in stable rotating triangle formation',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: 1.0,                // First body at radius 1
      y: 0.0,
      vx: 0.0,
      vy: 0.816,             // Circular velocity for stable triangle rotation
      mass: 1,
      color: '#ff4500' 
    },
    { 
      id: 2, 
      x: -0.5,               // Second body at 120° 
      y: 0.866,              // √3/2 for equilateral triangle
      vx: -0.707,            // Velocity components for rotation
      vy: -0.408,            // Maintaining triangular formation
      mass: 1,
      color: '#4169e1' 
    },
    { 
      id: 3, 
      x: -0.5,               // Third body at 240°
      y: -0.866,             // -√3/2 for equilateral triangle
      vx: 0.707,             // Velocity components for rotation
      vy: -0.408,            // Maintaining triangular formation
      mass: 1,
      color: '#00ff7f' 
    }
  ],
  settings: {
    timeSpeed: 0.8,          // Slower for better stability visualization
    trailLength: 200,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};