/**
 * Aim Sensitivity Engine v1.0
 * PWA for Android/Chrome/Samsung touch optimization.
 * Features: Bezier/linear curves, pixel lock, speed-based accel/decel, noise reduction.
 */

// Config
const ENGINE_CONFIG = {
  clampPixels: 50, // Trava de X pixels
  speedThresholdLow: 0.5, // pixels/ms weak drag -> decel
  speedThresholdHigh: 3.0, // pixels/ms strong -> lock
  bezierControls: [0.25, 0.1, 0.25, 1.0], // ease-in-out for fluid
  filterWindow: 3, // median filter samples
  maxFPS: 60
};

class AimEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enabled = false;
    this.mode = 'bezier'; // 'bezier' | 'linear'
    
    // State
    this.touches = [];
    this.lastPositions = [];
    this.velocities = { x: 0, y: 0 };
    this.lastTime = 0;
    this.filteredPos = { x: 0, y: 0 };
    this.aimOffset = { x: 0, y: 0 }; // Final smoothed aim delta
    
    // Samsung/Android optimizations
    this.canvas.style.touchAction = 'none';
    this.canvas.style.transform = 'translateZ(0)'; // GPU layer
    
    this.initEvents();
    this.loop();
  }
  
  initEvents() {
    // PointerEvents for precision (Chrome/Android best)
    this.canvas.addEventListener('pointerdown', (e) => this.handleStart(e), { passive: false });
    this.canvas.addEventListener('pointermove', (e) => this.handleMove(e), { passive: false });
    this.canvas.addEventListener('pointerup', (e) => this.handleEnd(e), { passive: false });
    this.canvas.addEventListener('pointercancel', (e) => this.handleEnd(e), { passive: false });
    
    // Prevent context menu/scroll
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  
  handleStart(e) {
    e.preventDefault();
    this.touches = [{ id: e.pointerId, x: e.clientX, y: e.clientY }];
    this.lastPositions = [{ x: e.clientX, y: e.clientY }];
    this.lastTime = performance.now();
  }
  
  handleMove(e) {
    e.preventDefault();
    const now = performance.now();
    const dt = now - this.lastTime;
    
    const touch = this.touches.find(t => t.id === e.pointerId);
    if (touch) {
      touch.x = e.clientX;
      touch.y = e.clientY;
      
      // Calc velocity px/ms
      const dx = touch.x - this.lastPositions[0].x;
      const dy = touch.y - this.lastPositions[0].y;
      const dist = Math.hypot(dx, dy);
      this.velocities = { x: dx / dt, y: dy / dt };
      const speed = Math.hypot(this.velocities.x, this.velocities.y);
      
      // Filter noise (median on window)
      this.lastPositions.unshift({ x: touch.x, y: touch.y });
      if (this.lastPositions.length > ENGINE_CONFIG.filterWindow) {
        this.lastPositions.pop();
      }
      this.filteredPos = this.medianFilter(this.lastPositions);
      
      // Apply sensitivity curve + behavior
      let deltaX = this.filteredPos.x - this.aimOffset.x;
      let deltaY = this.filteredPos.y - this.aimOffset.y;
      
      // Speed-based: decel weak, lock strong
      if (speed < ENGINE_CONFIG.speedThresholdLow) {
        // Decel: scale down
        const decelFactor = speed / ENGINE_CONFIG.speedThresholdLow * 0.3;
        deltaX *= decelFactor;
        deltaY *= decelFactor;
      } else if (speed > ENGINE_CONFIG.speedThresholdHigh) {
        // Lock: clamp to X pixels
        const clampDist = Math.min(Math.hypot(deltaX, deltaY), ENGINE_CONFIG.clampPixels);
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * clampDist;
        deltaY = Math.sin(angle) * clampDist;
      } else {
        // Curve apply
        const inputT = Math.min(Math.hypot(deltaX, deltaY) / 200, 1); // Normalize
        const curveT = this.mode === 'bezier' ? this.bezierEase(inputT) : inputT;
        const scale = curveT / inputT || 1;
        deltaX *= scale;
        deltaY *= scale;
      }
      
      this.aimOffset.x += deltaX * 0.1; // Smooth integration
      this.aimOffset.y += deltaY * 0.1;
      
      this.lastTime = now;
    }
  }
  
  handleEnd(e) {
    e.preventDefault();
    this.touches = this.touches.filter(t => t.id !== e.pointerId);
    if (this.touches.length === 0) {
      this.aimOffset = { x: 0, y: 0 }; // Reset
    }
  }
  
  // Cubic Bezier (Samsung smooth curves)
  bezierEase(t) {
    const [x1, y1, x2, y2] = ENGINE_CONFIG.bezierControls;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    
    const xt = ax * t * t * t + bx * t * t + cx * t;
    return ay * t * t * t + by * t * t + cy * t; // Approx inverse
  }
  
  // Median filter for noise reduction
  medianFilter(points) {
    const xs = points.map(p => p.x).sort((a,b) => a-b);
    const ys = points.map(p => p.y).sort((a,b) => a-b);
    return {
      x: xs[Math.floor(xs.length / 2)],
      y: ys[Math.floor(ys.length / 2)]
    };
  }
  
  loop() {
    if (!this.enabled) {
      requestAnimationFrame(() => this.loop());
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw aim preview (crosshair follow)
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(rect.width/2 + this.aimOffset.x - 20, rect.height/2 + this.aimOffset.y);
    this.ctx.lineTo(rect.width/2 + this.aimOffset.x + 20, rect.height/2 + this.aimOffset.y);
    this.ctx.moveTo(rect.width/2 + this.aimOffset.x, rect.height/2 + this.aimOffset.y - 20);
    this.ctx.lineTo(rect.width/2 + this.aimOffset.x, rect.height/2 + this.aimOffset.y + 20);
    this.ctx.stroke();
    
    // FPS limit
    setTimeout(() => requestAnimationFrame(() => this.loop()), 1000 / ENGINE_CONFIG.maxFPS);
  }
  
  enable() { this.enabled = true; }
  disable() { this.enabled = false; this.aimOffset = { x: 0, y: 0 }; }
  setMode(mode) { this.mode = mode; }
  setClamp(pixels) { ENGINE_CONFIG.clampPixels = pixels; }
  getStatus() { return { offset: this.aimOffset, velocity: this.velocities }; }
}

// Global init
let aimEngine;
function initEngine(canvasId = 'aimCanvas') {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    canvas.width = 400;
    canvas.height = 400;
    aimEngine = new AimEngine(canvas);
    return aimEngine;
  }
  throw new Error('Canvas not found');
}

// Export for bundle/UI
window.AimEngine = { init: initEngine };

console.log('Aim Sensitivity Engine loaded - Samsung/Android optimized');
