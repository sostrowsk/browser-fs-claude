/**
 * AudioEngine - Web Audio API based dynamic sound system
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.engineGain = null;
    this.windGain = null;
    this.cockpitGain = null;

    this.engineOsc = null;
    this.engineOsc2 = null;
    this.windNoise = null;

    this.volumes = {
      master: 0.5,
      engine: 0.7,
      wind: 0.5,
      cockpit: 0.6,
    };

    this.initialized = false;
    this.stallWarningOsc = null;
    this.stallWarningActive = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volumes.master;
      this.masterGain.connect(this.ctx.destination);

      // Engine channel
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineGain.connect(this.masterGain);

      // Wind channel
      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0;
      this.windGain.connect(this.masterGain);

      // Cockpit channel
      this.cockpitGain = this.ctx.createGain();
      this.cockpitGain.gain.value = 0;
      this.cockpitGain.connect(this.masterGain);

      this._createEngineSound();
      this._createWindSound();
      this._createStallWarning();

      this.initialized = true;
    } catch (e) {
      console.warn('AudioEngine: Could not initialize Web Audio API', e);
    }
  }

  _createEngineSound() {
    // Primary engine oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 400;
    engineFilter.Q.value = 2;
    this.engineFilter = engineFilter;

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineOsc.start();

    // Secondary harmonic
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'square';
    this.engineOsc2.frequency.value = 160;

    const eng2Gain = this.ctx.createGain();
    eng2Gain.gain.value = 0.3;

    this.engineOsc2.connect(eng2Gain);
    eng2Gain.connect(engineFilter);
    this.engineOsc2.start();
  }

  _createWindSound() {
    // Wind: filtered noise
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = buffer;
    this.windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 500;
    windFilter.Q.value = 0.5;
    this.windFilter = windFilter;

    this.windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windNoise.start();
  }

  _createStallWarning() {
    this.stallWarningOsc = this.ctx.createOscillator();
    this.stallWarningOsc.type = 'square';
    this.stallWarningOsc.frequency.value = 600;

    this.stallWarningGain = this.ctx.createGain();
    this.stallWarningGain.gain.value = 0;

    this.stallWarningOsc.connect(this.stallWarningGain);
    this.stallWarningGain.connect(this.cockpitGain);
    this.stallWarningOsc.start();
  }

  update(physicsState) {
    if (!this.initialized || !this.ctx) return;

    // Resume context if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const rpm = physicsState.engineRPM;
    const speed = physicsState.airspeed;
    const maxSpeed = 200; // rough normalization

    // Engine sound
    const baseFreq = 60 + rpm * 180; // 60-240 Hz
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, this.ctx.currentTime, 0.05);

    const engineVol = rpm * this.volumes.engine * 0.5;
    this.engineGain.gain.setTargetAtTime(engineVol, this.ctx.currentTime, 0.05);
    this.engineFilter.frequency.setTargetAtTime(200 + rpm * 600, this.ctx.currentTime, 0.05);

    // Wind sound
    const windIntensity = Math.min(speed / maxSpeed, 1);
    const windVol = windIntensity * this.volumes.wind * 0.4;
    this.windGain.gain.setTargetAtTime(windVol, this.ctx.currentTime, 0.1);
    this.windFilter.frequency.setTargetAtTime(300 + windIntensity * 2000, this.ctx.currentTime, 0.1);

    // Stall warning
    if (physicsState.stallWarning && !this.stallWarningActive) {
      this.stallWarningActive = true;
      this.stallWarningGain.gain.setTargetAtTime(0.3 * this.volumes.cockpit, this.ctx.currentTime, 0.01);
    } else if (!physicsState.stallWarning && this.stallWarningActive) {
      this.stallWarningActive = false;
      this.stallWarningGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
    }
  }

  setVolume(channel, value) {
    this.volumes[channel] = value;
    if (channel === 'master' && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }
  }

  playClickSound() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.value = 0.15 * this.volumes.cockpit;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playGearSound() {
    if (!this.initialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    gain.gain.value = 0.2 * this.volumes.cockpit;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.stop(this.ctx.currentTime + 0.7);
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
