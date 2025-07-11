// Chenciner-Montgomery figure-eight stable orbit configuration
// Based on the periodic solution discovered by Chenciner and Montgomery
// Reference: "A remarkable periodic solution of the three-body problem in the case of equal masses"

export default {
  id: 'figure-eight',
  name: 'Figure Eight',
  description: 'Chenciner-Montgomery figure-eight stable orbit',
  category: 'stable-orbits',
  bodies: [
    { 
      id: 1, 
      x: -0.97000436,        // Real part of x1 from paper
      y: 0.24308753,         // Imaginary part of x1 from paper  
      vx: 0.466203685,       // -V_real/2 = 0.93240737/2 (higher precision)
      vy: 0.43236573,        // -V_imag/2 = 0.86473146/2 (higher precision)
      mass: 1,               // Unit mass from paper
      color: '#ff0000' 
    },
    { 
      id: 2, 
      x: 0.97000436,         // Real part of x2 = -x1 from paper
      y: -0.24308753,        // Imaginary part of x2 = -x1 from paper
      vx: 0.466203685,       // -V_real/2 = 0.93240737/2 (higher precision)
      vy: 0.43236573,        // -V_imag/2 = 0.86473146/2 (higher precision)
      mass: 1,               // Unit mass from paper
      color: '#00ff00' 
    },
    { 
      id: 3, 
      x: 0,                  // x3 = 0 from paper
      y: 0,                  // x3 = 0 from paper
      vx: -0.93240737,       // V_real from paper (higher precision)
      vy: -0.86473146,       // V_imag from paper (higher precision)
      mass: 1,               // Unit mass from paper
      color: '#0000ff' 
    }
  ],
  // Optional default settings for this configuration
  settings: {
    timeSpeed: 1.0,
    trailLength: 100,
    infiniteTrails: false,
    showVelocityVectors: false,
    useServerComputation: false
  }
};