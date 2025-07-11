import React, { useRef, useEffect } from 'react';

const Canvas = ({ bodies, clearTrails, trailLength = 100, showVelocityVectors = true }) => {
  const canvasRef = useRef(null);
  const trailsRef = useRef([]);
  const maxTrailLength = trailLength;
  const viewportRef = useRef({ minX: 0, maxX: 600, minY: 0, maxY: 400, scale: 50, offsetX: 300, offsetY: 200 });

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
    
    // Only use current body positions for viewport calculation (not trails)
    const bodyPositions = bodies.map(b => ({ x: b.x, y: b.y }));
    
    // Calculate bounding box of the 3 bodies
    const minX = Math.min(...bodyPositions.map(p => p.x));
    const maxX = Math.max(...bodyPositions.map(p => p.x));
    const minY = Math.min(...bodyPositions.map(p => p.y));
    const maxY = Math.max(...bodyPositions.map(p => p.y));
    
    // Calculate the range needed to encompass all bodies
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    // Set minimum range to avoid extreme zoom when bodies are very close
    const minRange = 0.5; // Minimum range to maintain reasonable zoom
    const effectiveRangeX = Math.max(rangeX, minRange);
    const effectiveRangeY = Math.max(rangeY, minRange);
    
    // Target 80% of viewport to be occupied by the bodies
    // This means we need 20% padding total (10% on each side)
    const targetOccupancy = 0.8;
    const paddedRangeX = effectiveRangeX / targetOccupancy;
    const paddedRangeY = effectiveRangeY / targetOccupancy;
    
    // Calculate scale to fit the bodies in 80% of the viewport
    const scaleX = canvasWidth / paddedRangeX;
    const scaleY = canvasHeight / paddedRangeY;
    
    // Use the smaller scale to ensure everything fits
    const targetScale = Math.min(scaleX, scaleY);
    
    // Apply reasonable limits to prevent extreme zoom
    const maxScale = 200; // Maximum zoom in
    const minScale = 1;   // Minimum zoom out
    const scale = Math.max(minScale, Math.min(targetScale, maxScale));
    
    // Always center the viewport on (0,0) coordinates
    const offsetX = canvasWidth / (2 * scale);
    const offsetY = canvasHeight / (2 * scale);
    
    // Smooth transitions with adaptive speed
    const viewport = viewportRef.current;
    const scaleDifference = Math.abs(scale - (viewport.scale || 1)) / (viewport.scale || 1);
    const smoothFactor = scaleDifference > 0.5 ? 0.3 : 0.1; // Slower, smoother transitions
    
    viewport.scale = viewport.scale + (scale - viewport.scale) * smoothFactor;
    viewport.offsetX = viewport.offsetX + (offsetX - viewport.offsetX) * smoothFactor;
    viewport.offsetY = viewport.offsetY + (offsetY - viewport.offsetY) * smoothFactor;
  };

  const drawGrid = (ctx, width, height) => {
    const viewport = viewportRef.current;
    
    // Calculate the visible world coordinates
    const worldLeft = -viewport.offsetX;
    const worldRight = width - viewport.offsetX;
    const worldTop = -viewport.offsetY;
    const worldBottom = height - viewport.offsetY;
    
    // Adaptive grid spacing based on zoom level
    let gridSpacing;
    if (viewport.scale > 50) {
      gridSpacing = 0.2;
    } else if (viewport.scale > 20) {
      gridSpacing = 0.5;
    } else if (viewport.scale > 10) {
      gridSpacing = 1.0;
    } else if (viewport.scale > 5) {
      gridSpacing = 2.0;
    } else {
      gridSpacing = 5.0;
    }
    
    // Calculate grid boundaries
    const startX = Math.floor(worldLeft / gridSpacing) * gridSpacing;
    const endX = Math.ceil(worldRight / gridSpacing) * gridSpacing;
    const startY = Math.floor(worldTop / gridSpacing) * gridSpacing;
    const endY = Math.ceil(worldBottom / gridSpacing) * gridSpacing;
    
    // Draw axes first (dimmed white lines) - scale line width correctly
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 / viewport.scale;
    ctx.globalAlpha = 0.4; // Dimmed main axes
    
    // X-axis (horizontal line at y=0)
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, 0);
    ctx.stroke();
    
    // Y-axis (vertical line at x=0)
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(0, endY);
    ctx.stroke();
    
    // Draw grid lines (thinner, semi-transparent)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1 / viewport.scale;
    ctx.globalAlpha = 0.3;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSpacing) {
      if (Math.abs(x) < 0.001) continue; // Skip axis line
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSpacing) {
      if (Math.abs(y) < 0.001) continue; // Skip axis line
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1; // Reset alpha
    
    // Add coordinate labels
    ctx.fillStyle = '#ffffff';
    ctx.font = `${12 / viewport.scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Label every other grid line for readability
    const labelSpacing = gridSpacing * 2;
    
    // X-axis labels
    for (let x = Math.floor(startX / labelSpacing) * labelSpacing; x <= endX; x += labelSpacing) {
      if (Math.abs(x) < 0.001) continue; // Skip origin
      ctx.fillText(x.toFixed(1), x, -0.15);
    }
    
    // Y-axis labels
    for (let y = Math.floor(startY / labelSpacing) * labelSpacing; y <= endY; y += labelSpacing) {
      if (Math.abs(y) < 0.001) continue; // Skip origin
      ctx.fillText(y.toFixed(1), -0.15, y);
    }
    
    // Draw subtle origin marker
    ctx.fillStyle = '#ffffff';
    ctx.font = `${10 / viewport.scale}px Arial`;
    ctx.globalAlpha = 0.6;
    ctx.fillText('(0,0)', 0.05, -0.05);
    
    // Draw small origin point
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, 0.02, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalAlpha = 1; // Reset alpha
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
      
      // Adaptive body radius based on viewport scale - increased size
      let baseRadius = Math.sqrt(body.mass) * 6; // Increased from 3 to 6 for bigger bodies
      if (scale > 20) {
        baseRadius *= 0.8; // Smaller when zoomed in a lot (adjusted from 0.6)
      } else if (scale < 5) {
        baseRadius *= 1.6; // Larger when zoomed out (adjusted from 1.4)
      }
      
      // Draw body
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(body.x, body.y, baseRadius / scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add a subtle border for better visibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 / scale;
      ctx.stroke();
      
      // Draw velocity vector (conditionally)
      if (showVelocityVectors) {
        ctx.strokeStyle = body.color;
        ctx.lineWidth = 3 / scale; // Slightly thicker for better visibility
        
        // Better vector scaling based on zoom level
        const velocityMagnitude = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
        let vectorScale = 0.5; // Base scale for vectors
        
        // Zoom-based scaling adjustments
        if (scale > 50) {
          vectorScale = 0.3; // Smaller when very zoomed in
        } else if (scale > 20) {
          vectorScale = 0.4; // Medium when moderately zoomed in
        } else if (scale > 10) {
          vectorScale = 0.5; // Standard size
        } else if (scale > 5) {
          vectorScale = 0.6; // Slightly larger when zoomed out
        } else {
          vectorScale = 0.8; // Larger when very zoomed out
        }
        
        // Apply velocity magnitude scaling for proportional representation
        if (velocityMagnitude > 0) {
          // Scale proportionally to velocity magnitude, but with reasonable limits
          const magnitudeScale = Math.min(2.0, Math.max(0.5, velocityMagnitude));
          vectorScale *= magnitudeScale;
        }
        
        const endX = body.x + body.vx * vectorScale;
        const endY = body.y + body.vy * vectorScale;
        
        // Draw the vector line
        ctx.beginPath();
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrow head if vector is long enough
        const vectorLength = Math.sqrt((endX - body.x) ** 2 + (endY - body.y) ** 2);
        if (vectorLength > 0.02) { // Only draw arrow if vector is significant
          const angle = Math.atan2(body.vy, body.vx);
          const arrowLength = Math.min(vectorLength * 0.3, 0.1); // Proportional to vector length
          
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - Math.PI / 6),
            endY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + Math.PI / 6),
            endY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
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