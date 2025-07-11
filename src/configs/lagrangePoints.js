// Lagrange Points configuration - L4 equilibrium configuration
// Two equal mass bodies orbiting their common center of mass
// With a test particle at the L4 Lagrange point

export default {
  id: 'lagrange-points',
  name: 'Lagrange Points',
  description: 'L4 Lagrange point configuration with stable triangular equilibrium',
  category: 'equilibrium',
  bodies: [
    { 
      id: 1, 
      x: -1.0,               // Primary body at (-1, 0)
      y: 0,
      vx: 0,
      vy: -0.5,              // Circular orbital velocity
      mass: 1,               // Equal mass system
      color: '#ff6600' 
    },
    { 
      id: 2, 
      x: 1.0,                // Secondary body at (1, 0)
      y: 0,
      vx: 0,
      vy: 0.5,               // Circular orbital velocity (opposite)
      mass: 1,               // Equal mass system
      color: '#6600ff' 
    },
    { 
      id: 3, 
      x: 0.0,                // Test particle at L4 point
      y: 1.732,              // √3 for equilateral triangle
      vx: -0.866,            // Velocity for co-rotation: √3/2 * orbital velocity
      vy: 0.0,               // No y-component at L4
      mass: 0.001,           // Very light test particle
      color: '#00ff66' 
    }
  ],
  settings: {
    timeSpeed: 0.8,
    trailLength: 200,
    infiniteTrails: false,
    showVelocityVectors: true,
    useServerComputation: false
  }
};