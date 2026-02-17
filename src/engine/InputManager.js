/**
 * InputManager - Handles keyboard, mouse, gamepad, and touch inputs
 */
export class InputManager {
  constructor() {
    this.keys = {};
    this.gamepadAxes = { pitch: 0, roll: 0, yaw: 0, throttle: -1 };
    this.gamepadConnected = false;
    this.mouseEnabled = false;
    this.mousePitch = 0;
    this.mouseRoll = 0;
    this.sensitivity = {
      pitch: 1.0,
      roll: 1.0,
      yaw: 1.0,
    };
    this.invertPitch = false;

    // Touch state
    this.touchJoystick = { active: false, dx: 0, dy: 0 };
    this.touchThrottle = { active: false, value: 0 };

    // Action events (single press)
    this.actions = {};
    this._actionCallbacks = {};

    this._init();
  }

  _init() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (this.actions[e.code]) return;
      this.actions[e.code] = true;
      const cbs = this._actionCallbacks[e.code];
      if (cbs) cbs.forEach(cb => cb());
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.actions[e.code] = false;
    });

    // Mouse control
    window.addEventListener('mousemove', (e) => {
      if (!this.mouseEnabled) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      this.mouseRoll = ((e.clientX - cx) / cx) * this.sensitivity.roll;
      this.mousePitch = ((e.clientY - cy) / cy) * this.sensitivity.pitch;
      if (this.invertPitch) this.mousePitch *= -1;
      this.mouseRoll = Math.max(-1, Math.min(1, this.mouseRoll));
      this.mousePitch = Math.max(-1, Math.min(1, this.mousePitch));
    });

    // Gamepad
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      console.log('Gamepad connected:', e.gamepad.id);
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });

    // Touch controls
    this._initTouch();
  }

  _initTouch() {
    const isTouchDevice = 'ontouchstart' in window;
    if (!isTouchDevice) return;

    // Create virtual joystick overlay (left side) and throttle (right side)
    const overlay = document.createElement('div');
    overlay.id = 'touch-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:45;pointer-events:none;';
    overlay.innerHTML = `
      <div id="touch-joystick" style="position:absolute;bottom:80px;left:80px;width:120px;height:120px;
        border:2px solid rgba(79,195,247,0.3);border-radius:50%;pointer-events:auto;touch-action:none;">
        <div id="touch-stick" style="position:absolute;top:50%;left:50%;width:40px;height:40px;
          background:rgba(79,195,247,0.4);border-radius:50%;transform:translate(-50%,-50%);"></div>
      </div>
      <div id="touch-throttle-area" style="position:absolute;bottom:80px;right:40px;width:50px;height:200px;
        border:1px solid rgba(79,195,247,0.3);pointer-events:auto;touch-action:none;">
        <div id="touch-throttle-handle" style="position:absolute;bottom:0;width:100%;height:20px;
          background:rgba(79,195,247,0.4);"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const joystick = document.getElementById('touch-joystick');
    const stick = document.getElementById('touch-stick');
    const throttleArea = document.getElementById('touch-throttle-area');
    const throttleHandle = document.getElementById('touch-throttle-handle');

    let joystickTouch = null;
    let throttleTouch = null;

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      joystickTouch = e.changedTouches[0].identifier;
      this.touchJoystick.active = true;
    });

    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.touches) {
        if (touch.identifier === joystickTouch) {
          const rect = joystick.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          let dx = (touch.clientX - cx) / (rect.width / 2);
          let dy = (touch.clientY - cy) / (rect.height / 2);
          dx = Math.max(-1, Math.min(1, dx));
          dy = Math.max(-1, Math.min(1, dy));
          this.touchJoystick.dx = dx;
          this.touchJoystick.dy = dy;
          stick.style.transform = `translate(${-50 + dx * 40}%, ${-50 + dy * 40}%)`;
        }
      }
    });

    joystick.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouch) {
          joystickTouch = null;
          this.touchJoystick.active = false;
          this.touchJoystick.dx = 0;
          this.touchJoystick.dy = 0;
          stick.style.transform = 'translate(-50%, -50%)';
        }
      }
    });

    throttleArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      throttleTouch = e.changedTouches[0].identifier;
      this.touchThrottle.active = true;
    });

    throttleArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.touches) {
        if (touch.identifier === throttleTouch) {
          const rect = throttleArea.getBoundingClientRect();
          let val = 1 - (touch.clientY - rect.top) / rect.height;
          val = Math.max(0, Math.min(1, val));
          this.touchThrottle.value = val;
          throttleHandle.style.bottom = `${val * (rect.height - 20)}px`;
        }
      }
    });

    throttleArea.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === throttleTouch) {
          throttleTouch = null;
          this.touchThrottle.active = false;
        }
      }
    });
  }

  onAction(keyCode, callback) {
    if (!this._actionCallbacks[keyCode]) this._actionCallbacks[keyCode] = [];
    this._actionCallbacks[keyCode].push(callback);
  }

  isPressed(code) {
    return !!this.keys[code];
  }

  pollGamepad() {
    if (!this.gamepadConnected) return;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (!gp) return;

    // Standard mapping: left stick roll/pitch, right stick yaw, triggers throttle
    this.gamepadAxes.roll = this._deadzone(gp.axes[0], 0.1);
    this.gamepadAxes.pitch = this._deadzone(gp.axes[1], 0.1);
    this.gamepadAxes.yaw = this._deadzone(gp.axes[2] || 0, 0.1);

    // Triggers (axes 3 on some gamepads, or buttons 6/7)
    if (gp.buttons[7]) {
      this.gamepadAxes.throttle = gp.buttons[7].value;
    }
  }

  _deadzone(value, zone) {
    if (Math.abs(value) < zone) return 0;
    return (value - Math.sign(value) * zone) / (1 - zone);
  }

  getAxis(axis) {
    // Priority: gamepad > touch > keyboard/mouse
    if (this.gamepadConnected) {
      return this.gamepadAxes[axis] || 0;
    }

    if (this.touchJoystick.active) {
      if (axis === 'roll') return this.touchJoystick.dx * this.sensitivity.roll;
      if (axis === 'pitch') return this.touchJoystick.dy * this.sensitivity.pitch;
    }

    if (this.mouseEnabled) {
      if (axis === 'roll') return this.mouseRoll;
      if (axis === 'pitch') return this.mousePitch;
    }

    // Keyboard
    switch (axis) {
      case 'pitch': {
        let v = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) v -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) v += 1;
        return v * this.sensitivity.pitch * (this.invertPitch ? -1 : 1);
      }
      case 'roll': {
        let v = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) v -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) v += 1;
        return v * this.sensitivity.roll;
      }
      case 'yaw': {
        let v = 0;
        if (this.keys['KeyQ']) v -= 1;
        if (this.keys['KeyE']) v += 1;
        return v * this.sensitivity.yaw;
      }
      default: return 0;
    }
  }

  getThrottle(current) {
    if (this.gamepadConnected && this.gamepadAxes.throttle >= 0) {
      return this.gamepadAxes.throttle;
    }

    if (this.touchThrottle.active) {
      return this.touchThrottle.value;
    }

    // Keyboard: incremental throttle
    let t = current;
    const rate = 0.015; // per frame
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) t += rate;
    if (this.keys['ControlLeft'] || this.keys['ControlRight']) t -= rate;
    return Math.max(0, Math.min(1, t));
  }

  getBrakes() {
    return this.keys['KeyB'] || false;
  }

  dispose() {
    // Clean up if needed
    const overlay = document.getElementById('touch-overlay');
    if (overlay) overlay.remove();
  }
}
