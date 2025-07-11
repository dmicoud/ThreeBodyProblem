import React, { useRef, useEffect } from 'react';

const Canvas = ({ bodies, clearTrails, trailLength = 100, showVelocityVectors = true }) => {
  const canvasRef = useRef(null);
  const trailsRef = useRef([]);
  const maxTrailLength = trailLength;
  const viewportRef = useRef({ minX: 0, maxX: 600, minY: 0, maxY: 400, scale: 1, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Calculate and update viewport
    updateViewport(bodies, canvas.width, canvas.height);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context and apply viewport transformation
    ctx.save();
    ctx.scale(viewportRef.current.scale, viewportRef.current.scale);
    ctx.translate(viewportRef.current.offsetX, viewportRef.current.offsetY);
    
    // Draw grid
    drawGrid(ctx, canvas.width / viewportRef.current.scale, canvas.height / viewportRef.current.scale);
    
    // Update trails
    updateTrails(bodies);
    
    // Draw trails
    drawTrails(ctx);
    
    // Draw bodies
    drawBodies(ctx, bodies);
    
    // Restore context
    ctx.restore();
    
  }, [bodies]);

  const updateViewport = (bodies, canvasWidth, canvasHeight) => {
    if (bodies.length === 0) return;
    
    // Get all positions including trails for bounding box
    let allPoints = [...bodies.map(b => ({ x: b.x, y: b.y }))];
    
    // Add trail points
    trailsRef.current.forEach(trail => {
      if (trail) {
        allPoints = allPoints.concat(trail);
      }
    });
    
    if (allPoints.length === 0) return;
    
    // Calculate bounding box
    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));
    
    // Ensure minimum range to prevent division by zero or extreme zoom
    let rangeX = Math.max(maxX - minX, 50); // Minimum 50 units
    let rangeY = Math.max(maxY - minY, 50); // Minimum 50 units
    
    const padding = 0.2;
    const paddedRangeX = rangeX * (1 + 2 * padding);
    const paddedRangeY = rangeY * (1 + 2 * padding);
    
    // Calculate scale to fit in canvas with more reasonable limits
    const scaleX = canvasWidth / paddedRangeX;
    const scaleY = canvasHeight / paddedRangeY;
    const scale = Math.max(0.01, Math.min(scaleX, scaleY, 5)); // Min 0.01x, Max 5x
    
    // Calculate center of content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Calculate offset to center the content in the canvas
    const offsetX = (canvasWidth / scale) / 2 - centerX;
    const offsetY = (canvasHeight / scale) / 2 - centerY;
    
    // Smooth the viewport changes with faster response
    const smoothFactor = 0.2;
    const viewport = viewportRef.current;
    
    viewport.scale = viewport.scale + (scale - viewport.scale) * smoothFactor;
    viewport.offsetX = viewport.offsetX + (offsetX - viewport.offsetX) * smoothFactor;
    viewport.offsetY = viewport.offsetY + (offsetY - viewport.offsetY) * smoothFactor;
  };

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1 / viewportRef.current.scale; // Adjust line width for scale
    
    const viewport = viewportRef.current;
    const startX = Math.floor((-viewport.offsetX) / 50) * 50;
    const endX = Math.ceil((width / viewport.scale - viewport.offsetX) / 50) * 50;
    const startY = Math.floor((-viewport.offsetY) / 50) * 50;
    const endY = Math.ceil((height / viewport.scale - viewport.offsetY) / 50) * 50;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += 50) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  };

  const updateTrails = (bodies) => {
    bodies.forEach((body, index) => {
      if (!trailsRef.current[index]) {
        trailsRef.current[index] = [];
      }
      
      trailsRef.current[index].push({ x: body.x, y: body.y });
      
      if (trailsRef.current[index].length > maxTrailLength) {
        trailsRef.current[index].shift();
      }
    });
  };

  const drawTrails = (ctx) => {
    trailsRef.current.forEach((trail, index) => {
      if (trail && trail.length > 1) {
        const baseColor = bodies[index]?.color || '#000000';
        ctx.lineWidth = 2 / viewportRef.current.scale; // Adjust line width for scale
        
        // Draw trail with gradient effect - newer points more opaque
        for (let i = 1; i < trail.length; i++) {
          const alpha = (i / trail.length) * 0.8; // Fade from 0 to 0.8
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = baseColor;
          
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
      }
    });
  };

  const drawBodies = (ctx, bodies) => {
    bodies.forEach(body => {
      const scale = viewportRef.current.scale;
      
      // Draw body
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(body.x, body.y, Math.sqrt(body.mass) * 2 / scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw velocity vector (conditionally)
      if (showVelocityVectors) {
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 2 / scale;
        const vectorScale = 20 / scale;
        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(body.x + body.vx * vectorScale, body.y + body.vy * vectorScale);
        ctx.stroke();
        
        // Draw arrow head
        const angle = Math.atan2(body.vy, body.vx);
        const arrowLength = 8 / scale;
        ctx.beginPath();
        ctx.moveTo(body.x + body.vx * vectorScale, body.y + body.vy * vectorScale);
        ctx.lineTo(
          body.x + body.vx * vectorScale - arrowLength * Math.cos(angle - Math.PI / 6),
          body.y + body.vy * vectorScale - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(body.x + body.vx * vectorScale, body.y + body.vy * vectorScale);
        ctx.lineTo(
          body.x + body.vx * vectorScale - arrowLength * Math.cos(angle + Math.PI / 6),
          body.y + body.vy * vectorScale - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });
  };

  const handleClearTrails = () => {
    trailsRef.current = [];
  };

  useEffect(() => {
    if (clearTrails) {
      trailsRef.current = [];
    }
  }, [clearTrails]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="simulation-canvas"
      />
      <button onClick={handleClearTrails} className="clear-trails-button">
        Clear Trails
      </button>
    </div>
  );
};

export default Canvas;