import React, { useState, useEffect, useRef } from 'react';
import BodyForm from './BodyForm';
import Simulation from './Simulation';
import Canvas from './Canvas';

const App = () => {
  // Figure-eight stable 3-body problem initial conditions (Chenciner-Montgomery)
  // Properly scaled to maintain the mathematical relationship
  const scale = 150; // Position scale factor for visualization
  const centerX = 300; // Canvas center X
  const centerY = 200; // Canvas center Y
  
  // The original solution velocities (from the mathematical paper)
  const vx_base = 0.466203685;
  const vy_base = 0.43236573;
  
  // Velocity scaling to match our G=0.1 and time step
  const velocityScale = 1.5;
  
  const initialBodies = [
    { 
      id: 1, 
      x: centerX + 0.97000436 * scale, 
      y: centerY - 0.24308753 * scale, 
      vx: vx_base * velocityScale, 
      vy: vy_base * velocityScale, 
      mass: 1, // Unit mass as in original solution
      color: '#ff0000' 
    },
    { 
      id: 2, 
      x: centerX - 0.97000436 * scale, 
      y: centerY + 0.24308753 * scale, 
      vx: vx_base * velocityScale, 
      vy: vy_base * velocityScale, 
      mass: 1, // Unit mass as in original solution
      color: '#00ff00' 
    },
    { 
      id: 3, 
      x: centerX, 
      y: centerY, 
      vx: -0.93240737 * velocityScale, 
      vy: -0.86473146 * velocityScale, 
      mass: 1, // Unit mass as in original solution
      color: '#0000ff' 
    }
  ];
  
  const [bodies, setBodies] = useState(initialBodies);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [trailLength, setTrailLength] = useState(100);
  const [showVelocityVectors, setShowVelocityVectors] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);
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

  useEffect(() => {
    console.log('Bodies updated:', bodies.map(b => ({ x: b.x.toFixed(1), y: b.y.toFixed(1) })));
  }, [bodies]);

  const handleBodyChange = (id, field, value) => {
    setBodies(prevBodies => 
      prevBodies.map(body => 
        body.id === id ? { ...body, [field]: parseFloat(value) || 0 } : body
      )
    );
  };

  const handleRunPause = () => {
    console.log('Run/Pause clicked, current state:', isRunning);
    setIsRunning(!isRunning);
    if (simulationRef.current) {
      if (!isRunning) {
        console.log('Starting simulation...');
        simulationRef.current.start();
      } else {
        console.log('Pausing simulation...');
        simulationRef.current.pause();
      }
    }
  };

  const handleReset = () => {
    console.log('Reset button clicked');
    setIsRunning(false);
    setBodies(JSON.parse(JSON.stringify(initialBodies)));
    setResetTrigger(prev => prev + 1);
    if (simulationRef.current) {
      simulationRef.current.reset();
    }
  };

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