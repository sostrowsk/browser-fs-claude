/**
 * HUD - Heads-up display and cockpit instruments
 */
export class HUD {
  constructor() {
    this.elements = {
      speed: document.getElementById('hud-speed'),
      heading: document.getElementById('hud-heading'),
      altitude: document.getElementById('hud-altitude'),
      vspeed: document.getElementById('hud-vspeed'),
      throttle: document.getElementById('hud-throttle'),
      gear: document.getElementById('hud-gear'),
      flaps: document.getElementById('hud-flaps'),
      warnings: document.getElementById('hud-warnings'),
      cameraMode: document.getElementById('camera-mode-label'),
    };

    // Instrument canvases
    this.attitudeCanvas = document.getElementById('attitude-indicator');
    this.compassCanvas = document.getElementById('compass-indicator');
    this.altimeterCanvas = document.getElementById('altimeter-indicator');
    this.vsiCanvas = document.getElementById('vsi-indicator');

    this.attitudeCtx = this.attitudeCanvas?.getContext('2d');
    this.compassCtx = this.compassCanvas?.getContext('2d');
    this.altimeterCtx = this.altimeterCanvas?.getContext('2d');
    this.vsiCtx = this.vsiCanvas?.getContext('2d');

    this.stallWarningEl = document.getElementById('stall-warning');
  }

  update(physics) {
    const state = physics.state;

    // Speed (knots)
    const spdKts = physics.getAirspeedKnots();
    this.elements.speed.textContent = Math.round(spdKts);

    // Heading
    this.elements.heading.textContent = String(Math.round(state.heading)).padStart(3, '0');

    // Altitude (feet)
    const altFt = physics.getAltitudeFeet();
    this.elements.altitude.textContent = Math.round(altFt).toLocaleString();

    // Vertical speed (fpm)
    const vsFPM = physics.getVerticalSpeedFPM();
    this.elements.vspeed.textContent = (vsFPM >= 0 ? '+' : '') + Math.round(vsFPM);

    // Throttle bar
    if (this.elements.throttle) {
      this.elements.throttle.style.width = `${state.throttle * 100}%`;
    }

    // Gear
    this.elements.gear.textContent = state.gear ? 'DOWN' : 'UP';
    this.elements.gear.style.color = state.gear ? '#4fc3f7' : '#ff9800';

    // Flaps
    const flapDeg = [0, 10, 20, 40][state.flaps] || 0;
    this.elements.flaps.textContent = flapDeg + '°';

    // Stall warning
    if (this.stallWarningEl) {
      this.stallWarningEl.classList.toggle('hidden', !state.isStalling);
    }

    // Warnings
    this._updateWarnings(state, spdKts, altFt);

    // Instruments
    this._drawAttitudeIndicator(state);
    this._drawCompass(state.heading);
    this._drawAltimeter(altFt);
    this._drawVSI(vsFPM);
  }

  _updateWarnings(state, spdKts, altFt) {
    const warnings = [];

    if (state.stallWarning && !state.isStalling) {
      warnings.push('STALL WARNING');
    }
    if (altFt < 500 && altFt > 0 && state.verticalSpeed < -3) {
      warnings.push('PULL UP');
    }
    if (!state.gear && altFt < 300 && state.verticalSpeed < -1) {
      warnings.push('GEAR');
    }
    if (spdKts > 350 && state.gear) {
      warnings.push('OVERSPEED');
    }

    this.elements.warnings.innerHTML = warnings
      .map(w => `<div class="warning-text">${w}</div>`)
      .join('');
  }

  _drawAttitudeIndicator(state) {
    const ctx = this.attitudeCtx;
    if (!ctx) return;
    const w = 200, h = 200, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.clip();

    // Rotate for roll
    ctx.translate(cx, cy);
    ctx.rotate(-state.roll);

    // Pitch offset
    const pitchPx = (state.pitch * 180 / Math.PI) * 2;

    // Sky
    ctx.fillStyle = '#2962ff';
    ctx.fillRect(-100, -200 + pitchPx, 200, 200);

    // Ground
    ctx.fillStyle = '#795548';
    ctx.fillRect(-100, pitchPx, 200, 200);

    // Horizon line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-100, pitchPx);
    ctx.lineTo(100, pitchPx);
    ctx.stroke();

    // Pitch ladder
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';

    for (let deg = -40; deg <= 40; deg += 10) {
      if (deg === 0) continue;
      const y = pitchPx - deg * 2;
      const lineW = deg % 20 === 0 ? 30 : 15;
      ctx.beginPath();
      ctx.moveTo(-lineW, y);
      ctx.lineTo(lineW, y);
      ctx.stroke();
      if (deg % 20 === 0) {
        ctx.fillText(String(Math.abs(deg)), lineW + 12, y + 3);
      }
    }

    ctx.restore();

    // Fixed aircraft reference (center dot and wings)
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy);
    ctx.lineTo(cx - 10, cy);
    ctx.lineTo(cx - 10, cy + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.lineTo(cx + 10, cy + 6);
    ctx.stroke();
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Roll indicator triangle at top
    ctx.save();
    ctx.translate(cx, cy);

    // Roll scale marks
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (const deg of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
      ctx.save();
      ctx.rotate(deg * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, -85);
      ctx.lineTo(0, deg % 30 === 0 ? -78 : -80);
      ctx.stroke();
      ctx.restore();
    }

    // Bank pointer
    ctx.rotate(-state.roll);
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.moveTo(0, -82);
    ctx.lineTo(-5, -75);
    ctx.lineTo(5, -75);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Outer ring
    ctx.strokeStyle = 'rgba(79,195,247,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawCompass(heading) {
    const ctx = this.compassCtx;
    if (!ctx) return;
    const w = 160, h = 160, cx = w / 2, cy = h / 2, r = 65;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-heading * Math.PI / 180);

