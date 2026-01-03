# 🎵 CursorCam

**Music-Reactive Visual Engine**

Hey there! 👋 Welcome to CursorCam - a real-time audio-reactive visualization system that turns your music into living geometric art. Think neon constellations, pulsing tunnels, and sci-fi network patterns that dance to your beats.

> **🌱 Early Days!** This project is just getting started. As I learn and experiment, new patterns will arrive and existing ones will get even better. Expect updates, improvements, and plenty of trial and error along the way!

![CursorCam](https://img.shields.io/badge/Type-Generative%20Graphics-00ffff?style=for-the-badge)
![Audio Reactive](https://img.shields.io/badge/Audio-Reactive-ff006e?style=for-the-badge)
![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-00ff41?style=for-the-badge)

---

## ✨ What Does It Do?

CursorCam listens to your microphone and creates real-time visuals that react to your music. Bass makes things pulse, mids add complexity, highs make things sparkle. It's like having a VJ at your fingertips!

**Current Visual Modes:**

1. **💎 Strobe Diamond Tunnel** - Red & white diamond frames with explosive beat-reactive light chunks (NEWEST!)
2. **🌀 Neon Tunnel** - Fly through an infinite corridor of pulsing geometric frames
3. **🌐 Static Constellation** - A calm, slowly evolving network of connected nodes
4. **💓 Pulsing Mesh** - Watch the network breathe with your bass beats
5. **🔺 Polygon Emergence** - Triangles form and dissolve based on mid frequencies
6. **🎧 Stereo Split** - Dual-channel visualization for stereo tracks

---

## 🚀 Getting Started (Super Easy!)

### **What You Need:**
- A modern web browser (Chrome, Firefox, or Edge)
- A microphone
- Some music to jam to! 🎶

### **How to Run It:**

1. **Download or clone this project**

2. **Start a local server** (pick your favorite):

```bash
# Got Python? Use this:
python -m http.server 8000

# Prefer Node.js?
npx serve

# PHP person?
php -S localhost:8000
```

3. **Open your browser** to `http://localhost:8000`

4. **Click "Enable Microphone"** (the browser will ask for permission)

5. **Play some music** near your mic and watch the magic happen! ✨

> **Pro Tip:** Try different patterns with different music genres. EDM? Go for the Strobe Diamond Tunnel (it's INTENSE). Ambient? Static Constellation is your friend.

---

## 🎨 What Makes It Special?

CursorCam isn't about smooth, organic blobs. It's about **sharp geometry, digital precision, and neon aesthetics**:

- ✅ **Hard-edged shapes** - Straight lines, polygons, angular forms
- ✅ **Neon colors** - Pink, purple, cyan, electric blue, yellow
- ✅ **Step-based motion** - Things snap and jump (no smooth easing)
- ✅ **Rhythm-driven** - Everything reacts to beats, not just bass
- ❌ **No curves** - This is geometry, not organic art
- ❌ **No gradients** - Hard color swaps only

Think: **Sci-fi tunnel sequences, VJ visuals, cyberpunk aesthetics**

---

## �️ Controls You Can Play With

Open the control panel (⚙️ icon) to tweak:

- **Node Density** (100-2000) - More nodes = denser visuals (but slower!)
- **Connection Range** (50-300px) - How far nodes connect to each other
- **Color Intensity** (0.5-2.0x) - Crank up those neon colors
- **Beat Sensitivity** (0.3-1.0) - How reactive to beats

**Performance getting choppy?** The system will auto-reduce nodes to keep your FPS smooth.

---

## 🎵 How Audio Becomes Visuals

The system analyzes your audio in real-time and maps it to different visual effects:

| What It Hears | What You See |
|---------------|--------------|
| **Bass** (20-250 Hz) | Tunnel speed, frame pulsing, node size |
| **Mids** (250-4000 Hz) | Polygon complexity, rotation, connections |
| **Highs** (4000-20000 Hz) | Edge flickering, color changes, sparkles |
| **Beat Drops** | Instant transformations, shape changes, chaos! |

---

## 📁 What's Inside?

```
CursorCam/
├── index.html          # The main page
├── styles.css          # Dark theme + neon glow
├── main.js             # Runs the whole show
├── audio/              # Audio analysis magic
│   ├── AudioEngine.js
│   └── BeatDetector.js
├── constellation/      # Network/node system
│   ├── Node.js
│   ├── Edge.js
│   └── NetworkManager.js
├── renderer/           # Drawing to canvas
│   ├── CanvasRenderer.js
│   └── ColorSystem.js
├── patterns/           # Visual modes (THIS IS WHERE THE MAGIC HAPPENS!)
│   ├── PatternBase.js
│   ├── StaticConstellation.js
│   ├── PulsingMesh.js
│   ├── PolygonEmergence.js
│   ├── StereoSplit.js
│   ├── NeonTunnel.js
│   └── StrobeDiamondTunnel.js  ← The newest kid!
└── ui/
    └── PerformanceMonitor.js
```

---

## �️ Tech Stack

**Built with:**
- Pure JavaScript (no frameworks!)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for FFT analysis
- Canvas 2D API for rendering
- Lots of coffee ☕

**Performance:**
- Target: 60 FPS with 500-1000 nodes
- Spatial grid optimization (no brute-force searching!)
- Auto quality adjustment when things get slow

---

## 💡 Usage Tips

**Choosing Patterns:**
- 🎹 Ambient/calm music? → **Static Constellation**
- 🔊 EDM/electronic/dubstep? → **Strobe Diamond Tunnel** (prepare for visual assault!)
- 🎵 House/techno? → **Neon Tunnel** or **Pulsing Mesh**
- 🎸 Rock/complex music? → **Polygon Emergence**
- 🎧 Stereo tracks? → **Stereo Split**

**Adjusting Sensitivity:**
- Music too quiet? → Lower beat sensitivity
- Music too loud/dynamic? → Crank it up!

**Performance:**
- Laggy? → Reduce node density
- Want more chaos? → Increase connection range

---

## � What's Coming Next?

This is a **learning project**, so expect:

- ✨ **More patterns!** (Particle systems? 3D shapes? Who knows!)
- 🎨 **Better existing patterns** (improvements as I learn)
- 🎛️ **More controls** (customize everything!)
- 📹 **Maybe video export?** (if I figure it out)
- 🎮 **MIDI controller support?** (wouldn't that be cool?)

**Got ideas?** I'm all ears! This is a journey, and it's just getting started.

---

## 🌐 Browser Support

- ✅ Chrome/Edge - Works great!
- ✅ Firefox - Fully supported!
- ⚠️ Safari - Needs localhost or HTTPS

---

## 📜 License

MIT License - Use it, modify it, learn from it, make it your own!

---

## 🙏 Credits

Built with curiosity and:
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- A lot of experimentation

---

**Made by someone learning real-time graphics and audio programming** 🎨🎵

*This project grows as I grow. Stay tuned for updates!*
