# Pocket Dogfight - WebGL Build Instructions

## Overview

This document describes how to build and deploy Pocket Dogfight as a WebGL application with WebRTC multiplayer functionality. The web version uses room codes for peer discovery instead of Bluetooth.

## Prerequisites

- Unity 2022.3 LTS with WebGL build support
- Node.js 14+ (for signaling server)
- Web hosting service (Vercel, Netlify, GitHub Pages, etc.)
- Optional: Heroku or similar for signaling server

## Project Configuration

### 1. Unity WebGL Settings

1. **Player Settings Configuration**
   - File > Build Settings > WebGL
   - Player Settings > Company Name: `Your Company`
   - Player Settings > Product Name: `Pocket Dogfight`
   - WebGL Settings > Template: `Default` or `Minimal`
   - WebGL Settings > Compression Format: `Gzip` (recommended)

2. **WebGL Specific Settings**
   - Publishing Settings > Decompression Fallback: ✓ Enabled
   - Memory Size: `256 MB` (can increase if needed)
   - Enable Exceptions: `None` (for smaller builds)
   - Code Optimization: `Speed` (for better performance)

3. **Rendering Settings**
   - Graphics API: `WebGL 2.0` (with WebGL 1.0 fallback)
   - Color Space: `Gamma` (for better compatibility)
   - Auto Graphics API: ✓ Enabled

### 2. Network Transport Configuration

The WebGL build automatically uses `WebRTCTransport` instead of Bluetooth transports:

```csharp
// In NetworkManager.cs - InitializeTransport()
#if UNITY_WEBGL && !UNITY_EDITOR
    transport = new WebRTCTransport();
#elif UNITY_IOS && !UNITY_EDITOR
    transport = new IosMpcTransport();
#elif UNITY_ANDROID && !UNITY_EDITOR
    transport = new AndroidBtTransport();
#else
    transport = new EditorLoopbackTransport();
#endif
```

## Signaling Server Setup

### 1. Deploy Signaling Server

The game requires a WebRTC signaling server for peer discovery and connection establishment.

**Option A: Deploy to Heroku**

1. Install Heroku CLI
2. Navigate to signaling server directory:
   ```bash
   cd signaling-server/
   npm install
   ```

3. Create Heroku app:
   ```bash
   heroku create your-app-name-signaling
   git init
   git add .
   git commit -m "Initial signaling server"
   heroku git:remote -a your-app-name-signaling
   git push heroku main
   ```

4. Get your server URL: `https://your-app-name-signaling.herokuapp.com`

**Option B: Deploy to Vercel**

1. Install Vercel CLI: `npm install -g vercel`
2. In signaling-server directory:
   ```bash
   npm install
   vercel --prod
   ```

**Option C: Run Locally (Development)**

```bash
cd signaling-server/
npm install
npm start
```
Server runs on `http://localhost:3000`

### 2. Update Signaling Server URL

Edit the WebRTC transport JavaScript library:

```javascript
// In Assets/Plugins/WebGL/webrtc-transport.jslib
signalingServerUrl: 'wss://your-signaling-server.herokuapp.com',
```

Replace with your deployed server URL (use `wss://` for HTTPS domains).

## Building for WebGL

### 1. Build Process

1. **Configure Scenes**
   - File > Build Settings
   - Add scenes in order: Bootstrap, MainMenu, Lobby, Arena
   - Select WebGL platform

2. **Build Optimization**
   - Player Settings > Publishing Settings:
     - Compression Format: `Gzip`
     - Name Files As Hashes: ✓ Enabled
     - Data Caching: ✓ Enabled
     - Debug Symbols: ✗ Disabled (for production)

3. **Build the Project**
   ```
   File > Build Settings > Build
   Choose output directory (e.g., "WebGL-Build")
   Wait for build completion (5-15 minutes)
   ```

### 2. Build Output Structure

```
WebGL-Build/
├── index.html              # Main HTML file
├── TemplateData/           # Unity WebGL template assets
├── Build/
│   ├── WebGL-Build.loader.js
│   ├── WebGL-Build.framework.js.gz
│   ├── WebGL-Build.data.gz
│   └── WebGL-Build.wasm.gz
└── StreamingAssets/        # Any streaming assets
```

## Deployment Options

### 1. Static Hosting (Recommended)

**GitHub Pages:**
1. Create repository: `your-username/pocket-dogfight`
2. Upload WebGL build to repository
3. Enable GitHub Pages in repository settings
4. Game available at: `https://your-username.github.io/pocket-dogfight`

**Netlify:**
1. Drag WebGL-Build folder to Netlify deploy
2. Get auto-generated URL or configure custom domain
3. Enable gzip compression in Netlify settings

**Vercel:**
```bash
cd WebGL-Build/
npx vercel --prod
```

### 2. Custom Hosting

For Apache/Nginx servers, ensure proper MIME types:

**Apache (.htaccess):**
```apache
AddType application/wasm .wasm
AddType application/javascript .js
AddEncoding gzip .gz
RewriteEngine On
RewriteRule ^(.*)\.gz$ $1 [L]
```

