// Butterfly configuration - creates a butterfly-like trajectory pattern
// Three bodies with carefully chosen initial conditions

export default {
  id: 'butterfly',
  name: 'Butterfly',
  description: 'Creates beautiful butterfly-like trajectory patterns',
  category: 'chaotic',
  bodies: [
    { 
      id: 1, 
      x: -1.0,
      y: 0,
      vx: 0.347111,
      vy: 0.532728,
      mass: 1,
      color: '#ff0080' 
    },
    { 
      id: 2, 
      x: 1.0,
      y: 0,
      vx: 0.347111,
      vy: 0.532728,
      mass: 1,
      color: '#8000ff' 
    },
    { 
      id: 3, 
      x: 0,
      y: 0,
      vx: -0.694222,
      vy: -1.065456,
      mass: 1,
      color: '#00ff80' 
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