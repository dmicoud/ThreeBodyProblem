// Lagrange Points configuration - Stable restricted 3-body system
// Massive central body with two smaller bodies in stable orbits
// Based on Jupiter-Trojan asteroid configuration

export default {
  id: 'lagrange-points',
  name: 'Lagrange Points',
  description: 'Stable L4 Trojan configuration with massive central body',
  category: 'equilibrium',
  bodies: [
    { 
      id: 1, 
      x: 0.0,                // Central massive body at origin
      y: 0.0,
      vx: 0,
      vy: 0,                 // Stationary central body
      mass: 10,              // Much more massive central body
      color: '#ff6600' 
    },
    { 
      id: 2, 
      x: 2.0,                // Orbiting body at distance 2
      y: 0.0,
      vx: 0,
      vy: 2.236,             // Correct circular velocity: √(GM/r) = √(10/2) = 2.236
      mass: 0.1,             // Small mass
      color: '#6600ff' 
    },
    { 
      id: 3, 
      x: 1.0,                // Trojan at L4 point (60° ahead in orbit)
      y: 1.732,              // √3 for equilateral triangle
      vx: -1.936,            // Correct L4 velocity: ω*r*sin(60°) = 1.118*√3
      vy: 1.118,             // Correct L4 velocity: ω*r*cos(60°) = 1.118*1
      mass: 0.01,            // Very small Trojan mass
      color: '#00ff66' 
    }
  ],
  settings: {
    timeSpeed: 0.3,          // Slower for better stability
    trailLength: 300,
    infiniteTrails: false,
    showVelocityVectors: true,
    useServerComputation: false,
    defaultScale: 25         // Custom scale for optimal viewing of orbital system
  }
};