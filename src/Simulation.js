import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const Simulation = forwardRef(({ bodies, onBodiesUpdate, isRunning, timeSpeed }, ref) => {
  const animationRef = useRef(null);
  const bodiesRef = useRef(bodies);
  const initialBodiesRef = useRef(JSON.parse(JSON.stringify(bodies)));
  const timeSpeedRef = useRef(timeSpeed);

  const G = 1; // Gravitational constant (unit value for figure-8)
  const baseDt = 0.008; // Smaller time step for stability

  useImperativeHandle(ref, () => ({
    start: () => {
      if (!animationRef.current) {
        animate();
      }
    },
    pause: () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    },
    reset: () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      const resetBodies = JSON.parse(JSON.stringify(initialBodiesRef.current));
      bodiesRef.current = resetBodies;
      onBodiesUpdate(resetBodies);
    },
    setBodies: (newBodies) => {
      bodiesRef.current = newBodies;
      // Only update initial bodies if we're not in a simulation run
      if (!animationRef.current) {
        initialBodiesRef.current = JSON.parse(JSON.stringify(newBodies));
      }
    },
    setTimeSpeed: (newTimeSpeed) => {
      timeSpeedRef.current = newTimeSpeed;
    }
  }));

  useEffect(() => {
    timeSpeedRef.current = timeSpeed;
  }, [timeSpeed]);

  const calculateForces = (bodies) => {
    const forces = bodies.map(() => ({ fx: 0, fy: 0 }));
    
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[j].x - bodies[i].x;
        const dy = bodies[j].y - bodies[i].y;
        const r = Math.sqrt(dx * dx + dy * dy);
        
        // Avoid division by zero and extreme forces
        if (r < 1) continue;
        
        const force = G * bodies[i].mass * bodies[j].mass / (r * r);
        const fx = force * dx / r;
        const fy = force * dy / r;
        
        forces[i].fx += fx;
        forces[i].fy += fy;
        forces[j].fx -= fx;
        forces[j].fy -= fy;
      }
    }
    
    return forces;
  };

  const updateBodies = (bodies) => {
    const forces = calculateForces(bodies);
    const dt = baseDt * timeSpeedRef.current;
    
    return bodies.map((body, index) => {
      const ax = forces[index].fx / body.mass;
      const ay = forces[index].fy / body.mass;
      
      return {
        ...body,
        vx: body.vx + ax * dt,
        vy: body.vy + ay * dt,
        x: body.x + body.vx * dt,
        y: body.y + body.vy * dt
      };
    });
  };

  const animate = () => {
    bodiesRef.current = updateBodies(bodiesRef.current);
    onBodiesUpdate([...bodiesRef.current]);
    animationRef.current = requestAnimationFrame(animate);
  };

  return null;
});

export default Simulation;