# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cat-in-the-Hat Overflow is a browser-based physics game where clicking a cat's striped hat spawns random items that fall and stack up using realistic physics until the screen fills and explodes with confetti.

## Development Setup

This is a client-side only game with no build process required. To run locally:

```bash
python3 -m http.server 3002
```

Then open `http://localhost:3002` in a browser.

## Architecture

### Core Structure
- **Single HTML file architecture** (`index.html`) - No bundling or compilation required
- **Canvas-based rendering** - Dual canvas setup for game items and particle effects
- **Matter.js physics engine** - Loaded locally (`matter.min.js`) for reliable physics and collision detection
- **SVG-based cat character** - Inline SVG for the clickable cat with hat
- **Web Audio API** - Procedural sound generation for game effects

### Key Components

**Game Class** (`main.js:318-794`)
- Central game controller managing all state and systems
- Handles canvas setup, physics world, event listeners, and animation loop
- Manages game states: idle, spawning, exploding, reset

**Physics System**
- Built on Matter.js with custom configuration for gravity, restitution, and friction
- Static ground and wall bodies for containment
- Dynamic item bodies with individual mass and physics properties

**Item System** (`main.js:23-315`)
- `ITEMS` array defines all spawnable objects with draw functions, dimensions, and physics properties
- Each item has custom canvas drawing code for visual representation
- Special rare "star" item (1% spawn chance) with enhanced properties

**Fill Detection Algorithm** (`main.js:612-656`)
- Grid-based occupancy system (20px cells) to detect screen fullness
- Triggers explosion when 60% width coverage in top 10% of screen height
- Failsafe at 250 items for performance

**Effects System**
- Particle effects for item spawning (poof animation)
- Confetti explosion system with physics-based movement
- Screen shake and flash effects using CSS animations

### Event Handling
- Multi-input support: mouse click, touch events, keyboard (spacebar)
- Touch-optimized with proper preventDefault and event coordination
- Debounced spawning (125ms) to prevent spam clicking

### Audio System
- Web Audio API with procedural sound generation
- "Pop" sounds for item spawning (oscillator-based)
- "Explosion" sound using white noise with filtering
- Mute toggle functionality

## Game Configuration

Key constants in `PHYSICS_CONFIG` and `GAME_CONFIG` control gameplay balance:
- `maxItems: 250` - Performance safety limit
- `spawnDebounce: 125` - Milliseconds between allowed spawns
- `fillThresholdPercent: 0.1` - Top percentage of screen to check for fullness
- `fillWidthPercent: 0.6` - Width coverage required to trigger explosion

## Adding New Items

Items are defined in the `ITEMS` array with:
- `name`: Identifier string
- `width`, `height`: Collision box dimensions
- `mass`: Affects physics weight and stacking behavior
- `color`: Primary color (for reference)
- `draw`: Canvas rendering function with (ctx, x, y, angle) parameters

## Performance Considerations

- 60 FPS target using requestAnimationFrame
- Automatic particle cleanup when off-screen or expired
- Matter.js velocity/position iteration limits for stability
- Item count cap prevents memory/performance degradation
- Efficient canvas clearing and redrawing each frame

## Recent Changes

### Matter.js Local Hosting (August 15, 2025)
- **Issue**: Matter.js CDN loading was unreliable, causing "Physics library failed to load" errors
- **Root Cause**: Network issues or timing problems with CDN script loading
- **Solution**: Downloaded Matter.js locally and serve from same domain
- **Changes Made**:
  - Downloaded `matter.min.js` v0.19.0 to local directory
  - Updated `index.html` to load from `matter.min.js` instead of CDN
  - Improved initialization with better error handling and timing checks

### Audio Fix (August 15, 2025)
- **Issue**: Sound effects not working due to Web Audio API restrictions in modern browsers
- **Root Cause**: Browsers require user interaction before allowing audio context to play
- **Solution**: Added `ensureAudioContext()` method that resumes suspended audio context
- **Changes Made**:
  - Added `ensureAudioContext()` method at `main.js:360-364`
  - Called on all user interactions: hat clicks, reset button, mute button, spacebar
  - Modified `spawnItem()` function to resume audio context on first interaction
  - Modified button event handlers to ensure audio context is active

## Browser Compatibility

Requires modern browser support for:
- HTML5 Canvas
- Web Audio API (with user interaction requirement)
- ES6+ JavaScript features (arrow functions, const/let, classes)
- SVG rendering
- CSS transforms and animations

## Deployment Notes

### Dashboard Integration
The game is fully self-contained with Matter.js served locally:
- All assets (HTML, CSS, JS, Matter.js) are served from the same domain
- No external CDN dependencies required
- Works reliably even with restrictive CSP policies

### Files Required
- `index.html` - Main game page
- `style.css` - Game styles
- `main.js` - Game logic
- `matter.min.js` - Physics engine (v0.19.0)