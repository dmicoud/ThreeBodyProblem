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
  const [configModalMode, setConfigModalMode] = useState('export'); // 'export' or 'import'
  const [configText, setConfigText] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [hasEverRun, setHasEverRun] = useState(false);
  const [infiniteTrails, setInfiniteTrails] = useState(false);
  const [iterationCount, setIterationCount] = useState(0);
  const simulationRef = useRef(null);
  const canvasRef = useRef(null);
  
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
  
  // Check for collisions between bodies using actual visual sizes
  const checkCollisions = (newBodies) => {
    if (!isRunning || newBodies.length < 2) return false;
    
    // Get current viewport scale from canvas
    const currentScale = canvasRef.current?.getCurrentScale() || 50;
    
    for (let i = 0; i < newBodies.length; i++) {
      for (let j = i + 1; j < newBodies.length; j++) {
        const body1 = newBodies[i];
        const body2 = newBodies[j];
        
        const dx = body1.x - body2.x;
        const dy = body1.y - body2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate visual radius exactly as in Canvas.js drawBodies function
        let baseRadius1 = Math.sqrt(body1.mass) * 6;
        let baseRadius2 = Math.sqrt(body2.mass) * 6;
        
        // Apply same scaling logic as Canvas.js
        if (currentScale > 20) {
          baseRadius1 *= 0.8;
          baseRadius2 *= 0.8;
        } else if (currentScale < 5) {
          baseRadius1 *= 1.6;
          baseRadius2 *= 1.6;
        }
        
        // Convert to world coordinates (same as visual rendering)
        const worldRadius1 = baseRadius1 / currentScale;
        const worldRadius2 = baseRadius2 / currentScale;
        const collisionDistance = worldRadius1 + worldRadius2;
        
        if (distance < collisionDistance) {
          return { body1: body1.id, body2: body2.id, distance };
        }
      }
    }
    
    return false;
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

  // Handle bodies update with collision detection
  const handleBodiesUpdate = (newBodies, iteration) => {
    setBodies(newBodies);
    
    // Update iteration count if provided
    if (typeof iteration === 'number') {
      setIterationCount(iteration);
    }
    
    // Check for collisions
    const collision = checkCollisions(newBodies);
    if (collision) {
      setIsRunning(false);
      if (simulationRef.current) {
        simulationRef.current.pause();
      }
      
      // Show collision notification
      alert(`Collision detected between Body ${collision.body1} and Body ${collision.body2}!\nSimulation paused.`);
    }
  };

  const handleRunPause = () => {
    const newRunState = !isRunning;
    setIsRunning(newRunState);
    
    if (newRunState) {
      setHasEverRun(true);
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
                {configModalMode === 'export' ? 'Export Configuration' : 'Import Configuration'}
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
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;