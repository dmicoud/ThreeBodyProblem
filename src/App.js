import React, { useState, useEffect, useRef } from 'react';
import BodyForm from './BodyForm';
import Simulation from './Simulation';
import Canvas from './Canvas';
import { predefinedConfigs } from './configs';

const App = () => {
  const initialBodies = predefinedConfigs['figure-eight'].bodies;
  
  const [bodies, setBodies] = useState(initialBodies);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [trailLength, setTrailLength] = useState(100);
  const [showVelocityVectors, setShowVelocityVectors] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [useServerComputation, setUseServerComputation] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configModalMode, setConfigModalMode] = useState('export'); // 'export', 'import', or 'saved'
  const [configText, setConfigText] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [hasEverRun, setHasEverRun] = useState(false);
  const [infiniteTrails, setInfiniteTrails] = useState(false);
  const [iterationCount, setIterationCount] = useState(0);
  const simulationRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Stability monitoring
  const stabilityHistoryRef = useRef([]);
  const lastStabilityCheckRef = useRef(0);
  
  // Auto-saved configurations
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  
  // Stability monitoring settings
  const [stabilitySettings, setStabilitySettings] = useState({
    enabled: true,
    energyThreshold: 0.5,      // 50% energy change (very permissive)
    velocityThreshold: 100,    // Maximum velocity (doubled)
    positionGrowthThreshold: 10, // 10x position growth (doubled)
    positionBoundThreshold: 50  // Reduced absolute position limit
  });
  
  // Collision detection permanently disabled
  
  // Dynamic slider ranges that expand when reaching boundaries
  const [speedSliderRange, setSpeedSliderRange] = useState({ min: -1, max: 1 }); // 0.1x to 10x
  const [trailSliderRange, setTrailSliderRange] = useState({ min: 1, max: 3 }); // 10 to 1000
  
  // Convert between logarithmic slider value and actual speed
  const speedToSlider = (speed) => Math.log10(speed);
  const sliderToSpeed = (sliderValue) => Math.pow(10, sliderValue);
  
  // Convert between logarithmic slider value and actual trail length
  const trailLengthToSlider = (length) => Math.log10(length);
  const sliderToTrailLength = (sliderValue) => Math.round(Math.pow(10, sliderValue));
  
  // Handle speed slider changes with dynamic range adjustment
  const handleSpeedChange = (e) => {
    const sliderValue = parseFloat(e.target.value);
    const newSpeed = sliderToSpeed(sliderValue);
    
    // Enforce upper limit of 10000
    const limitedSpeed = Math.min(newSpeed, 10000);
    setTimeSpeed(limitedSpeed);
    
    // Expand range if we're at the boundaries
    const threshold = 0.1; // 10% from boundary
    const range = speedSliderRange.max - speedSliderRange.min;
    const relativePosition = (sliderValue - speedSliderRange.min) / range;
    
    if (relativePosition <= threshold) {
      // Expand lower bound
      setSpeedSliderRange(prev => ({ ...prev, min: prev.min - 1 }));
    } else if (relativePosition >= 1 - threshold) {
      // Expand upper bound, but don't exceed log10(10000) = 4
      const maxAllowedLog = Math.log10(10000); // 4
      setSpeedSliderRange(prev => ({ 
        ...prev, 
        max: Math.min(prev.max + 1, maxAllowedLog) 
      }));
    }
  };
  
  // Handle trail length slider changes with dynamic range adjustment
  const handleTrailLengthChange = (e) => {
    const sliderValue = parseFloat(e.target.value);
    const newLength = sliderToTrailLength(sliderValue);
    setTrailLength(newLength);
    
    // Expand range if we're at the boundaries
    const threshold = 0.1; // 10% from boundary
    const range = trailSliderRange.max - trailSliderRange.min;
    const relativePosition = (sliderValue - trailSliderRange.min) / range;
    
    if (relativePosition <= threshold) {
      // Expand lower bound
      setTrailSliderRange(prev => ({ ...prev, min: prev.min - 1 }));
    } else if (relativePosition >= 1 - threshold) {
      // Expand upper bound
      setTrailSliderRange(prev => ({ ...prev, max: prev.max + 1 }));
    }
  };
  
  // Get display labels for speed slider
  const getSpeedLabels = () => {
    const minSpeed = Math.pow(10, speedSliderRange.min);
    const maxSpeed = Math.pow(10, speedSliderRange.max);
    return {
      min: minSpeed < 1 ? `${minSpeed.toFixed(2)}x` : `${minSpeed.toFixed(0)}x`,
      max: maxSpeed < 1 ? `${maxSpeed.toFixed(2)}x` : `${maxSpeed.toFixed(0)}x`
    };
  };
  
  // Get display labels for trail length slider
  const getTrailLabels = () => {
    const minLength = Math.round(Math.pow(10, trailSliderRange.min));
    const maxLength = Math.round(Math.pow(10, trailSliderRange.max));
    return {
      min: minLength >= 1000 ? `${(minLength/1000).toFixed(0)}K` : minLength.toString(),
      max: maxLength >= 1000 ? `${(maxLength/1000).toFixed(0)}K` : maxLength.toString()
    };
  };
  
  // Ensure slider ranges accommodate current values
  const ensureRangeAccommodatesValue = (value, currentRange, setRange, valueToSlider, isSpeed = false) => {
    const sliderValue = valueToSlider(value);
    const buffer = 0.5; // Add some buffer space
    
    let newRange = { ...currentRange };
    let changed = false;
    
    if (sliderValue < currentRange.min) {
      newRange.min = Math.floor(sliderValue - buffer);
      changed = true;
    }
    if (sliderValue > currentRange.max) {
      let maxValue = Math.ceil(sliderValue + buffer);
      
      // Apply speed limit if this is the speed slider
      if (isSpeed) {
        const maxAllowedLog = Math.log10(10000); // 4
        maxValue = Math.min(maxValue, maxAllowedLog);
      }
      
      newRange.max = maxValue;
      changed = true;
    }
    
    if (changed) {
      setRange(newRange);
    }
  };

  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.setBodies(bodies);
    }
  }, [bodies]);
  
  // Ensure speed slider range accommodates current time speed
  useEffect(() => {
    ensureRangeAccommodatesValue(timeSpeed, speedSliderRange, setSpeedSliderRange, speedToSlider, true);
  }, [timeSpeed]);
  
  // Ensure trail slider range accommodates current trail length
  useEffect(() => {
    ensureRangeAccommodatesValue(trailLength, trailSliderRange, setTrailSliderRange, trailLengthToSlider);
  }, [trailLength]);

  // Remove excessive logging since bodies update every frame now
  // useEffect(() => {
  //   console.log('Bodies updated:', bodies.map(b => ({ x: b.x.toFixed(1), y: b.y.toFixed(1) })));
  // }, [bodies]);

  const handleBodyChange = (id, field, value) => {
    setBodies(prevBodies => 
      prevBodies.map(body => 
        body.id === id ? { ...body, [field]: parseFloat(value) || 0 } : body
      )
    );
  };
  
  // Collision detection completely disabled
  const checkCollisions = (newBodies) => {
    return false; // Always return false - no collision detection
  };
  
  // Calculate center of mass
  const calculateCenterOfMass = (bodies) => {
    let totalMass = 0;
    let cx = 0;
    let cy = 0;
    
    bodies.forEach(body => {
      totalMass += body.mass;
      cx += body.x * body.mass;
      cy += body.y * body.mass;
    });
    
    return {
      x: cx / totalMass,
      y: cy / totalMass
    };
  };

  // Calculate system energy (kinetic + potential)
  const calculateSystemEnergy = (bodies) => {
    let kineticEnergy = 0;
    let potentialEnergy = 0;
    
    // Kinetic energy: 0.5 * m * v^2
    bodies.forEach(body => {
      kineticEnergy += 0.5 * body.mass * (body.vx * body.vx + body.vy * body.vy);
    });
    
    // Potential energy: -G * m1 * m2 / r
    const G = 1; // Same as physics engine
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[i].x - bodies[j].x;
        const dy = bodies[i].y - bodies[j].y;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > 1e-10) { // Avoid division by zero
          potentialEnergy -= G * bodies[i].mass * bodies[j].mass / r;
        }
      }
    }
    
    return kineticEnergy + potentialEnergy;
  };

  // Check system stability
  const checkSystemStability = (newBodies, iteration) => {
    if (!isRunning || !stabilitySettings.enabled || iteration - lastStabilityCheckRef.current < 50) return false; // Check every 50 iterations
    
    lastStabilityCheckRef.current = iteration;
    
    // Calculate current system metrics
    const energy = calculateSystemEnergy(newBodies);
    const centerOfMass = calculateCenterOfMass(newBodies);
    
    // Calculate maximum velocity and position
    let maxVelocity = 0;
    let maxPosition = 0;
    
    newBodies.forEach(body => {
      const velocity = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
      const position = Math.sqrt(body.x * body.x + body.y * body.y);
      maxVelocity = Math.max(maxVelocity, velocity);
      maxPosition = Math.max(maxPosition, position);
    });
    
    // Store current state
    const currentState = {
      energy,
      maxVelocity,
      maxPosition,
      centerOfMass,
      iteration
    };
    
    stabilityHistoryRef.current.push(currentState);
    
    // Keep only last 20 measurements (about 1000 iterations of history)
    if (stabilityHistoryRef.current.length > 20) {
      stabilityHistoryRef.current.shift();
    }
    
    // Need at least 10 measurements to assess stability
    if (stabilityHistoryRef.current.length < 10) return false;
    
    const history = stabilityHistoryRef.current;
    const recent = history.slice(-5); // Last 5 measurements
    const older = history.slice(-10, -5); // Previous 5 measurements
    
    // Check for dramatic energy changes (non-conservation indicates numerical instability)
    const recentAvgEnergy = recent.reduce((sum, state) => sum + state.energy, 0) / recent.length;
    const olderAvgEnergy = older.reduce((sum, state) => sum + state.energy, 0) / older.length;
    const energyChange = Math.abs(recentAvgEnergy - olderAvgEnergy) / Math.abs(olderAvgEnergy);
    
    // Check for extreme velocities (runaway scenario)
    const recentMaxVelocity = Math.max(...recent.map(state => state.maxVelocity));
    const olderMaxVelocity = Math.max(...older.map(state => state.maxVelocity));
    
    // Check for bodies flying away (unbounded growth)
    const recentMaxPosition = Math.max(...recent.map(state => state.maxPosition));
    const olderMaxPosition = Math.max(...older.map(state => state.maxPosition));
    
    // Use configurable instability thresholds
    const { energyThreshold, velocityThreshold, positionGrowthThreshold, positionBoundThreshold } = stabilitySettings;
    
    // Detect instability
    if (energyChange > energyThreshold) {
      return { type: 'energy', value: energyChange, threshold: energyThreshold };
    }
    
    if (recentMaxVelocity > velocityThreshold) {
      return { type: 'velocity', value: recentMaxVelocity, threshold: velocityThreshold };
    }
    
    if (olderMaxPosition > 0 && recentMaxPosition / olderMaxPosition > positionGrowthThreshold) {
      return { type: 'growth', value: recentMaxPosition / olderMaxPosition, threshold: positionGrowthThreshold };
    }
    
    if (recentMaxPosition > positionBoundThreshold) {
      return { type: 'bounds', value: recentMaxPosition, threshold: positionBoundThreshold };
    }
    
    return false;
  };

  // Auto-save configuration when simulation is paused
  const autoSaveConfiguration = (reason = 'manual') => {
    const timestamp = new Date().toISOString();
    const config = {
      bodies: bodies.map(body => ({
        id: body.id,
        x: parseFloat(body.x.toFixed(6)),
        y: parseFloat(body.y.toFixed(6)),
        vx: parseFloat(body.vx.toFixed(6)),
        vy: parseFloat(body.vy.toFixed(6)),
        mass: parseFloat(body.mass.toFixed(6)),
        color: body.color
      })),
      settings: {
        timeSpeed,
        trailLength,
        infiniteTrails,
        showVelocityVectors,
        useServerComputation
      },
      autoSavedAt: timestamp,
      reason: reason,
      iterations: iterationCount,
      description: `Auto-saved configuration (${reason})`
    };
    
    setSavedConfigurations(prev => {
      const newConfigs = [...prev, config];
      // Keep only the last 10 auto-saved configurations
      if (newConfigs.length > 10) {
        newConfigs.shift();
      }
      return newConfigs;
    });
    
    return config;
  };

  // Handle bodies update with collision detection and stability monitoring
  const handleBodiesUpdate = (newBodies, iteration) => {
    setBodies(newBodies);
    
    // Update iteration count if provided
    if (typeof iteration === 'number') {
      setIterationCount(iteration);
    }
    
    // Collision detection is completely disabled
    
    // Check system stability
    if (typeof iteration === 'number') {
      const instability = checkSystemStability(newBodies, iteration);
      if (instability) {
        setIsRunning(false);
        if (simulationRef.current) {
          simulationRef.current.pause();
        }
        
        // Auto-save configuration when instability occurs
        autoSaveConfiguration('instability');
        
        // Show instability notification with details
        let message = 'System instability detected!\nSimulation paused.\n\n';
        switch (instability.type) {
          case 'energy':
            message += `Energy conservation violated: ${(instability.value * 100).toFixed(1)}% change detected.\nThis suggests numerical errors are accumulating.`;
            break;
          case 'velocity':
            message += `Extreme velocity detected: ${instability.value.toFixed(1)} units.\nBodies are accelerating uncontrollably.`;
            break;
          case 'growth':
            message += `Rapid position divergence: ${instability.value.toFixed(1)}x growth rate.\nBodies are flying apart rapidly.`;
            break;
          case 'bounds':
            message += `Bodies have moved too far: ${instability.value.toFixed(1)} units from origin.\nSystem has become unbounded.`;
            break;
        }
        message += '\n\nTry adjusting initial conditions or reducing time speed.';
        
        alert(message);
      }
    }
  };

  const handleRunPause = () => {
    const newRunState = !isRunning;
    setIsRunning(newRunState);
    
    if (newRunState) {
      setHasEverRun(true);
    } else {
      // Auto-save configuration when manually pausing
      if (hasEverRun) {
        autoSaveConfiguration('manual');
      }
    }
    
    if (simulationRef.current) {
      if (newRunState) {
        simulationRef.current.start();
      } else {
        simulationRef.current.pause();
      }
    }
  };

  const handleLoadPreset = (configKey) => {
    const config = predefinedConfigs[configKey];
    if (!config) return;
    
    setIsRunning(false);
    setHasEverRun(false);
    setIterationCount(0);
    setResetTrigger(prev => prev + 1);
    
    // Reset stability monitoring
    stabilityHistoryRef.current = [];
    lastStabilityCheckRef.current = 0;
    
    const newBodies = JSON.parse(JSON.stringify(config.bodies));
    setBodies(newBodies);
    
    // Apply configuration settings if they exist
    if (config.settings) {
      if (typeof config.settings.timeSpeed === 'number') {
        setTimeSpeed(Math.min(config.settings.timeSpeed, 10000));
      }
      if (typeof config.settings.trailLength === 'number') {
        setTrailLength(config.settings.trailLength);
      }
      if (typeof config.settings.infiniteTrails === 'boolean') {
        setInfiniteTrails(config.settings.infiniteTrails);
      }
      if (typeof config.settings.showVelocityVectors === 'boolean') {
        setShowVelocityVectors(config.settings.showVelocityVectors);
      }
      if (typeof config.settings.useServerComputation === 'boolean') {
        setUseServerComputation(config.settings.useServerComputation);
      }
    }
    
    if (simulationRef.current) {
      simulationRef.current.setInitialBodies(newBodies);
      simulationRef.current.reset();
    }
    
    setShowPresetDropdown(false);
    
    // Trigger viewport recalculation on next frame after state updates
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.recalculateViewport();
        
        // Apply custom scale if specified in configuration
        if (config.settings && typeof config.settings.defaultScale === 'number') {
          canvasRef.current.setScale(config.settings.defaultScale);
        }
      }
    }, 0);
  };

  // Legacy reset function for backward compatibility
  const handleReset = () => {
    handleLoadPreset('figure-eight');
  };

  // Handle computation mode changes
  useEffect(() => {
    if (isRunning && simulationRef.current) {
      // When switching modes while running, restart the simulation with new mode
      simulationRef.current.pause();
      setTimeout(() => {
        if (simulationRef.current) {
          simulationRef.current.start();
        }
      }, 100);
    }
  }, [useServerComputation, isRunning]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPresetDropdown && !event.target.closest('.preset-dropdown-container')) {
        setShowPresetDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresetDropdown]);

  // Export current configuration
  const handleExportConfig = () => {
    const config = {
      bodies: bodies.map(body => ({
        id: body.id,
        x: parseFloat(body.x.toFixed(6)),
        y: parseFloat(body.y.toFixed(6)),
        vx: parseFloat(body.vx.toFixed(6)),
        vy: parseFloat(body.vy.toFixed(6)),
        mass: parseFloat(body.mass.toFixed(6)),
        color: body.color
      })),
      timeSpeed,
      trailLength,
      infiniteTrails,
      showVelocityVectors,
      useServerComputation,
      exportedAt: new Date().toISOString(),
      description: "3-Body Problem Configuration"
    };
    
    setConfigText(JSON.stringify(config, null, 2));
    setConfigModalMode('export');
    setShowConfigModal(true);
  };

  // Import configuration
  const handleImportConfig = () => {
    setConfigText('');
    setConfigModalMode('import');
    setShowConfigModal(true);
  };

  // View saved configurations
  const handleViewSavedConfigs = () => {
    setConfigModalMode('saved');
    setShowConfigModal(true);
  };

  // Load a saved configuration
  const handleLoadSavedConfig = (config) => {
    // Stop simulation if running
    if (isRunning) {
      setIsRunning(false);
      if (simulationRef.current) {
        simulationRef.current.pause();
      }
    }
    
    setHasEverRun(false);
    setIterationCount(0);
    
    // Reset stability monitoring
    stabilityHistoryRef.current = [];
    lastStabilityCheckRef.current = 0;
    
    // Apply configuration
    setBodies(config.bodies);
    if (config.settings) {
      if (typeof config.settings.timeSpeed === 'number') setTimeSpeed(Math.min(config.settings.timeSpeed, 10000));
      if (typeof config.settings.trailLength === 'number') setTrailLength(config.settings.trailLength);
      if (typeof config.settings.infiniteTrails === 'boolean') setInfiniteTrails(config.settings.infiniteTrails);
      if (typeof config.settings.showVelocityVectors === 'boolean') setShowVelocityVectors(config.settings.showVelocityVectors);
      if (typeof config.settings.useServerComputation === 'boolean') setUseServerComputation(config.settings.useServerComputation);
    }
    
    // Reset simulation with new configuration
    setResetTrigger(prev => prev + 1);
    if (simulationRef.current) {
      simulationRef.current.setInitialBodies(config.bodies);
      simulationRef.current.reset();
    }
    
    // Trigger viewport recalculation on next frame after state updates
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.recalculateViewport();
      }
    }, 0);
    
    setShowConfigModal(false);
  };

  // Delete a saved configuration
  const handleDeleteSavedConfig = (index) => {
    setSavedConfigurations(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all saved configurations
  const handleClearAllSavedConfigs = () => {
    if (confirm('Are you sure you want to clear all saved configurations?')) {
      setSavedConfigurations([]);
    }
  };

  // Apply imported configuration
  const handleApplyConfig = () => {
    try {
      const config = JSON.parse(configText);
      
      // Validate configuration structure
      if (!config.bodies || !Array.isArray(config.bodies) || config.bodies.length !== 3) {
        throw new Error('Configuration must contain exactly 3 bodies');
      }
      
      // Validate each body
      config.bodies.forEach((body, index) => {
        const required = ['id', 'x', 'y', 'vx', 'vy', 'mass', 'color'];
        required.forEach(field => {
          if (body[field] === undefined || body[field] === null) {
            throw new Error(`Body ${index + 1} missing required field: ${field}`);
          }
        });
        
        // Validate numeric fields
        const numeric = ['x', 'y', 'vx', 'vy', 'mass'];
        numeric.forEach(field => {
          if (typeof body[field] !== 'number' || isNaN(body[field])) {
            throw new Error(`Body ${index + 1} field ${field} must be a valid number`);
          }
        });
      });
      
      // Stop simulation if running
      if (isRunning) {
        setIsRunning(false);
        if (simulationRef.current) {
          simulationRef.current.pause();
        }
      }
      
      setHasEverRun(false);
      setIterationCount(0);
      
      // Reset stability monitoring
      stabilityHistoryRef.current = [];
      lastStabilityCheckRef.current = 0;
      
      // Apply configuration
      setBodies(config.bodies);
      if (typeof config.timeSpeed === 'number') setTimeSpeed(Math.min(config.timeSpeed, 10000));
      if (typeof config.trailLength === 'number') setTrailLength(config.trailLength);
      if (typeof config.infiniteTrails === 'boolean') setInfiniteTrails(config.infiniteTrails);
      if (typeof config.showVelocityVectors === 'boolean') setShowVelocityVectors(config.showVelocityVectors);
      if (typeof config.useServerComputation === 'boolean') setUseServerComputation(config.useServerComputation);
      
      // Reset simulation with new configuration
      setResetTrigger(prev => prev + 1);
      if (simulationRef.current) {
        simulationRef.current.setInitialBodies(config.bodies);
        simulationRef.current.reset();
      }
      
      // Trigger viewport recalculation on next frame after state updates
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.recalculateViewport();
        }
      }, 0);
      
      setShowConfigModal(false);
      setConfigText('');
      
    } catch (error) {
      alert(`Error importing configuration: ${error.message}`);
    }
  };

  // Copy configuration to clipboard
  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(configText);
      alert('Configuration copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = configText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Configuration copied to clipboard!');
    }
  };

  return (
    <div className="app">
      <h1>3-Body Problem Simulator</h1>
      
      <div className="main-content">
        <div className="visualization">
          <Canvas 
            ref={canvasRef}
            bodies={bodies} 
            clearTrails={resetTrigger} 
            trailLength={trailLength}
            infiniteTrails={infiniteTrails}
            showVelocityVectors={showVelocityVectors}
            isRunning={isRunning}
            onBodyChange={handleBodyChange}
          />
          <Simulation 
            ref={simulationRef}
            bodies={bodies}
            onBodiesUpdate={handleBodiesUpdate}
            isRunning={isRunning}
            timeSpeed={timeSpeed}
            useServerComputation={useServerComputation}
          />
        </div>
        
        <div className="controls">
          <div className="simulation-info">
            <div className="info-item">
              <strong>Iterations:</strong> {iterationCount.toLocaleString()}
            </div>
            <div className="info-item">
              <strong>Center of Mass:</strong> ({calculateCenterOfMass(bodies).x.toFixed(4)}, {calculateCenterOfMass(bodies).y.toFixed(4)})
            </div>
          </div>
          <BodyForm bodies={bodies} onBodyChange={handleBodyChange} />
          
          <div className="simulation-controls">
            <button onClick={handleRunPause} className="control-button">
              {isRunning ? 'Pause' : (hasEverRun ? 'Resume' : 'Run')}
            </button>
            
            <div className="preset-dropdown-container">
              <button 
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="control-button dropdown-button"
                disabled={isRunning}
              >
                Load Preset ▼
              </button>
              {showPresetDropdown && (
                <div className="preset-dropdown">
                  {Object.entries(predefinedConfigs).map(([key, config]) => (
                    <div
                      key={key}
                      className="preset-option"
                      onClick={() => handleLoadPreset(key)}
                    >
                      <div className="preset-name">{config.name}</div>
                      <div className="preset-description">{config.description}</div>
                      <div className="preset-category">{config.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={handleExportConfig} 
              className="control-button config-button"
              disabled={isRunning}
              title="Export current configuration"
            >
              Export Config
            </button>
            <button 
              onClick={handleImportConfig} 
              className="control-button config-button"
              disabled={isRunning}
              title="Import configuration"
            >
              Import Config
            </button>
            <button 
              onClick={handleViewSavedConfigs} 
              className="control-button saved-config-button"
              disabled={isRunning}
              title={`View saved configurations (${savedConfigurations.length})`}
            >
              Saved ({savedConfigurations.length})
            </button>
            
            <div className="velocity-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showVelocityVectors}
                  onChange={(e) => setShowVelocityVectors(e.target.checked)}
                  className="toggle-checkbox"
                />
                Show Velocity Vectors
              </label>
            </div>
            
            <div className="computation-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useServerComputation}
                  onChange={(e) => setUseServerComputation(e.target.checked)}
                  className="toggle-checkbox"
                />
                Server-side Computation
              </label>
            </div>
            
            
            <div className="stability-control">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={stabilitySettings.enabled}
                  onChange={(e) => setStabilitySettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="toggle-checkbox"
                />
                Stability Monitoring
              </label>
              
              {stabilitySettings.enabled && (
                <div className="stability-settings">
                  <div className="stability-setting">
                    <label>
                      Energy Threshold: {(stabilitySettings.energyThreshold * 100).toFixed(1)}%
                      <input
                        type="range"
                        min="0.01"
                        max="0.5"
                        step="0.01"
                        value={stabilitySettings.energyThreshold}
                        onChange={(e) => setStabilitySettings(prev => ({ ...prev, energyThreshold: parseFloat(e.target.value) }))}
                        className="stability-slider"
                      />
                    </label>
                  </div>
                  
                  <div className="stability-setting">
                    <label>
                      Max Velocity: {stabilitySettings.velocityThreshold}
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="5"
                        value={stabilitySettings.velocityThreshold}
                        onChange={(e) => setStabilitySettings(prev => ({ ...prev, velocityThreshold: parseInt(e.target.value) }))}
                        className="stability-slider"
                      />
                    </label>
                  </div>
                  
                  <div className="stability-setting">
                    <label>
                      Growth Rate: {stabilitySettings.positionGrowthThreshold}x
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="1"
                        value={stabilitySettings.positionGrowthThreshold}
                        onChange={(e) => setStabilitySettings(prev => ({ ...prev, positionGrowthThreshold: parseInt(e.target.value) }))}
                        className="stability-slider"
                      />
                    </label>
                  </div>
                  
                  <div className="stability-setting">
                    <label>
                      Max Distance: {stabilitySettings.positionBoundThreshold}
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={stabilitySettings.positionBoundThreshold}
                        onChange={(e) => setStabilitySettings(prev => ({ ...prev, positionBoundThreshold: parseInt(e.target.value) }))}
                        className="stability-slider"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div className="speed-control">
              <label>
                Time Speed: {timeSpeed < 1 ? timeSpeed.toFixed(2) : timeSpeed.toFixed(1)}x
                <input
                  type="range"
                  min={speedSliderRange.min}
                  max={speedSliderRange.max}
                  step="0.05"
                  value={speedToSlider(timeSpeed)}
                  onChange={handleSpeedChange}
                  className="speed-slider"
                />
                <div className="speed-labels">
                  <span>{getSpeedLabels().min}</span>
                  <span>1x</span>
                  <span>{getSpeedLabels().max}</span>
                </div>
              </label>
            </div>
            
            <div className="trail-control">
              <div className="trail-header">
                <label>
                  Trail Length: {infiniteTrails ? '∞' : trailLength}
                </label>
                <label className="infinite-trails-toggle">
                  <input
                    type="checkbox"
                    checked={infiniteTrails}
                    onChange={(e) => setInfiniteTrails(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  Infinite
                </label>
              </div>
              <input
                type="range"
                min={trailSliderRange.min}
                max={trailSliderRange.max}
                step="0.05"
                value={trailLengthToSlider(trailLength)}
                onChange={handleTrailLengthChange}
                className="trail-slider"
                disabled={infiniteTrails}
              />
              <div className="trail-labels">
                <span>{getTrailLabels().min}</span>
                <span>100</span>
                <span>{getTrailLabels().max}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {configModalMode === 'export' ? 'Export Configuration' : 
                 configModalMode === 'import' ? 'Import Configuration' : 
                 'Saved Configurations'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowConfigModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {configModalMode === 'export' ? (
                <>
                  <p>Copy this configuration to save your current system state:</p>
                  <textarea
                    value={configText}
                    readOnly
                    className="config-textarea"
                    rows={15}
                  />
                  <div className="modal-buttons">
                    <button onClick={handleCopyConfig} className="control-button">
                      Copy to Clipboard
                    </button>
                    <button onClick={() => setShowConfigModal(false)} className="control-button">
                      Close
                    </button>
                  </div>
                </>
              ) : configModalMode === 'import' ? (
                <>
                  <p>Paste a configuration JSON to load a saved system state:</p>
                  <textarea
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    placeholder="Paste configuration JSON here..."
                    className="config-textarea"
                    rows={15}
                  />
                  <div className="modal-buttons">
                    <button 
                      onClick={handleApplyConfig} 
                      className="control-button"
                      disabled={!configText.trim()}
                    >
                      Apply Configuration
                    </button>
                    <button onClick={() => setShowConfigModal(false)} className="control-button">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Auto-saved configurations from simulation sessions:</p>
                  {savedConfigurations.length === 0 ? (
                    <div className="no-saved-configs">
                      <p>No saved configurations yet. Configurations are automatically saved when you pause the simulation.</p>
                    </div>
                  ) : (
                    <div className="saved-configs-list">
                      {savedConfigurations.map((config, index) => (
                        <div key={index} className="saved-config-item">
                          <div className="saved-config-header">
                            <div className="saved-config-info">
                              <div className="saved-config-title">
                                {config.reason === 'manual' ? '✋ Manual Pause' : 
                                 config.reason === 'collision' ? '💥 Collision' : 
                                 config.reason === 'instability' ? '⚠️ Instability' : '📁 Saved'}
                              </div>
                              <div className="saved-config-details">
                                <span>{new Date(config.autoSavedAt).toLocaleString()}</span>
                                <span>• {config.iterations?.toLocaleString() || 0} iterations</span>
                                <span>• {config.settings?.timeSpeed || 1}x speed</span>
                              </div>
                            </div>
                            <div className="saved-config-actions">
                              <button 
                                onClick={() => handleLoadSavedConfig(config)}
                                className="control-button load-config-button"
                                title="Load this configuration"
                              >
                                Load
                              </button>
                              <button 
                                onClick={() => handleDeleteSavedConfig(index)}
                                className="control-button delete-config-button"
                                title="Delete this configuration"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="modal-buttons">
                    {savedConfigurations.length > 0 && (
                      <button 
                        onClick={handleClearAllSavedConfigs} 
                        className="control-button delete-all-button"
                      >
                        Clear All
                      </button>
                    )}
                    <button onClick={() => setShowConfigModal(false)} className="control-button">
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;