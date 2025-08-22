# 🐉 Dragon Hatchers - Web Game

A fully-featured dragon care and adventure game built with HTML, CSS, and JavaScript.

## Features

- **Dragon Care System**: Feed, train, and evolve your dragons through multiple stages
- **Open World Exploration**: Explore different biomes, gather resources, and encounter wild dragons
- **Modular Overlay System**: Modern UI with dedicated overlays for feeding, training, equipment, stats, and inventory
- **Battle System**: Turn-based combat with animated effects
- **Resource Management**: Collect items, manage inventory, and craft equipment
- **Progressive Evolution**: Dragons evolve from Hatchling → Juvenile → Adult → Full Grown → Elder → Ancient

## Deployment Options

### Option 1: GitHub Pages (Recommended)
1. Create a GitHub repository
2. Upload `index.html` and `world.html` to the repository
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" → "main"
5. Your game will be available at `https://yourusername.github.io/repositoryname`

### Option 2: Netlify
1. Visit [netlify.com](https://netlify.com)
2. Create an account
3. Drag and drop the game folder to Netlify
4. Your game will get a unique URL like `https://random-name.netlify.app`

### Option 3: Vercel
1. Visit [vercel.com](https://vercel.com)
2. Create an account and connect GitHub
3. Import your repository
4. Vercel will automatically deploy at `https://projectname.vercel.app`

### Option 4: Surge.sh
1. Install surge: `npm install -g surge`
2. In the game directory, run: `surge`
3. Follow prompts to get a URL like `https://yourname.surge.sh`

## Local Development
```bash
# Start local server
python3 -m http.server 8000

# Or use Node.js
npx http-server

# Then visit http://localhost:8000
```

## Files
- `index.html` - Main dragon care interface with overlay system
- `world.html` - Open world exploration and resource gathering
- `README.md` - This file

## Game Mechanics

### Dragon Evolution Stages
1. **Hatchling** (Level 1-4): Small, basic abilities
2. **Juvenile** (Level 5-9): Growing stronger, new moves
3. **Adult** (Level 10-19): Mature dragon with power aura
4. **Full Grown** (Level 20-29): Large size with mastery rings
5. **Elder** (Level 30-49): Powerful with ancient energy
6. **Ancient** (Level 50+): Maximum evolution with legendary effects

### Care Actions
- **Feed**: Use berries or food items to restore energy and happiness
- **Water**: Restore HP and happiness with water
- **Train**: Gain XP (basic) or use herbs/crystals for enhanced training
- **Auto-Care**: Automatically perform all care actions

### World Exploration
- **Movement**: WASD or arrow keys
- **Resource Gathering**: Click on resources to collect
- **NPC Interaction**: Talk to NPCs for quests and trade
- **Monster Battles**: Encounter and battle wild creatures
- **Biome Exploration**: Different areas with unique resources

## Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Credits
Built with modern web technologies and responsive design for all devices.