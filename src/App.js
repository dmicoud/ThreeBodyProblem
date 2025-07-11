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
  const [useServerComputation, setUseServerComputation] = useState(true);
  const simulationRef = useRef(null);
  
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

  return (
    <div className="app">
      <h1>3-Body Problem Simulator</h1>
      
      <div className="main-content">
        <div className="visualization">
          <Canvas 
            bodies={bodies} 
            clearTrails={resetTrigger} 
            trailLength={trailLength}
            showVelocityVectors={showVelocityVectors}
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
    </div>
  );
};

export default App;