    // Tick marks and labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = 0; deg < 360; deg += 10) {
      ctx.save();
      ctx.rotate(deg * Math.PI / 180);

      if (deg % 30 === 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(0, -r + 12);
        ctx.stroke();

        ctx.fillStyle = '#4fc3f7';
        ctx.font = 'bold 12px sans-serif';
        const labels = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
        const text = labels[deg] || String(deg / 10);
        ctx.fillText(text, 0, -r + 24);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(0, -r + 6);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    // Heading pointer (top)
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 3);
    ctx.lineTo(cx - 5, cy - r - 10);
    ctx.lineTo(cx + 5, cy - r - 10);
    ctx.closePath();
    ctx.fill();

    // Heading value
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.round(heading)).padStart(3, '0') + '°', cx, cy + 5);

    // Outer ring
    ctx.strokeStyle = 'rgba(79,195,247,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawAltimeter(altFt) {
    const ctx = this.altimeterCtx;
    if (!ctx) return;
    const w = 160, h = 160, cx = w / 2, cy = h / 2, r = 65;
    ctx.clearRect(0, 0, w, h);

    // Hundreds pointer
    const hundredsAngle = ((altFt % 1000) / 1000) * Math.PI * 2 - Math.PI / 2;
    // Thousands pointer
    const thousandsAngle = ((altFt % 10000) / 10000) * Math.PI * 2 - Math.PI / 2;

    // Dial marks
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2 - Math.PI / 2;
      const inner = i % 5 === 0 ? r - 12 : r - 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(String(i), cx + Math.cos(angle) * (r - 20), cy + Math.sin(angle) * (r - 20));
    }

    // Thousands hand (short, thick)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(thousandsAngle) * 30, cy + Math.sin(thousandsAngle) * 30);
    ctx.stroke();

    // Hundreds hand (long, thin)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hundredsAngle) * (r - 15), cy + Math.sin(hundredsAngle) * (r - 15));
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Digital readout
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(Math.round(altFt).toLocaleString() + ' ft', cx, cy + r + 10);

    // Label
    ctx.fillStyle = 'rgba(79,195,247,0.5)';
    ctx.font = '9px sans-serif';
    ctx.fillText('ALT', cx, cy - r - 6);

    // Outer ring
    ctx.strokeStyle = 'rgba(79,195,247,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawVSI(vsFPM) {
    const ctx = this.vsiCtx;
    if (!ctx) return;
    const w = 160, h = 160, cx = w / 2, cy = h / 2, r = 65;
    ctx.clearRect(0, 0, w, h);

    // VSI range: -2000 to +2000 fpm
    const maxVS = 2000;
    const clampedVS = Math.max(-maxVS, Math.min(maxVS, vsFPM));
    const angle = (clampedVS / maxVS) * Math.PI * 0.8; // ±0.8π range

    // Scale marks
    const steps = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const vs of steps) {
      const a = (vs / maxVS) * Math.PI * 0.8 - Math.PI / 2;
      ctx.strokeStyle = vs === 0 ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = vs === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px sans-serif';
      const label = vs === 0 ? '0' : (vs > 0 ? '+' : '') + (vs / 1000);
      ctx.fillText(label, cx + Math.cos(a) * (r - 20), cy + Math.sin(a) * (r - 20));
    }

    // Needle
    const needleAngle = angle - Math.PI / 2;
    ctx.strokeStyle = vsFPM >= 0 ? '#4fc3f7' : '#ff5252';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (r - 12), cy + Math.sin(needleAngle) * (r - 12));
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Digital readout
    ctx.fillStyle = vsFPM >= 0 ? '#4fc3f7' : '#ff5252';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText((vsFPM >= 0 ? '+' : '') + Math.round(vsFPM) + ' fpm', cx, cy + r + 10);

    // Label
    ctx.fillStyle = 'rgba(79,195,247,0.5)';
    ctx.font = '9px sans-serif';
    ctx.fillText('VS', cx, cy - r - 6);

    // Outer ring
    ctx.strokeStyle = 'rgba(79,195,247,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  setCameraMode(name) {
    if (this.elements.cameraMode) {
      this.elements.cameraMode.textContent = name;
    }
  }
}
