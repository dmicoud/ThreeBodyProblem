class PhysicsEngine {
  constructor() {
    this.G = 1; // Gravitational constant (unit value for figure-8, matches paper)
    this.baseDt = 0.001; // Much smaller time step for stability
    this.iterations = 0; // Track total iterations
  }

  calculateAccelerations(bodies) {
    const accelerations = bodies.map(() => ({ ax: 0, ay: 0 }));
    
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[j].x - bodies[i].x;
        const dy = bodies[j].y - bodies[i].y;
        const r = Math.sqrt(dx * dx + dy * dy);
        
        // Avoid division by zero - use very small threshold
        if (r < 1e-10) {
          // Reduce logging - only log if needed for debugging
          // console.log(`Warning: Bodies ${i} and ${j} extremely close, r=${r.toExponential(3)}`);
          continue;
        }
        
        const force = this.G * bodies[i].mass * bodies[j].mass / (r * r);
        const fx = force * dx / r;
        const fy = force * dy / r;
        
        // Calculate accelerations
        accelerations[i].ax += fx / bodies[i].mass;
        accelerations[i].ay += fy / bodies[i].mass;
        accelerations[j].ax -= fx / bodies[j].mass;
        accelerations[j].ay -= fy / bodies[j].mass;
      }
    }
    
    return accelerations;
  }

  calculateDerivatives(bodies) {
    const accelerations = this.calculateAccelerations(bodies);
    return bodies.map((body, index) => ({
      vx: body.vx,
      vy: body.vy,
      ax: accelerations[index].ax,
      ay: accelerations[index].ay
    }));
  }

  addK(bodies, k, dt) {
    return bodies.map((body, index) => ({
      ...body,
      x: body.x + dt * k[index].vx,
      y: body.y + dt * k[index].vy,
      vx: body.vx + dt * k[index].ax,
      vy: body.vy + dt * k[index].ay
    }));
  }

  // 4th order Runge-Kutta integration for better stability
  updateBodiesRK4(bodies, timeSpeed) {
    const dt = this.baseDt * timeSpeed;
    
    // RK4 integration
    const k1 = this.calculateDerivatives(bodies);
    const k2 = this.calculateDerivatives(this.addK(bodies, k1, dt/2));
    const k3 = this.calculateDerivatives(this.addK(bodies, k2, dt/2));
    const k4 = this.calculateDerivatives(this.addK(bodies, k3, dt));
    
    return bodies.map((body, index) => {
      const newBody = {
        ...body,
        x: body.x + (dt/6) * (k1[index].vx + 2*k2[index].vx + 2*k3[index].vx + k4[index].vx),
        y: body.y + (dt/6) * (k1[index].vy + 2*k2[index].vy + 2*k3[index].vy + k4[index].vy),
        vx: body.vx + (dt/6) * (k1[index].ax + 2*k2[index].ax + 2*k3[index].ax + k4[index].ax),
        vy: body.vy + (dt/6) * (k1[index].ay + 2*k2[index].ay + 2*k3[index].ay + k4[index].ay)
      };

      // Debug logging for extreme values - only warn for very high velocities
      if (Math.abs(newBody.vx) > 5 || Math.abs(newBody.vy) > 5) {
        // Reduce logging - only log if needed for debugging
        // console.log(`Warning: Very high velocity for body ${index}:`, {
        //   vx: newBody.vx.toFixed(3),
        //   vy: newBody.vy.toFixed(3),
        //   x: newBody.x.toFixed(3),
        //   y: newBody.y.toFixed(3)
        // });
      }

      return newBody;
    });
  }

  // Perform multiple small steps for better stability
  step(bodies, timeSpeed) {
    const steps = 5; // Multiple small steps for better stability
    let currentBodies = bodies;
    
    for (let i = 0; i < steps; i++) {
      currentBodies = this.updateBodiesRK4(currentBodies, timeSpeed);
      this.iterations++;
    }
    
    return currentBodies;
  }

  // Reset iteration counter
  resetIterations() {
    this.iterations = 0;
  }

  // Get current iteration count
  getIterations() {
    return this.iterations;
  }
}

export default PhysicsEngine; 