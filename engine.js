// engine.js - Core Aim Sensitivity Engine
// Bezier curves, linear sens, pixel trava, velocity lock/decel, touch noise filter
// Optimized for Chrome/Android/Samsung touch (240Hz, jitter reduction)

class SensitivityEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;
    
    // Engine params
    this.sensBezier = [0.25, 0.1, 0.25, 1.0]; // Smooth accel curve
    this.sensLinear = 0.8;
    this.travaPixels = 50; // Max delta per frame
    this.velThreshSlow = 2.0; // px/frame decel
    this.velThreshFast = 15.0; // px/frame lock
    this.noiseFilterSize = 5; // Rolling avg
    
    // State
    this.touchHistory = [];
    this.lastPos = {x: 0, y: 0};
    this.vel = {x: 0, y: 0};
    this.crosshair = {x: this.width/2, y: this.height/2};
    this.target = {x: Math.random()*this.width, y: Math.random()*this.height, r: 30, hit: false};
    
    // Features
    this.recoilControl = false;
    this.sensAdjust = true;
    this.aimStability = true;
    
    this.initTouch();
    this.loop();
  }
  
  // Bezier curve eval (cubic)
  bezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
  }
  
  // Apply sens curve to delta
  applySensitivity(delta) {
    if (!this.sensAdjust) return delta * this.sensLinear;
    
    const normDelta = Math.min(Math.abs(delta) / this.travaPixels, 1);
    const curved = this.bezier(normDelta, 0, this.sensBezier[0], this.sensBezier[1], 1) * Math.sign(delta);
    return curved * this.travaPixels;
  }
  
  // Noise filter: rolling avg
  filterTouch(pos) {
    this.touchHistory.push(pos);
    if (this.touchHistory.length > this.noiseFilterSize) {
      this.touchHistory.shift();
    }
    const avg = this.touchHistory.reduce((a, b) => ({x: a.x + b.x, y: a.y + b.y}), {x:0,y:0});
    avg.x /= this.touchHistory.length;
    avg.y /= this.touchHistory.length;
    return avg;
  }
  
  // Velocity control
  controlVelocity(dx, dy) {
    const speed = Math.sqrt(dx*dx + dy*dy);
    if (speed < this.velThreshSlow) {
      // Decel: lerp to center
      dx *= 0.3;
      dy *= 0.3;
    } else if (speed > this.velThreshFast) {
      // Lock: clamp
      dx = 0;
      dy = 0;
    }
    return {x: dx, y: dy};
  }
  
  initTouch() {
    // Passive touch for Chrome/Android perf, Samsung smooth
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.updateTouch(e.touches[0]);
    }, {passive: false});
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.updateTouch(e.touches[0]);
    }, {passive: false});
    
    // Pointer events for precision
    this.canvas.addEventListener('pointermove', (e) => {
      this.updateTouch({clientX: e.clientX, clientY: e.clientY});
    });
  }
  
  updateTouch(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const rawPos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    // Filter noise
    const filtered = this.filterTouch(rawPos);
    
    // Delta
    const dx = filtered.x - this.lastPos.x;
    const dy = filtered.y - this.lastPos.y;
    this.lastPos = filtered;
    
    // Velocity control
    const controlled = this.controlVelocity(dx, dy);
    
    // Sens
    const sensDx = this.applySensitivity(controlled.x);
    const sensDy = this.applySensitivity(controlled.y);
    
    // Update crosshair
    this.crosshair.x += sensDx;
    this.crosshair.y += sensDy;
    
    // Clamp to bounds
    this.crosshair.x = Math.max(0, Math.min(this.width, this.crosshair.x));
    this.crosshair.y = Math.max(0, Math.min(this.height, this.crosshair.y));
    
    // Check hit
    const dist = Math.sqrt((this.crosshair.x - this.target.x)**2 + (this.crosshair.y - this.target.y)**2);
    this.target.hit = dist < this.target.r;
  }
  
  loop() {
    // RAF sync with touch frames
    requestAnimationFrame(() => this.loop());
    
    // Clear
    this.ctx.fillStyle = 'rgba(13,13,21,0.95)';
    this.ctx.fillRect(0,0,this.width,this.height);
    
    // Target
    this.ctx.fillStyle = this.target.hit ? '#00ff88' : '#ff2d75';
    this.ctx.beginPath();
    this.ctx.arc(this.target.x, this.target.y, this.target.r, 0, Math.PI*2);
    this.ctx.fill();
    
    // Crosshair
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - 20, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + 20, this.crosshair.y);
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 20);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 20);
    this.ctx.stroke();
    
    // Status
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Segoe UI';
    this.ctx.fillText(`Engine: 100% | Vel: ${Math.sqrt(this.vel.x**2 + this.vel.y**2).toFixed(1)}`, 10, 30);
    
    // Respawn target if hit
    if (this.target.hit) {
      this.target.x = Math.random() * this.width;
      this.target.y = Math.random() * this.height;
    }
  }
  
  // Toggle features from UI
  toggleRecoil(on) { this.recoilControl = on; }
  toggleSens(on) { this.sensAdjust = on; }
  toggleAim(on) { this.aimStability = on; }
}

// Global engine instance
let engine;

// Init on load
window.addEventListener('load', () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);
  
  engine = new SensitivityEngine(canvas);
  
  // SW register
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'));
  }
});
