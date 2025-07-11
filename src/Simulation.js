import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import PhysicsEngine from './PhysicsEngine';

const Simulation = forwardRef(({ bodies, onBodiesUpdate, isRunning, timeSpeed, useServerComputation }, ref) => {
  const wsRef = useRef(null);
  const bodiesRef = useRef(bodies);
  const initialBodiesRef = useRef(JSON.parse(JSON.stringify(bodies)));
  const isConnectedRef = useRef(false);
  const physicsEngineRef = useRef(new PhysicsEngine());
  const animationIdRef = useRef(null);
  const isClientRunningRef = useRef(false);
  const timeSpeedRef = useRef(timeSpeed);

  // Initialize initialBodiesRef with current bodies on mount
  useEffect(() => {
    initialBodiesRef.current = JSON.parse(JSON.stringify(bodies));
  }, []);

  // WebSocket connection function
  const connectWebSocket = useRef(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket.current = () => {
      // Only connect if server computation is enabled
      if (!useServerComputation) return;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Connect to separate WebSocket server on port 3001
      const wsUrl = `${protocol}//localhost:3001`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        isConnectedRef.current = true;
        // Send initial bodies when connected
        if (bodiesRef.current.length > 0) {
          const message = {
            type: 'set_bodies',
            bodies: bodiesRef.current
          };
          wsRef.current.send(JSON.stringify(message));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'bodies_update') {
            onBodiesUpdate(data.bodies, data.iterations);
          }
        } catch (error) {
          // Reduce logging - only log critical parsing errors
          // console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        isConnectedRef.current = false;
        // Only attempt to reconnect if server computation is still enabled
        if (useServerComputation) {
          setTimeout(connectWebSocket.current, 3000);
        }
      };
      
      wsRef.current.onerror = (error) => {
        // Reduce logging - only log if needed for debugging
        // console.error('🚨 WebSocket connection error');
        isConnectedRef.current = false;
      };
    };
    
    // Only connect if server computation is enabled
    if (useServerComputation) {
      connectWebSocket.current();
    }
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onBodiesUpdate, useServerComputation]);

  // Send message to server
  const sendMessage = (message) => {
    // Check if WebSocket is properly connected (readyState 1 = OPEN)
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Try to reconnect if connection is closed
      if (wsRef.current && wsRef.current.readyState === 3) {
        setTimeout(() => {
          connectWebSocket.current();
        }, 1000);
      }
      
      // If still connecting, retry after a short delay
      if (wsRef.current && wsRef.current.readyState === 0) {
        setTimeout(() => {
          sendMessage(message);
        }, 1000);
      }
    }
  };

  // Client-side animation loop
  const clientAnimate = () => {
    if (!isClientRunningRef.current) return;
    
    // Update physics using current time speed
    bodiesRef.current = physicsEngineRef.current.step(bodiesRef.current, timeSpeedRef.current);
    
    // Update bodies in parent component with iteration count
    onBodiesUpdate(bodiesRef.current, physicsEngineRef.current.getIterations());
    
    // Continue animation
    animationIdRef.current = requestAnimationFrame(clientAnimate);
  };

  // Start client-side animation
  const startClientAnimation = () => {
    if (!isClientRunningRef.current) {
      isClientRunningRef.current = true;
      clientAnimate();
    }
  };

  // Stop client-side animation
  const stopClientAnimation = () => {
    isClientRunningRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    start: () => {
      if (useServerComputation) {
        sendMessage({ type: 'start' });
      } else {
        startClientAnimation();
      }
    },
    pause: () => {
      if (useServerComputation) {
        sendMessage({ type: 'pause' });
      } else {
        stopClientAnimation();
      }
    },
    reset: () => {
      if (useServerComputation) {
        sendMessage({ type: 'reset' });
      } else {
        stopClientAnimation();
        physicsEngineRef.current.resetIterations();
        bodiesRef.current = JSON.parse(JSON.stringify(initialBodiesRef.current));
        onBodiesUpdate(bodiesRef.current, 0);
      }
    },
    setBodies: (newBodies) => {
      bodiesRef.current = newBodies;
      if (useServerComputation) {
        sendMessage({ type: 'set_bodies', bodies: newBodies });
      }
    },
    setInitialBodies: (newBodies) => {
      initialBodiesRef.current = JSON.parse(JSON.stringify(newBodies));
    },
    setTimeSpeed: (newTimeSpeed) => {
      if (useServerComputation) {
        sendMessage({ type: 'set_time_speed', timeSpeed: newTimeSpeed });
      }
      // For client-side, timeSpeed is used directly in the animation loop
    }
  }));

  // Update bodies reference when props change
  useEffect(() => {
    bodiesRef.current = bodies;
    // Update initial bodies when not running (user is manually setting bodies)
    if (!isRunning) {
      initialBodiesRef.current = JSON.parse(JSON.stringify(bodies));
    }
  }, [bodies, isRunning]);

  // Update time speed ref and send to server
  useEffect(() => {
    timeSpeedRef.current = timeSpeed;
    if (isConnectedRef.current && useServerComputation) {
      sendMessage({ type: 'set_time_speed', timeSpeed });
    }
  }, [timeSpeed, useServerComputation]);

  // Handle switching between computation modes
  useEffect(() => {
    if (isRunning) {
      // Stop current mode and start new mode
      if (useServerComputation) {
        stopClientAnimation();
        // Connect to WebSocket if not already connected
        if (!isConnectedRef.current) {
          connectWebSocket.current();
        }
        sendMessage({ type: 'start' });
      } else {
        sendMessage({ type: 'pause' });
        // Close WebSocket when switching to client-side
        if (wsRef.current) {
          wsRef.current.close();
        }
        startClientAnimation();
      }
    } else {
      // Make sure both modes are stopped
      stopClientAnimation();
      sendMessage({ type: 'pause' });
      // Close WebSocket when not running and not using server computation
      if (!useServerComputation && wsRef.current) {
        wsRef.current.close();
      }
    }
  }, [useServerComputation, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopClientAnimation();
    };
  }, []);

  return null;
});

export default Simulation;