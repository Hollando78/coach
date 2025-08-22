# Cat-in-the-Hat Overflow

A whimsical browser game where clicking a cat's striped hat spawns random items that stack up with realistic physics until the screen fills and explodes with confetti!

## Quick Start

1. Open `index.html` in any modern web browser
2. No build step or server required - just open and play!

## Controls

- **Click/Tap the Hat**: Spawn a random item that pops out and falls
- **Spacebar**: Alternative way to spawn items (desktop only)
- **Reset Button (↻)**: Manually restart the current round
- **Mute Button (🔊/🔇)**: Toggle sound effects on/off

## Game Mechanics

- Items spawn from the hat with random upward velocity and fall with physics
- Each item has unique properties (size, mass, bounce)
- Items stack realistically using Matter.js physics engine
- Game detects when screen is "filled" (items reach near top or 250+ items)
- When filled, triggers explosion effect with confetti and screen shake
- Automatically resets for next round, tracking items spawned

## Technical Notes

### Architecture
- **Single-page application** with no external dependencies except Matter.js (CDN)
- **Canvas rendering** for items and particle effects
- **SVG graphics** for the cat character
- **Web Audio API** for procedural sound effects
- **Responsive design** scales to any screen size (min 360×640)

### Performance
- Targets 60 FPS using requestAnimationFrame
- Efficient particle systems with automatic cleanup
- Physics optimization with velocity/position iterations
- Item cap at 250 to prevent performance degradation

### Fill Detection Algorithm
- Creates a 20px grid overlay on the game area
- Marks cells occupied by item bounding boxes
- Triggers when items occupy 60% width of top 10% screen height
- Alternative trigger at 250 items for performance safety

## Adding New Items

To add new items to the game, edit the `ITEMS` array in `main.js`:

```javascript
{
    name: 'itemName',
    width: 50,          // Collision box width
    height: 50,         // Collision box height  
    mass: 1.0,          // Affects weight and stacking
    color: '#hexcolor', // Primary color
    draw: (ctx, x, y, angle) => {
        // Canvas drawing code
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        // Draw your item here
        ctx.restore();
    }
}
```

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari/iOS Safari (latest)
- Requires JavaScript enabled
- Requires Canvas and Web Audio API support

## Accessibility Features

- Keyboard support (Spacebar to spawn)
- ARIA labels on UI buttons
- Screen reader announcements for game state
- High contrast UI elements
- Touch-friendly hit areas

## Game States

1. **Idle**: Waiting for player input
2. **Spawning**: Item being created and launched
3. **Exploding**: Fill condition met, playing effects
4. **Reset**: Clearing world and preparing next round

## Tips

- Items spawn with slight randomness in velocity and spin
- 1% chance for special "star" item (larger and heavier)
- Click rapidly to create item avalanches
- Each round tracks how many items you spawned before filling