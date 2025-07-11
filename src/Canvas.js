import React, { useRef, useEffect, useImperativeHandle } from 'react';

const Canvas = React.forwardRef(({ bodies, clearTrails, trailLength = 100, showVelocityVectors = true, isRunning = false, onBodyChange }, ref) => {
  const canvasRef = useRef(null);
  const trailsRef = useRef([]);
  const maxTrailLength = trailLength;
  
  // Interaction state
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef(null); // 'position' or 'velocity'
  const dragBodyIdRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  // Default viewport settings for reset - properly centered on (0,0)
  const canvasWidth = 600;
  const canvasHeight = 400;
  const defaultScale = 50;
  const defaultViewport = { 
    minX: 0, 
    maxX: canvasWidth, 
    minY: 0, 
    maxY: canvasHeight, 
    scale: defaultScale, 
    offsetX: canvasWidth / (2 * defaultScale), // 6 for 600/(2*50)
    offsetY: canvasHeight / (2 * defaultScale) // 4 for 400/(2*50)
  };
  const viewportRef = useRef({ ...defaultViewport });
  const viewportResetFramesRef = useRef(0);

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
    
    // Skip viewport updates for a few frames after reset (let reset viewport stay fixed)
    if (viewportResetFramesRef.current > 0) {
      viewportResetFramesRef.current--;
      return;
    }
    
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
    const calculatedScale = Math.max(minScale, Math.min(targetScale, maxScale));
    
    // Only zoom out, never zoom back in (unless it's a reset)
    const viewport = viewportRef.current;
    const currentScale = viewport.scale || defaultScale;
    const scale = Math.min(calculatedScale, currentScale);
    
    // Always center the viewport on (0,0) coordinates
    const offsetX = canvasWidth / (2 * scale);
    const offsetY = canvasHeight / (2 * scale);
    
    // Smooth transitions with adaptive speed - slower for zoom out
    const scaleDifference = Math.abs(scale - currentScale) / currentScale;
    const smoothFactor = scaleDifference > 0.1 ? 0.05 : 0.02; // Very slow, smooth transitions
    
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
      const isBeingDragged = isDraggingRef.current && dragBodyIdRef.current === body.id;
      
      // Adaptive body radius based on viewport scale - increased size
      let baseRadius = Math.sqrt(body.mass) * 6; // Increased from 3 to 6 for bigger bodies
      if (scale > 20) {
        baseRadius *= 0.8; // Smaller when zoomed in a lot (adjusted from 0.6)
      } else if (scale < 5) {
        baseRadius *= 1.6; // Larger when zoomed out (adjusted from 1.4)
      }
      
      // Highlight body being dragged
      if (isBeingDragged) {
        ctx.fillStyle = body.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(body.x, body.y, (baseRadius + 5) / scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Draw body
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(body.x, body.y, baseRadius / scale, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add a border - thicker for dragged body
      ctx.strokeStyle = isBeingDragged ? '#ffffff' : '#000000';
      ctx.lineWidth = (isBeingDragged ? 3 : 1) / scale;
      ctx.stroke();
      
      // Draw velocity vector (conditionally)
      if (showVelocityVectors) {
        const isVelocityBeingDragged = isBeingDragged && dragModeRef.current === 'velocity';
        ctx.strokeStyle = isVelocityBeingDragged ? '#ffffff' : body.color;
        ctx.lineWidth = (isVelocityBeingDragged ? 5 : 3) / scale; // Thicker when being dragged
        
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
    resetViewportAndTrails();
  };

  const resetViewport = () => {
    viewportRef.current = { ...defaultViewport };
    viewportResetFramesRef.current = 30; // Freeze viewport for 30 frames (~0.5 seconds at 60fps)
  };

  const recalculateViewport = () => {
    // Force immediate viewport recalculation for new body positions
    if (bodies.length > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        // Calculate optimal scale for current bodies without smoothing
        const bodyPositions = bodies.map(b => ({ x: b.x, y: b.y }));
        
        const minX = Math.min(...bodyPositions.map(p => p.x));
        const maxX = Math.max(...bodyPositions.map(p => p.x));
        const minY = Math.min(...bodyPositions.map(p => p.y));
        const maxY = Math.max(...bodyPositions.map(p => p.y));
        
        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        
        const minRange = 0.5;
        const effectiveRangeX = Math.max(rangeX, minRange);
        const effectiveRangeY = Math.max(rangeY, minRange);
        
        const targetOccupancy = 0.8;
        const paddedRangeX = effectiveRangeX / targetOccupancy;
        const paddedRangeY = effectiveRangeY / targetOccupancy;
        
        const scaleX = canvas.width / paddedRangeX;
        const scaleY = canvas.height / paddedRangeY;
        const targetScale = Math.min(scaleX, scaleY);
        
        const maxScale = 200;
        const minScale = 1;
        const scale = Math.max(minScale, Math.min(targetScale, maxScale));
        
        const offsetX = canvas.width / (2 * scale);
        const offsetY = canvas.height / (2 * scale);
        
        // Apply immediately without smoothing
        viewportRef.current.scale = scale;
        viewportRef.current.offsetX = offsetX;
        viewportRef.current.offsetY = offsetY;
        
        // Don't freeze viewport after recalculation (allow normal updates)
        viewportResetFramesRef.current = 0;
      }
    }
  };

  const resetViewportAndTrails = () => {
    trailsRef.current = [];
    resetViewport();
  };

  useEffect(() => {
    if (clearTrails) {
      resetViewportAndTrails();
    }
  }, [clearTrails]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = (screenX, screenY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const viewport = viewportRef.current;
    const worldX = (canvasX / viewport.scale) - viewport.offsetX;
    const worldY = (canvasY / viewport.scale) - viewport.offsetY;
    
    return { x: worldX, y: worldY };
  };

  // Find which body is at the given world coordinates
  const findBodyAtPosition = (worldX, worldY) => {
    const viewport = viewportRef.current;
    
    for (const body of bodies) {
      const distance = Math.sqrt((worldX - body.x) ** 2 + (worldY - body.y) ** 2);
      const bodyRadius = Math.sqrt(body.mass) * 6 / viewport.scale; // Same calculation as in drawBodies
      
      if (distance <= bodyRadius) {
        return body;
      }
    }
    return null;
  };

  // Check if click is on a velocity vector
  const isClickOnVelocityVector = (worldX, worldY, body) => {
    if (!showVelocityVectors) return false;
    
    const viewport = viewportRef.current;
    const velocityMagnitude = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    let vectorScale = 0.5;
    
    // Apply same scaling logic as in drawBodies
    if (viewport.scale > 50) {
      vectorScale = 0.3;
    } else if (viewport.scale > 20) {
      vectorScale = 0.4;
    } else if (viewport.scale > 10) {
      vectorScale = 0.5;
    } else if (viewport.scale > 5) {
      vectorScale = 0.6;
    } else {
      vectorScale = 0.8;
    }
    
    if (velocityMagnitude > 0) {
      const magnitudeScale = Math.min(2.0, Math.max(0.5, velocityMagnitude));
      vectorScale *= magnitudeScale;
    }
    
    const endX = body.x + body.vx * vectorScale;
    const endY = body.y + body.vy * vectorScale;
    
    // Check if click is near the velocity vector line
    const distanceToLine = pointToLineDistance(worldX, worldY, body.x, body.y, endX, endY);
    return distanceToLine < 0.1; // Tolerance for clicking on vector
  };

  // Calculate distance from point to line segment
  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  };

  // Mouse event handlers
  const handleMouseDown = (event) => {
    if (isRunning) return; // Only allow interaction when paused
    
    const { x: worldX, y: worldY } = screenToWorld(event.clientX, event.clientY);
    const body = findBodyAtPosition(worldX, worldY);
    
    if (body) {
      isDraggingRef.current = true;
      dragBodyIdRef.current = body.id;
      dragStartRef.current = { x: worldX, y: worldY };
      
      if (showVelocityVectors && isClickOnVelocityVector(worldX, worldY, body)) {
        dragModeRef.current = 'velocity';
        dragOffsetRef.current = { x: 0, y: 0 };
      } else {
        dragModeRef.current = 'position';
        dragOffsetRef.current = { x: worldX - body.x, y: worldY - body.y };
      }
      
      event.preventDefault();
    }
  };

  const handleMouseMove = (event) => {
    if (!isDraggingRef.current || isRunning) return;
    
    const { x: worldX, y: worldY } = screenToWorld(event.clientX, event.clientY);
    const body = bodies.find(b => b.id === dragBodyIdRef.current);
    
    if (body && onBodyChange) {
      if (dragModeRef.current === 'position') {
        const newX = worldX - dragOffsetRef.current.x;
        const newY = worldY - dragOffsetRef.current.y;
        onBodyChange(body.id, 'x', newX);
        onBodyChange(body.id, 'y', newY);
      } else if (dragModeRef.current === 'velocity') {
        const newVx = (worldX - body.x) / 0.5; // Inverse of vector scale
        const newVy = (worldY - body.y) / 0.5;
        onBodyChange(body.id, 'vx', newVx);
        onBodyChange(body.id, 'vy', newVy);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragModeRef.current = null;
    dragBodyIdRef.current = null;
  };

  // Add mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [bodies, showVelocityVectors, isRunning, onBodyChange]);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    recalculateViewport,
    resetViewport,
    resetViewportAndTrails
  }));

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="simulation-canvas"
        style={{ 
          cursor: isRunning ? 'default' : (showVelocityVectors ? 'grab' : 'move')
        }}
      />
      <button onClick={handleClearTrails} className="clear-trails-button">
        Clear Trails
      </button>
    </div>
  );
});

export default Canvas;