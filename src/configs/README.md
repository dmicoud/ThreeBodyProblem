# Predefined Configurations

This directory contains predefined configurations for the 3-Body Problem Simulator. Each configuration file exports a configuration object with the following structure:

## Configuration Structure

```javascript
export default {
  id: 'unique-identifier',           // Unique string identifier
  name: 'Display Name',              // Human-readable name
  description: 'Brief description',   // Description for the dropdown
  category: 'category-name',         // Category for organization
  bodies: [                          // Array of 3 body configurations
    {
      id: 1,                         // Body ID (1, 2, or 3)
      x: 0,                          // Initial x position
      y: 0,                          // Initial y position  
      vx: 0,                         // Initial x velocity
      vy: 0,                         // Initial y velocity
      mass: 1,                       // Body mass
      color: '#ff0000'               // Body color (hex)
    },
    // ... two more bodies
  ],
  settings: {                        // Optional default settings
    timeSpeed: 1.0,                  // Time speed multiplier
    trailLength: 100,                // Trail length
    showVelocityVectors: false,      // Show velocity vectors
    useServerComputation: false      // Use server-side computation
  }
};
```

## Available Categories

- **stable-orbits**: Stable periodic orbits
- **equilibrium**: Equilibrium point demonstrations
- **chaotic**: Chaotic or complex trajectories

## Current Configurations

1. **Figure Eight** (`figure-eight`)
   - Category: stable-orbits
   - Famous Chenciner-Montgomery figure-eight periodic orbit
   - Three equal masses following a figure-eight pattern

2. **Lagrange Points** (`lagrange-points`)
   - Category: equilibrium
   - Demonstrates L4 Lagrange point equilibrium
   - Two primary bodies with third body at L4 point

3. **Butterfly** (`butterfly`)
   - Category: chaotic
   - Creates beautiful butterfly-like trajectory patterns
   - Demonstrates complex three-body dynamics

## Adding New Configurations

1. Create a new `.js` file in this directory
2. Export a configuration object following the structure above
3. Add the import to `index.js`
4. Add the configuration to the `predefinedConfigs` object

## Helper Functions

The `index.js` file provides helper functions:

- `getConfigsByCategory(category)`: Get all configs in a category
- `getCategories()`: Get all available categories
- `predefinedConfigs`: Object containing all configurations