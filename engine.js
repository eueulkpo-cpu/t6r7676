// engine.js - Aim Assist Engine (px trava removed)
// Smooth aim towards closest target, multiple moving enemies, FOV assist
// Optimized for Chrome/Android/Samsung touch (240Hz, noise filter + bezier sens)

class SensitivityEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;
    
    // Visibility control
    this.visible = true;
    this.isPaused = false;
    
    // Engine params - Aim Assist
    this.sensBezier = [0.25, 0.1, 0.25, 1.0]; // Smooth sens curve
    this.sensLinear = 0.8;
    this.noiseFilterSize = 5; // Rolling avg
    
    // Aim Assist params
    this.aimStrength = 0.4;
    this.aimSpeed = 0.12;
    this.fovRadius = 150;
    this.numTargets = 4;
    
    // State
    this.touchHistory = [];
    this.lastPos = {x: 0, y: 0};
    this.vel = {x: 0, y: 0};
    this.crosshair = {x: this.width/2, y: this.height/2};
    
    // Targets array
    this.targets = [];
    for(let i = 0; i < this.numTargets; i++) {
      this.targets.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r: 25 + Math.random() * 15,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        hit: false
      });
    }
    
    // Features
    this.recoilControl = false;
    this.sensAdjust = true;
    this.aimStability = true;
    
    // Overlay style
    this.canvas.style.pointerEvents = 'none';
    
    this.initTouch();
    this.loop();
  }

  
  // Bezier curve eval (cubic)
  bezier(t, p0, p1, p2, p3) {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
  }
  
  // Pure sensitivity (no trava)
  applySensitivity(delta) {
    if (!this.sensAdjust) return delta * this.sensLinear;
    
    const normDelta = Math.min(Math.abs(delta) / 100, 1); // Soft cap
    const curved = this.bezier(normDelta, 0, this.sensBezier[0], this.sensBezier[1], 1) * Math.sign(delta);
    return curved * 100;
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
  
  // Get closest target in FOV
  getClosestTarget() {
    let closest = null;
    let minDist = this.fovRadius;
    const cx = this.crosshair.x;
    const cy = this.crosshair.y;
    for (let target of this.targets) {
      const dx = target.x - cx;
      const dy = target.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDist) {
        minDist = dist;
        closest = {target, dist, dx, dy};
      }
    }
    return closest;
  }
  
  // Compute aim assist vector
  computeAimAssist() {
    if (!this.aimStability) return {x: 0, y: 0};
    const closest = this.getClosestTarget();
    if (!closest) return {x: 0, y: 0};
    
    const distNorm = closest.dist / this.fovRadius;
    const force = this.aimStrength * (1 - distNorm); // Stronger when closer
    const dirX = closest.dx / closest.dist;
    const dirY = closest.dy / closest.dist;
    return {
      x: dirX * force * this.aimSpeed,
      y: dirY * force * this.aimSpeed
    };
  }
  
  initTouch() {
    // Touch for overlay - capture only, passive where possible
    this.canvas.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      this.updateTouch(e.touches[0]);
    }, {passive: true, capture: true});
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.stopPropagation();
      this.updateTouch(e.touches[0]);
    }, {passive: true, capture: true});
    
    // Pointer events for precision (desktop/game)
    this.canvas.addEventListener('pointermove', (e) => {
      e.stopPropagation();
      this.updateTouch({clientX: e.clientX, clientY: e.clientY});
    }, {passive: true});
  }

  
  updateTouch(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const rawPos = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    // Filter noise
    const filtered = this.filterTouch(rawPos);
    
    // Delta from user input
    const dx = filtered.x - this.lastPos.x;
    const dy = filtered.y - this.lastPos.y;
    this.lastPos = filtered;
    this.vel = {x: dx, y: dy};
    
    // Apply sensitivity to user input (no controlVelocity)
    const userDx = this.applySensitivity(dx);
    const userDy = this.applySensitivity(dy);
    
    // Compute aim assist
    const aimDx = this.computeAimAssist().x;
    const aimDy = this.computeAimAssist().y;
    
    // Combine: user + smooth aim
    this.crosshair.x += userDx + aimDx;
    this.crosshair.y += userDy + aimDy;
    
    // Clamp bounds
    this.crosshair.x = Math.max(0, Math.min(this.width, this.crosshair.x));
    this.crosshair.y = Math.max(0, Math.min(this.height, this.crosshair.y));
  }
  
  loop() {
    if (!this.visible || this.isPaused) {
      requestAnimationFrame(() => this.loop());
      return;
    }
    
    // RAF sync with touch frames
    requestAnimationFrame(() => this.loop());
    
    this.ctx.save();
    this.ctx.globalAlpha = this.visible ? 1.0 : 0.0;
    
    // Update targets movement
    this.targets.forEach(target => {
      target.x += target.vx;
      target.y += target.vy;
      // Bounce edges
      if (target.x < target.r || target.x > this.width - target.r) target.vx *= -1;
      if (target.y < target.r || target.y > this.height - target.r) target.vy *= -1;
      // Respawn if 'hit' (close to crosshair)
      const dx = target.x - this.crosshair.x;
      const dy = target.y - this.crosshair.y;
      if (Math.sqrt(dx*dx + dy*dy) < target.r) {
        target.x = Math.random() * this.width;
        target.y = Math.random() * this.height;
        target.vx = (Math.random() - 0.5) * 2;
        target.vy = (Math.random() - 0.5) * 2;
      }
    });
    
    // Clear
    this.ctx.fillStyle = 'rgba(13,13,21,0.95)';
    this.ctx.fillRect(0,0,this.width,this.height);
    
    // Draw targets with distance color
    const closest = this.getClosestTarget();
    this.targets.forEach((target, i) => {
      const dx = target.x - this.crosshair.x;
      const dy = target.y - this.crosshair.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let color = '#ff4444'; // Red far
      if (dist < this.fovRadius * 0.5) color = '#ffaa00'; // Yellow close
      if (dist < target.r) color = '#00ff88'; // Green hit
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.r, 0, Math.PI*2);
      this.ctx.fill();
      
      // Line to closest
      if (target === closest?.target) {
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.crosshair.x, this.crosshair.y);
        this.ctx.lineTo(target.x, target.y);
        this.ctx.stroke();
      }
    });
    
    // Crosshair
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - 25, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + 25, this.crosshair.y);
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 25);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 25);
    this.ctx.stroke();
    
    // Status - add visibility state
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Segoe UI';
    this.ctx.textAlign = 'left';
    const closestDist = closest ? closest.dist.toFixed(0) : '-';
    const aimStatus = this.aimStability ? 'ON' : 'OFF';
    const visStatus = this.visible ? 'VIS' : 'HID';
    this.ctx.fillText(`Aim: ${aimStatus} | Closest: ${closestDist}px | Vel: ${Math.sqrt(this.vel.x**2 + this.vel.y**2).toFixed(1)} | ${visStatus}`, 10, 25);
    this.ctx.textAlign = 'center';
    
    this.ctx.restore();
  }

  
  // Toggle features from UI
  toggleRecoil(on) { this.recoilControl = on; }
  toggleSens(on) { this.sensAdjust = on; }
  toggleAim(on) { this.aimStability = on; }
  
  // Visibility toggle for UI/injection
  toggleVisibility() {
    this.visible = !this.visible;
    return this.visible;
  }
  
  pause(state) {
    this.isPaused = state;
  }
}

// Global engine instance - expose methods
let engine;

// Init on load
window.addEventListener('load', () => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '9999';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);
  
  engine = new SensitivityEngine(canvas);
  window.engine = engine;  // Expose globally
  
  // SW register - relative path
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.warn('SW register failed:', err));
  }
});

