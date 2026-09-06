// FxSound Mobile - Web Audio Engine
// Implements: 10-band EQ, Bass Boost, Clarity (harmonic excitation),
// Ambience (reverb), Surround (stereo widen/Haas), Dynamic Boost (compressor),
// Volume Leveling, Master Gain, Balance, Spectrum analyzer.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.audioEl = document.getElementById("audio");
    this.initialized = false;
    this.powerOn = true;
    this.analyser = null;
    this.spectrumData = null;

    // Effect state (0-10 for effects, dB for EQ, etc.)
    this.state = {
      effects: { fidelity: 5, ambience: 3, surround: 4, dynamicBoost: 4, bass: 5 },
      eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      master: { masterGain: 0, volumeLeveling: 0, filterQ: 1, balance: 0 }
    };
  }

  async init() {
    if (this.initialized) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.spectrumData = new Uint8Array(this.analyser.frequencyBinCount);

    // ---- Build signal chain ----
    // source -> inputGain -> eq[10] -> bass -> fidelity -> ambienceWet -> surround -> dynamicBoost -> volLeveling -> masterGain -> balance -> analyser -> destination

    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.value = 1;

    // 10-band EQ (peaking filters)
    this.eqFilters = [];
    for (let i = 0; i < 10; i++) {
      const f = this.ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = EQ_BANDS[i];
      f.Q.value = 1;
      f.gain.value = 0;
      this.eqFilters.push(f);
    }

    // Bass boost (low shelf)
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = "lowshelf";
    this.bassFilter.frequency.value = 120;
    this.bassFilter.gain.value = 0;

    // Clarity / Fidelity (high shelf + waveshaper)
    this.clarityShaper = this.ctx.createWaveShaper();
    this.clarityShaper.curve = this._makeFidelityCurve(0);
    this.clarityShaper.oversample = "2x";
    this.highShelf = this.ctx.createBiquadFilter();
    this.highShelf.type = "highshelf";
    this.highShelf.frequency.value = 6000;
    this.highShelf.gain.value = 0;

    // Ambience (reverb) - convolver with generated impulse
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this._generateImpulse(2.5, 2.5);
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0;
    this.ambienceDry = this.ctx.createGain();
    this.ambienceDry.gain.value = 1;

    // Surround: mid/side stereo widener + Haas effect
    this.splitter = this.ctx.createChannelSplitter(2);
    this.merger = this.ctx.createChannelMerger(2);
    this.midSum = this.ctx.createGain();       // mid = L + R
    this.sideSum = this.ctx.createGain();       // side = L - R
    this.sideInvert = this.ctx.createGain();    // invert R for side encoding
    this.sideInvert.gain.value = -1;
    this.sideWidth = this.ctx.createGain();     // width control on side
    this.sideWidth.gain.value = 1;
    this.sideNeg = this.ctx.createGain();       // invert side for R channel
    this.sideNeg.gain.value = -1;
    // Haas delay (subtle) for extra spatial depth
    this.haasDelay = this.ctx.createDelay(0.05);
    this.haasDelay.delayTime.value = 0.018;
    this.haasGain = this.ctx.createGain();
    this.haasGain.gain.value = 0;

    // Dynamic boost (compressor + makeup)
    this.dynamicComp = this.ctx.createDynamicsCompressor();
    this.dynamicComp.threshold.value = -24;
    this.dynamicComp.knee.value = 30;
    this.dynamicComp.ratio.value = 4;
    this.dynamicComp.attack.value = 0.005;
    this.dynamicComp.release.value = 0.18;
    this.dynamicMakeup = this.ctx.createGain();
    this.dynamicMakeup.gain.value = 1;
    this.dynamicDry = this.ctx.createGain();
    this.dynamicDry.gain.value = 1;

    // Volume leveling (gentle compressor)
    this.levelComp = this.ctx.createDynamicsCompressor();
    this.levelComp.threshold.value = -10;
    this.levelComp.knee.value = 40;
    this.levelComp.ratio.value = 1.5;
    this.levelComp.attack.value = 0.01;
    this.levelComp.release.value = 0.3;
    this.levelGain = this.ctx.createGain();
    this.levelGain.gain.value = 0;

    // Master gain & balance
    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.value = 1;
    this.balancePanner = this.ctx.createStereoPanner();
    this.balancePanner.pan.value = 0;

    // ---- Wire everything ----
    // EQ chain
    let node = this.inputGain;
    for (const f of this.eqFilters) {
      node.connect(f);
      node = f;
    }
    node.connect(this.bassFilter);

    // Bass -> clarity path
    this.bassFilter.connect(this.clarityShaper);
    this.clarityShaper.connect(this.highShelf);

    // Ambience: split dry + wet (reverb)
    this.highShelf.connect(this.ambienceDry);
    this.highShelf.connect(this.convolver);
    this.convolver.connect(this.ambienceGain);

    // Merge ambience dry+wet
    this.ambienceSum = this.ctx.createGain();
    this.ambienceDry.connect(this.ambienceSum);
    this.ambienceGain.connect(this.ambienceSum);

    // Surround: M/S stereo widener + Haas
    this.ambienceSum.connect(this.splitter);
    // Encode mid = L + R, side = L - R
    this.splitter.connect(this.midSum, 0);   // L -> mid
    this.splitter.connect(this.midSum, 1);   // R -> mid
    this.splitter.connect(this.sideSum, 0);  // L -> side
    this.splitter.connect(this.sideInvert, 1); // R -> -R
    this.sideInvert.connect(this.sideSum);     // side = L - R
    // Width control on side signal
    this.sideSum.connect(this.sideWidth);
    this.sideWidth.connect(this.sideNeg);
    // Decode: L = mid + side*width, R = mid - side*width
    this.midSum.connect(this.merger, 0, 0);   // mid -> L
    this.midSum.connect(this.merger, 0, 1);   // mid -> R
    this.sideWidth.connect(this.merger, 0, 0); // +side -> L
    this.sideNeg.connect(this.merger, 0, 1);   // -side -> R
    // Haas: subtle delayed side signal for spatial depth
    this.ambienceSum.connect(this.haasDelay);
    this.haasDelay.connect(this.haasGain);
    this.haasGain.connect(this.merger, 0, 1);

    // Dynamic boost parallel
    this.surroundSum = this.ctx.createGain();
    this.merger.connect(this.surroundSum);
    this.surroundSum.connect(this.dynamicDry);
    this.surroundSum.connect(this.dynamicComp);
    this.dynamicComp.connect(this.dynamicMakeup);
    this.dynamicSum = this.ctx.createGain();
    this.dynamicDry.connect(this.dynamicSum);
    this.dynamicMakeup.connect(this.dynamicSum);

    // Volume leveling (gentle serial compressor with makeup)
    this.dynamicSum.connect(this.levelComp);
    this.levelComp.connect(this.levelGain);

    // Master -> balance -> analyser -> destination
    this.levelGain.connect(this.masterGainNode);
    this.masterGainNode.connect(this.balancePanner);
    this.balancePanner.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Connect audio element source
    this.source = this.ctx.createMediaElementSource(this.audioEl);
    this.source.connect(this.inputGain);

    this.initialized = true;
    this.applyAll();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  // ---- Effect setters ----
  setEffect(id, value) {
    this.state.effects[id] = value;
    switch (id) {
      case "fidelity":
        this.clarityShaper.curve = this._makeFidelityCurve(value / 10);
        this.highShelf.gain.value = (value / 10) * 8;
        break;
      case "ambience":
        this.ambienceGain.gain.value = value / 10;
        break;
      case "surround": {
        const w = value / 10;
        // width: 1 = original stereo, >1 = widened, 0 = mono
        this.sideWidth.gain.value = 1 + w * 0.8;
        this.haasGain.gain.value = w * 0.25;
        break;
      }
      case "dynamicBoost": {
        const amt = value / 10;
        // More boost = more compression + makeup gain (parallel comp)
        this.dynamicComp.threshold.value = -10 - amt * 20;
        this.dynamicComp.ratio.value = 3 + amt * 7;
        this.dynamicMakeup.gain.value = 1 + amt * 0.5;
        this.dynamicDry.gain.value = 1 - amt * 0.3;
        break;
      }
      case "bass":
        this.bassFilter.gain.value = (value / 10) * 14;
        break;
    }
  }

  setEqBand(band, dB) {
    this.state.eq[band] = dB;
    this.eqFilters[band].gain.value = dB;
  }

  setFilterQ(q) {
    this.state.master.filterQ = q;
    for (const f of this.eqFilters) f.Q.value = q;
  }

  setMasterGain(dB) {
    this.state.master.masterGain = dB;
    this.masterGainNode.gain.value = Math.pow(10, dB / 20);
  }

  setVolumeLeveling(dB) {
    this.state.master.volumeLeveling = dB;
    this.levelGain.gain.value = Math.pow(10, dB / 20);
  }

  setBalance(v) {
    this.state.master.balance = v;
    this.balancePanner.pan.value = v;
  }

  applyAll() {
    for (const e in this.state.effects) this.setEffect(e, this.state.effects[e]);
    for (let i = 0; i < 10; i++) this.setEqBand(i, this.state.eq[i]);
    this.setFilterQ(this.state.master.filterQ);
    this.setMasterGain(this.state.master.masterGain);
    this.setVolumeLeveling(this.state.master.volumeLeveling);
    this.setBalance(this.state.master.balance);
  }

  loadPreset(preset) {
    this.state.effects = { ...preset.effects };
    this.state.eq = [...preset.eq];
    this.state.master = { ...preset.master };
    this.applyAll();
  }

  setPower(on) {
    this.powerOn = on;
    if (!this.initialized) return;
    if (on) {
      // Restore saved state
      if (this._savedState) {
        this.state = this._savedState;
        this._savedState = null;
      }
      this.applyAll();
    } else {
      // Save current state, then mute
      this._savedState = JSON.parse(JSON.stringify(this.state));
      this.masterGainNode.gain.value = 0;
    }
  }

  // ---- Helpers ----
  _makeFidelityCurve(amount) {
    const n = 1024;
    const curve = new Float32Array(n);
    const k = amount * 20;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // soft harmonic saturation
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  }

  _generateImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  getSpectrum() {
    if (!this.analyser) return new Float32Array(0);
    this.analyser.getByteFrequencyData(this.spectrumData);
    return this.spectrumData;
  }
}
