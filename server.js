const fastify = require('fastify')({ logger: true });
const path = require('path');
const WebSocket = require('ws');

// We'll create a separate WebSocket server instead of using the Fastify plugin

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'dist'),
  prefix: '/'
});

// Physics simulation class
class PhysicsSimulation {
  constructor() {
    this.bodies = [];
    this.initialBodies = [];
    this.isRunning = false;
    this.timeSpeed = 1;
    this.animationId = null;
    this.G = 1; // Gravitational constant (unit value for figure-8, matches paper)
    this.baseDt = 0.001; // Much smaller time step for stability
    this.connections = new Set(); // Track WebSocket connections
    this.iterations = 0; // Track total iterations
  }

  setBodies(bodies) {
    this.bodies = JSON.parse(JSON.stringify(bodies));
    this.initialBodies = JSON.parse(JSON.stringify(bodies));
    this.iterations = 0; // Reset iteration count when setting new bodies
    this.broadcast({ type: 'bodies_update', bodies: this.bodies, iterations: this.iterations });
    // No logging for routine body updates during simulation
  }

  setTimeSpeed(timeSpeed) {
    this.timeSpeed = timeSpeed;
    // No logging for time speed changes
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
    // No logging for start
  }

  pause() {
    this.isRunning = false;
    if (this.animationId) {
      clearTimeout(this.animationId);
      this.animationId = null;
    }
    // No logging for pause
  }

  reset() {
    this.pause();
    this.bodies = JSON.parse(JSON.stringify(this.initialBodies));
    this.iterations = 0; // Reset iteration count
    this.broadcast({ type: 'bodies_update', bodies: this.bodies, iterations: this.iterations });
    // No logging for reset
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

  // 4th order Runge-Kutta integration for better stability
  updateBodiesRK4(bodies) {
    const dt = this.baseDt * this.timeSpeed;
    
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
        console.log(`Warning: Very high velocity for body ${index}:`, {
          vx: newBody.vx.toFixed(3),
          vy: newBody.vy.toFixed(3),
          x: newBody.x.toFixed(3),
          y: newBody.y.toFixed(3)
        });
      }

      return newBody;
    });
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

  animate() {
    if (!this.isRunning) return;
    
    // Multiple small steps for better stability
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      this.bodies = this.updateBodiesRK4(this.bodies);
      this.iterations++;
    }
    
    this.broadcast({ type: 'bodies_update', bodies: this.bodies, iterations: this.iterations });
    
    // Use setTimeout instead of requestAnimationFrame for server-side control
    this.animationId = setTimeout(() => this.animate(), 16); // ~60 FPS
  }

  addConnection(ws) {
    this.connections.add(ws);
    // Reduce logging - only log significant changes
    if (this.connections.size === 1) {
      console.log('🔵 WebSocket client connected');
    }
  }

  removeConnection(ws) {
    this.connections.delete(ws);
    // Reduce logging - only log when all clients disconnect
    if (this.connections.size === 0) {
      console.log('🔴 All WebSocket clients disconnected');
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    for (const ws of this.connections) {
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error('Error sending message to WebSocket:', error);
        this.connections.delete(ws);
      }
    }
  }
}

const simulation = new PhysicsSimulation();

// Create separate WebSocket server
const wss = new WebSocket.Server({ port: 3001 });

console.log('WebSocket server running on ws://localhost:3001');

wss.on('connection', function connection(ws) {
  // Reduce logging - only log through simulation.addConnection
  simulation.addConnection(ws);
  
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'set_bodies':
          // No logging for routine body updates
          simulation.setBodies(data.bodies);
          break;
        case 'start':
          console.log('▶️  Started');
          simulation.start();
          break;
        case 'pause':
          console.log('⏸️  Paused');
          simulation.pause();
          break;
        case 'reset':
          console.log('🔄 Reset');
          simulation.reset();
          break;
        case 'set_time_speed':
          // No logging for time speed changes
          simulation.setTimeSpeed(data.timeSpeed);
          break;
        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', function close() {
    // Reduce logging - only log through simulation.removeConnection
    simulation.removeConnection(ws);
  });
  
  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
    simulation.removeConnection(ws);
  });
});

fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();