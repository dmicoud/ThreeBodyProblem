// Central index file for all predefined configurations
// Import all configuration files and export them as a single object

import figureEight from './figureEight.js';
import lagrangePoints from './lagrangePoints.js';
import butterfly from './butterfly.js';
import circularChain from './circularChain.js';
import trefoil from './trefoil.js';
import broucke from './broucke.js';
import goerli from './goerli.js';
import infinity from './infinity.js';
import spiral from './spiral.js';

// Export all configurations as a single object
export const predefinedConfigs = {
  [figureEight.id]: figureEight,
  [lagrangePoints.id]: lagrangePoints,
  [butterfly.id]: butterfly,
  [circularChain.id]: circularChain,
  [trefoil.id]: trefoil,
  [broucke.id]: broucke,
  [goerli.id]: goerli,
  [infinity.id]: infinity,
  [spiral.id]: spiral
};

// Export individual configurations for direct import if needed
export { figureEight, lagrangePoints, butterfly, circularChain, trefoil, broucke, goerli, infinity, spiral };

// Helper function to get configurations by category
export const getConfigsByCategory = (category) => {
  return Object.values(predefinedConfigs).filter(config => config.category === category);
};

// Helper function to get all available categories
export const getCategories = () => {
  const categories = Object.values(predefinedConfigs).map(config => config.category);
  return [...new Set(categories)].sort();
};

export default predefinedConfigs;