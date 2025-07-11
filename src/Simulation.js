import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const Simulation = forwardRef(({ bodies, onBodiesUpdate, isRunning, timeSpeed }, ref) => {
  const wsRef = useRef(null);
  const bodiesRef = useRef(bodies);
  const initialBodiesRef = useRef(JSON.parse(JSON.stringify(bodies)));
  const isConnectedRef = useRef(false);

  // WebSocket connection function
  const connectWebSocket = useRef(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket.current = () => {
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
            onBodiesUpdate(data.bodies);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        isConnectedRef.current = false;
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket.current, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('🚨 WebSocket connection error');
        isConnectedRef.current = false;
      };
    };
    
    connectWebSocket.current();
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onBodiesUpdate]);

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

  useImperativeHandle(ref, () => ({
    start: () => {
      sendMessage({ type: 'start' });
    },
    pause: () => {
      sendMessage({ type: 'pause' });
    },
    reset: () => {
      sendMessage({ type: 'reset' });
    },
    setBodies: (newBodies) => {
      bodiesRef.current = newBodies;
      // Only update initial bodies if we're not in a simulation run
      if (!isRunning) {
        initialBodiesRef.current = JSON.parse(JSON.stringify(newBodies));
      }
      sendMessage({ type: 'set_bodies', bodies: newBodies });
    },
    setTimeSpeed: (newTimeSpeed) => {
      sendMessage({ type: 'set_time_speed', timeSpeed: newTimeSpeed });
    }
  }));

  // Update bodies reference when props change
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // Send time speed updates to server
  useEffect(() => {
    if (isConnectedRef.current) {
      sendMessage({ type: 'set_time_speed', timeSpeed });
    }
  }, [timeSpeed]);

  return null;
});

export default Simulation;