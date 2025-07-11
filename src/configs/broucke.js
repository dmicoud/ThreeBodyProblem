// Broucke configuration - periodic orbit with interesting geometry
// Based on Broucke's family of periodic three-body solutions
// Using original unscaled parameters for stability

export default {
  id: 'broucke',
  name: 'Broucke Orbit',
  description: 'Periodic orbit from Broucke\'s family of solutions',
  category: 'periodic',
  bodies: [
    { 
      id: 1, 
      x: 0.306893,           // Original unscaled coordinates
      y: 0.125507,
      vx: -0.711203,         // Original unscaled velocities
      vy: 0.442351,
      mass: 1,
      color: '#ff1744' 
    },
    { 
      id: 2, 
      x: -0.306893,          // Original unscaled coordinates
      y: -0.125507,
      vx: -0.711203,         // Original unscaled velocities
      vy: 0.442351,
      mass: 1,
      color: '#2979ff' 
    },
    { 
      id: 3, 
      x: 0,
      y: 0,
      vx: 1.42241,           // Original unscaled velocities
      vy: -0.88470,
      mass: 1,
      color: '#00e676' 
    }
  ],
  settings: {
    timeSpeed: 0.5,          // Slower time speed for better stability during close approaches
    trailLength: 250,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false,
    defaultScale: 150,       // Higher scale for better visibility of smaller orbit
    disableStabilityMonitoring: true  // Disable stability monitoring for this orbit
  }
};