**Nginx:**
```nginx
location ~* \.(wasm|js)\.gz$ {
    add_header Content-Encoding gzip;
    add_header Content-Type application/wasm;
}
```

## Testing WebGL Build

### 1. Local Testing

**Simple HTTP Server:**
```bash
cd WebGL-Build/
python -m http.server 8000
# Or with Node.js:
npx http-server -p 8000
```

Open: `http://localhost:8000`

### 2. Multiplayer Testing

1. **Host Game:**
   - Open game in first browser/device
   - Click "Host Game"
   - Note the room code (e.g., "ABC123")

2. **Join Game:**
   - Open game in second browser/device
   - Click "Join Game"
   - Enter room code
   - Click "Join Room"

3. **Test Gameplay:**
   - Wait for connection (should be < 10 seconds)
   - Host clicks "Start Game"
   - Test movement, shooting, power-ups

## Performance Optimization

### 1. Build Size Optimization

- **Texture Compression:** Use compressed formats (DXT, ETC)
- **Audio Compression:** Compress audio to OGG Vorbis
- **Code Stripping:** Enable in Player Settings
- **Asset Bundling:** Group related assets

### 2. Runtime Performance

- **Target 30-60 FPS** on desktop browsers
- **Reduce physics complexity** for mobile browsers
- **Limit particle effects** for better performance
- **Use object pooling** (already implemented)

### 3. Network Optimization

- **Connection Timeout:** 30 seconds for WebRTC
- **Reconnection Logic:** Automatic retry on disconnect
- **Packet Size:** Keep messages < 1KB for reliability

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 80+ (Desktop/Mobile)
- ✅ Firefox 72+ (Desktop/Mobile)
- ✅ Safari 14+ (Desktop/iOS)
- ✅ Edge 80+ (Desktop)
- ⚠️ Safari < 14 (limited WebRTC support)
- ❌ Internet Explorer (not supported)

### Mobile Considerations
- **iOS Safari:** Requires user interaction for audio
- **Android Chrome:** May require HTTPS for WebRTC
- **Touch Controls:** Automatically detected and enabled
- **Performance:** Lower settings for older mobile devices

## Troubleshooting

### Common Issues

1. **Audio Not Playing**
   - Ensure user interaction before audio (WebGL requirement)
   - Check browser autoplay policies
   - Volume levels set correctly

2. **WebRTC Connection Failures**
   - Verify signaling server is running
   - Check browser console for errors
   - Ensure HTTPS for production (HTTP ok for localhost)
   - Firewall/NAT issues (use TURN servers if needed)

3. **Build Errors**
   - Clear build cache: Delete Library/BuildCache
   - Update Unity to latest LTS version
   - Check WebGL build support modules installed

4. **Performance Issues**
   - Enable WebGL 2.0 if supported
   - Reduce quality settings in GameConfig
   - Use Chrome DevTools for profiling

### Debug Commands

**Browser Console:**
```javascript
// Check WebRTC connection state
console.log(WebRTCTransportPlugin.peers);

// Test signaling server
new WebSocket('wss://your-server.herokuapp.com');

// Unity debug messages
unityInstance.SendMessage('NetworkManager', 'DebugTest', 'test');
```

## Advanced Configuration

### 1. TURN Servers (For Corporate Networks)

Add to `webrtc-transport.jslib`:

```javascript
rtcConfig: {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: 'turn:your-turn-server.com:3478',
            username: 'your-username',
            credential: 'your-password'
        }
    ]
}
```

### 2. Custom Domain Setup

1. **Configure DNS:** Point domain to hosting service
2. **SSL Certificate:** Enable HTTPS (required for WebRTC)
3. **Update URLs:** Change signaling server URL in code

### 3. Analytics Integration

Add to `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Production Checklist

### Pre-Launch
- [ ] Signaling server deployed and tested
- [ ] SSL certificate configured (for HTTPS)
- [ ] WebGL build optimized and compressed
- [ ] Cross-browser testing completed
- [ ] Mobile device testing completed
- [ ] Performance benchmarks met
- [ ] Analytics configured (if needed)

### Post-Launch Monitoring
- [ ] Monitor signaling server uptime
- [ ] Check WebRTC connection success rates
- [ ] Monitor build size and load times
- [ ] User feedback collection
- [ ] Browser compatibility issues

## Scaling Considerations

### Server Scaling
- **Room Limits:** Current server supports ~100 concurrent rooms
- **Connection Limits:** WebSocket connections per server instance
- **Geographic Distribution:** Deploy multiple signaling servers

### Client Optimization
- **Asset Streaming:** Load assets on demand
- **Progressive Enhancement:** Detect device capabilities
- **Graceful Degradation:** Fallbacks for older browsers

## Next Steps

1. **Enhanced Features:**
   - Spectator mode for additional browsers
   - Tournament brackets for multiple rooms
   - Custom room settings and themes

2. **Technical Improvements:**
   - WebAssembly optimization
   - Service worker for offline capability
   - WebRTC data channel reliability improvements

3. **Social Features:**
   - Share room codes via social media
   - Leaderboards with local storage
   - Replay system with WebRTC recording

Ready for immediate web deployment with full multiplayer WebRTC functionality!