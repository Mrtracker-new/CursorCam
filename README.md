# 🎵 CursorCam - Music-Reactive Visual Engine

> Your music deserves to look as good as it sounds.

CursorCam transforms audio into mesmerizing visual art in real-time. Think of it as your music's personal light show artist that never takes a break (or asks for a raise).

## ✨ What Makes It Special?

- **10 Visual Modes** - From zen meditative vibes to full cyber-aggressive chaos
- **Deep Audio Intelligence** - We're talking sub-bass detection at 20-60 Hz 🔊
- **Actually Music-Reactive** - Every pixel moves for a reason, not randomly (we promise!)
- **Runs in Your Browser** - No installation needed, just vibes

## 🎨 The Visual Modes

**Chill Vibes** 🧘
- **Minimal Calm** - For when you're meditating or pretending to
- **Pulsing Mesh** - Your heartbeat, but cooler
- **Polygon Emergence** - Sacred geometry energy

**Classic DJ Tools** 🎵
- **Waveform Spectrum** - The OG frequency bars (64 of them!)
- **Stereo Split** - Left ear vs right ear, visualized
- **Particle Energy** - 300 glowing particles with trail effects ✨

**Tunnel Vision** 🌀
- **Neon Tunnel** - Fast & fluid
- **Strobe Diamond** - VJ-ready geometric madness
- **Hyperspace Tunnel** - Full 3D with wireframes & particles (21 FPS of pure art)

**Maximum Intensity** ⚡
- **Aggressive Cyber** - Camera shake, glitch effects, scan lines. Your bass drops deserve this.

## �️ Audio Intelligence

We don't just listen to your music, we *understand* it:

- **Sub-bass** (20-60 Hz) - For those earth-shaking drops
- **Bass** (60-250 Hz) - The heartbeat of your track
- **Mids** (250-2000 Hz) - Where the melody lives
- **Highs** (2000-20000 Hz) - All the sparkly bits

Plus: beat detection, transient detection (for snares & hi-hats), silence detection (we know when to chill), and climax detection (we know when to GO OFF).

## 🚀 Quick Start

```bash
# Clone this bad boy
git clone https://github.com/Mrtracker-new/CursorCam.git

# Fire up a server (Python example)
cd CursorCam
python -m http.server 8000

# Open browser
# Navigate to http://localhost:8000
# Click "Enable Microphone"
# Play some music
# Watch the magic happen ✨
```

## �️ Controls

**Pattern Mode** - Switch between all 10 visual modes  
**Node Density** - More nodes = more connections = more chaos  
**Connection Range** - How far nodes can "see" each other  
**Color Intensity** - Dial up the neon  
**Beat Sensitivity** - How hyped the visuals get on beats

> **Pro tip**: The system auto-optimizes performance. If your FPS drops, it'll reduce node count to keep things smooth.

## � Color Intelligence

Colors react to frequencies:
- **Bass** → Warm (reds, oranges, yellows) 🔥
- **Highs** → Cool (cyans, blues, whites) ❄️
- **Silence** → Desaturated (we get the mood)
- **Energy peaks** → Maximum saturation (LET'S GO!)

No random color cycling here. Every color change is musically justified.

## 🛠️ Tech Stack

- **Three.js** - For the fancy 3D tunnel modes
- **Web Audio API** - FFT analysis at 4096 resolution
- **Canvas 2D** - For the constellation patterns
- **Pure JavaScript** - No framework drama, just vibes

## 📊 Performance

- Average: **48 FPS** across all modes
- Best case: **60 FPS** (most 2D patterns)
- 3D mode: **21 FPS** (still smooth, just chonkier)
- Auto-optimization keeps things running smooth

## � Best Enjoyed With

- Electronic/EDM (for those bass drops)
- Ambient (for the chill modes)
- Rock (balanced across all frequencies)
- Literally any music (we don't judge)

## 🧠 The Nerdy Stuff

**Audio Analysis**:
- 4096-point FFT for frequency separation
- Exponential Moving Average (EMA) for smooth transitions
- Adaptive beat threshold (learns your music's dynamics)
- Peak memory tracking (we remember the good parts)

**Visual Engine**:
- Up to 2000 nodes (auto-optimized)
- 300 particles in Particle Energy mode
- Bloom effects on 3D tunnels
- Trail rendering with alpha blending

## 🎯 Credits

Built with caffeine, bass drops, and an unhealthy obsession with making audio look cool.

**Created by**: [Rolan Lobo](https://github.com/Mrtracker-new)

---

**License**: MIT (Do whatever you want, just make it look good)

**Version**: 2.0 - "The One With Sub-Bass Detection"

🎵 Now stop reading and go make some music look pretty! 🎨
