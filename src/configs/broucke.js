// Broucke configuration - periodic orbit with interesting geometry
// Based on Broucke's family of periodic three-body solutions

export default {
  id: 'broucke',
  name: 'Broucke Orbit',
  description: 'Periodic orbit from Broucke\'s family of solutions',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: 1.534465,           // Scaled up by 5x for better visibility at default scale
      y: 0.627535,
      vx: -3.556015,         // Velocities scaled up by 5x to maintain dynamics
      vy: 2.211755,
      mass: 1,
      color: '#ff1744' 
    },
    { 
      id: 2, 
      x: -1.534465,          // Scaled up by 5x for better visibility at default scale
      y: -0.627535,
      vx: -3.556015,         // Velocities scaled up by 5x to maintain dynamics
      vy: 2.211755,
      mass: 1,
      color: '#2979ff' 
    },
    { 
      id: 3, 
      x: 0,
      y: 0,
      vx: 7.11203,           // Velocities scaled up by 5x to maintain dynamics
      vy: -4.42351,
      mass: 1,
      color: '#00e676' 
    }
  ],
  settings: {
    timeSpeed: 0.7,
    trailLength: 250,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};