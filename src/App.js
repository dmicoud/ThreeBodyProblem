import React, { useState, useEffect, useRef } from 'react';
import BodyForm from './BodyForm';
import Simulation from './Simulation';
import Canvas from './Canvas';

const App = () => {
  // Figure-eight stable 3-body problem initial conditions (Chenciner-Montgomery)
  // Based on the exact values from the paper with full precision
  // The paper gives: x1 = -x2 = 0.97000436 - 0.24308753i, x3 = 0
  // V = -0.93240737 - 0.86473146i (for x3), V1 = -V2 = -V/2
  
  const initialBodies = [
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
  ];
  
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
  const simulationRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Convert between logarithmic slider value and actual speed
  const speedToSlider = (speed) => Math.log10(speed);
  const sliderToSpeed = (sliderValue) => Math.pow(10, sliderValue);
  
  // Convert between logarithmic slider value and actual trail length
  const trailLengthToSlider = (length) => Math.log10(length);
  const sliderToTrailLength = (sliderValue) => Math.round(Math.pow(10, sliderValue));

  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.setBodies(bodies);
    }
  }, [bodies]);

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

  const handleRunPause = () => {
    setIsRunning(!isRunning);
    if (simulationRef.current) {
      if (!isRunning) {
        simulationRef.current.start();
      } else {
        simulationRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setResetTrigger(prev => prev + 1);
    if (simulationRef.current) {
      simulationRef.current.setInitialBodies(initialBodies);
      simulationRef.current.reset();
    }
    setBodies(JSON.parse(JSON.stringify(initialBodies)));
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
      
      // Apply configuration
      setBodies(config.bodies);
      if (typeof config.timeSpeed === 'number') setTimeSpeed(config.timeSpeed);
      if (typeof config.trailLength === 'number') setTrailLength(config.trailLength);
      if (typeof config.showVelocityVectors === 'boolean') setShowVelocityVectors(config.showVelocityVectors);
      if (typeof config.useServerComputation === 'boolean') setUseServerComputation(config.useServerComputation);
      
      // Reset simulation with new configuration
      setResetTrigger(prev => prev + 1);
      if (simulationRef.current) {
        simulationRef.current.setInitialBodies(config.bodies);
        simulationRef.current.reset();
      }
      
      // Recalculate viewport to fit new body positions
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.recalculateViewport();
        }
      }, 100); // Small delay to ensure bodies are updated
      
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
            showVelocityVectors={showVelocityVectors}
            isRunning={isRunning}
            onBodyChange={handleBodyChange}
          />
          <Simulation 
            ref={simulationRef}
            bodies={bodies}
            onBodiesUpdate={setBodies}
            isRunning={isRunning}
            timeSpeed={timeSpeed}
            useServerComputation={useServerComputation}
          />
        </div>
        
        <div className="controls">
          <BodyForm bodies={bodies} onBodyChange={handleBodyChange} />
          
          <div className="simulation-controls">
            <button onClick={handleRunPause} className="control-button">
              {isRunning ? 'Pause' : 'Run'}
            </button>
            <button onClick={handleReset} className="control-button">
              Reset
            </button>
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
                  min="-1"
                  max="1"
                  step="0.05"
                  value={speedToSlider(timeSpeed)}
                  onChange={(e) => setTimeSpeed(sliderToSpeed(parseFloat(e.target.value)))}
                  className="speed-slider"
                />
                <div className="speed-labels">
                  <span>0.1x</span>
                  <span>1x</span>
                  <span>10x</span>
                </div>
              </label>
            </div>
            
            <div className="trail-control">
              <label>
                Trail Length: {trailLength}
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={trailLengthToSlider(trailLength)}
                  onChange={(e) => setTrailLength(sliderToTrailLength(parseFloat(e.target.value)))}
                  className="trail-slider"
                />
                <div className="trail-labels">
                  <span>10</span>
                  <span>100</span>
                  <span>1000</span>
                </div>
              </label>
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