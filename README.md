# 3-Body Problem Simulator

A real-time interactive visualization of the 3-body problem using Fastify backend and React frontend with HTML5 Canvas.

## Overview

This application allows users to configure and visualize gravitational interactions between three celestial bodies. Users can adjust initial conditions (position, velocity, mass) and observe how the bodies move under mutual gravitational attraction.

## Features

### Core Functionality
- **Interactive Configuration**: Input fields for each body's:
  - Position (x, y coordinates)
  - Velocity (vx, vy vectors)
  - Mass
- **Real-time Simulation**: Physics-based gravitational calculations using Newton's law of universal gravitation
- **Visual Representation**: 
  - Bodies displayed as colored circles (size proportional to mass)
  - Velocity vectors shown as arrows
  - Motion trails showing historical paths
  - Grid background for reference

### Controls
- **Run/Pause**: Start and stop the simulation
- **Reset**: Return all bodies to their initial state
- **Time Speed Control**: Slider to adjust simulation speed (0.1x to 3x)
- **Clear Trails**: Remove motion history from canvas

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Input fields update as bodies move during simulation
- **Smooth Animation**: 60 FPS animation loop using requestAnimationFrame
- **Trail Visualization**: Configurable trail length (100 points max)

## Technology Stack

### Backend
- **Fastify**: Lightweight web server for serving static files
- **Node.js**: Runtime environment

### Frontend
- **React**: Component-based UI framework
- **HTML5 Canvas**: 2D graphics rendering
- **Webpack**: Module bundler with Babel for JSX/ES6 support
- **CSS3**: Styling with flexbox and responsive design

## Project Structure

```
3bp/
├── src/
│   ├── App.js              # Main application component
│   ├── BodyForm.js         # Form for configuring body parameters
│   ├── Canvas.js           # Canvas rendering and visualization
│   ├── Simulation.js       # Physics simulation engine
│   ├── index.js            # React entry point
│   └── styles.css          # Application styles
├── public/
│   └── index.html          # HTML template
├── dist/                   # Built files (generated)
├── server.js               # Fastify server configuration
├── webpack.config.js       # Webpack build configuration
└── package.json            # Dependencies and scripts
```

## Physics Implementation

### Gravitational Force Calculation
The simulation uses Newton's law of universal gravitation:
- **Force**: F = G * m1 * m2 / r²
- **Gravitational Constant**: G = 0.1 (scaled for visualization)
- **Time Step**: dt = 0.016 (60 FPS base) * timeSpeed
- **Integration**: Euler method for position and velocity updates

### Collision Avoidance
- Minimum distance threshold prevents division by zero
- Forces are ignored when bodies are too close (r < 1)

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm package manager

### Installation
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### Development
```bash
# Development build
npm run build:dev

# Development server with auto-reload
npm run dev
```

## Usage

1. **Start the Application**
   - Navigate to `http://localhost:3000`
   - Three bodies will be visible with default configurations

2. **Configure Bodies**
   - Use the form controls to adjust:
     - Position coordinates (x, y)
     - Velocity vectors (vx, vy)
     - Mass values
   - Changes take effect immediately

3. **Run Simulation**
   - Click "Run" to start the physics simulation
   - Use "Pause" to stop at any time
   - Adjust time speed with the slider (0.1x to 3x)

4. **Reset and Clear**
   - "Reset" returns to initial configuration
   - "Clear Trails" removes motion history

## Default Configuration

The application starts with three bodies:
- **Body 1 (Red)**: Position (100, 200), Velocity (2, 1), Mass 10
- **Body 2 (Green)**: Position (300, 200), Velocity (-1, -2), Mass 10
- **Body 3 (Blue)**: Position (200, 100), Velocity (1, 2), Mass 10

## Development Notes

### Key Components
- **App.js**: Main state management and component coordination
- **Simulation.js**: Physics engine with forwardRef for external control
- **Canvas.js**: Rendering engine with trail management
- **BodyForm.js**: User interface for parameter input

### Performance Considerations
- Animation uses requestAnimationFrame for smooth 60 FPS
- Trail arrays are limited to 100 points to prevent memory issues
- Forces are calculated for each body pair only once per frame

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- ES6+ features require transpilation for older browsers
- Responsive design works on mobile devices

## Future Enhancements

### Potential Features
- Save/load configuration presets
- Export simulation data or video
- Additional gravitational parameters (G constant adjustment)
- Collision detection and merging
- Multiple simulation scenarios
- Performance optimizations for larger numbers of bodies

### Technical Improvements
- WebGL rendering for better performance
- Web Workers for physics calculations
- Real-time collaboration features
- Integration with physics libraries

## License

This project is for educational purposes and demonstrates:
- React component architecture
- HTML5 Canvas graphics
- Physics simulation
- Real-time web applications
- Fastify server setup

## Development History

Created as an interactive learning tool for understanding gravitational dynamics and the famous 3-body problem in celestial mechanics. The application demonstrates how small changes in initial conditions can lead to dramatically different orbital behaviors (chaos theory).

## Contributing

This is a learning project. Feel free to:
- Experiment with different initial conditions
- Modify the physics parameters
- Add new visualization features
- Improve the user interface
- Optimize performance

## Troubleshooting

### Common Issues
- **Bodies not moving**: Check that velocities are non-zero and "Run" is clicked
- **Reset not working**: Ensure the page is refreshed after code changes
- **Performance issues**: Reduce trail length or adjust time speed

### Debug Features
- Console logging is enabled for simulation state tracking
- Browser developer tools show component state changes
- Physics calculations can be verified in the console