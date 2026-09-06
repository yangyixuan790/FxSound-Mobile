// FxSound Mobile - Main App Controller (System-wide audio via native bridge)

const NATIVE = (typeof window.FxNative !== "undefined") ? window.FxNative : null;

// Fallback for browser testing (logs calls instead of touching native audio)
const NativeBridge = {
  setEffect(id, v) { if (NATIVE) NATIVE.setEffect(id, v); else console.log("[fx] setEffect", id, v); },
  setEqBand(b, db) { if (NATIVE) NATIVE.setEqBand(b, db); else console.log("[fx] setEqBand", b, db); },
  setMasterGain(db) { if (NATIVE) NATIVE.setMasterGain(db); else console.log("[fx] setMasterGain", db); },
  setVolumeLeveling(db) { if (NATIVE) NATIVE.setVolumeLeveling(db); else console.log("[fx] setVolumeLeveling", db); },
  setFilterQ(q) { if (NATIVE) NATIVE.setFilterQ(q); else console.log("[fx] setFilterQ", q); },
  setBalance(v) { if (NATIVE) NATIVE.setBalance(v); else console.log("[fx] setBalance", v); },
  startCapture() { if (NATIVE) NATIVE.startCapture(); else console.log("[fx] startCapture"); },
  stopCapture() { if (NATIVE) NATIVE.stopCapture(); else console.log("[fx] stopCapture"); }
};

const app = {
  currentPreset: 0,
  powerOn: false,
  capturing: false,

  init() {
    i18n.init();
    this.buildLanguageSelector();
    this.buildPresets();
    this.buildEffects();
    this.buildEqualizer();
    this.buildMaster();
    this.bindEvents();
    i18n.onChange(() => this.refreshLabels());
    this.applyPreset(0);
    this.updateUI();

    // Native calls back when capture state changes
    window.__onCaptureState = (active) => this.onCaptureState(active);
  },

  // ---- Language ----
  buildLanguageSelector() { /* same as before */
    const options = document.getElementById("langOptions");
    options.innerHTML = "";
    I18N_LANGS.forEach((l) => {
      const btn = document.createElement("button");
      btn.className = "lang-option" + (l.code === i18n.currentLang ? " active" : "");
      btn.dataset.lang = l.code;
      btn.innerHTML = `<span class="lang-flag">${l.flag}</span><span>${l.label}</span><svg class="lang-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      btn.onclick = () => this.switchLanguage(l.code);
      options.appendChild(btn);
    });
    this.updateLangBadge();
  },
  updateLangBadge() {
    const cur = I18N_LANGS.find((l) => l.code === i18n.currentLang);
    document.getElementById("langBadge").textContent = cur ? cur.flag : "EN";
  },
  switchLanguage(code) {
    i18n.setLang(code);
    this.buildLanguageSelector();
    this.updateLangBadge();
    document.getElementById("langPopover").classList.remove("show");
    this.toast(i18n.t("toast.langChanged"));
  },
  refreshLabels() {
    this.buildPresets();
    this.buildEffects();
    this.buildMaster();
    this.syncControlsFromState();
  },

  // ---- Build UI ----
  buildPresets() {
    const scroll = document.getElementById("presetScroll");
    scroll.innerHTML = "";
    PRESETS.forEach((p, i) => {
      const chip = document.createElement("button");
      chip.className = "preset-chip" + (i === this.currentPreset ? " active" : "");
      chip.textContent = i18n.t(p.nameKey);
      chip.onclick = () => this.applyPreset(i);
      scroll.appendChild(chip);
    });
  },

  buildEffects() {
    const list = document.getElementById("effectsList");
    list.innerHTML = "";
    EFFECTS.forEach((e) => {
      const row = document.createElement("div");
      row.className = "effect-row";
      row.innerHTML = `
        <div class="effect-head">
          <div class="effect-name">
            <span class="effect-icon">${e.icon}</span>
            <span>${i18n.t(e.nameKey)}</span>
          </div>
          <div class="effect-value" id="val-${e.id}">5</div>
        </div>
        <div class="effect-desc">${i18n.t(e.descKey)}</div>
        <input type="range" class="fx-slider" id="slider-${e.id}" min="0" max="10" step="1" value="5" />
      `;
      list.appendChild(row);
      const slider = row.querySelector(`#slider-${e.id}`);
      slider.addEventListener("input", () => {
        const v = parseInt(slider.value);
        document.getElementById(`val-${e.id}`).textContent = v;
        NativeBridge.setEffect(e.id, v);
        this.markPresetModified();
      });
    });
  },

  buildEqualizer() {
    const container = document.getElementById("eqContainer");
    container.innerHTML = "";
    EQ_BANDS.forEach((freq, i) => {
      const band = document.createElement("div");
      band.className = "eq-band";
      band.innerHTML = `
        <div class="eq-gain-label" id="eq-gain-${i}">0</div>
        <input type="range" class="eq-slider" id="eq-${i}" min="-12" max="12" step="0.5" value="0" />
        <div class="eq-freq">${EQ_LABELS[i]}</div>
      `;
      container.appendChild(band);
      const slider = band.querySelector(`#eq-${i}`);
      slider.addEventListener("input", () => {
        const v = parseFloat(slider.value);
        document.getElementById(`eq-gain-${i}`).textContent = v > 0 ? `+${v}` : v;
        NativeBridge.setEqBand(i, v);
        this.markPresetModified();
      });
    });

    document.getElementById("eqFlatBtn").onclick = () => {
      for (let i = 0; i < 10; i++) {
        document.getElementById(`eq-${i}`).value = 0;
        document.getElementById(`eq-gain-${i}`).textContent = "0";
        NativeBridge.setEqBand(i, 0);
      }
      this.markPresetModified();
      this.toast(i18n.t("toast.eqReset"));
    };
  },

  buildMaster() {
    const list = document.getElementById("masterList");
    list.innerHTML = "";
    MASTER_CONTROLS.forEach((m) => {
      const row = document.createElement("div");
      row.className = "effect-row";
      row.innerHTML = `
        <div class="effect-head">
          <div class="effect-name">
            <span class="effect-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
            <span>${i18n.t(m.nameKey)}</span>
          </div>
          <div class="effect-value" id="val-${m.id}">${m.default}${m.unit}</div>
        </div>
        <div class="effect-desc">${i18n.t(m.descKey)}</div>
        <input type="range" class="fx-slider" id="slider-${m.id}" min="${m.min}" max="${m.max}" step="${m.step}" value="${m.default}" />
      `;
      list.appendChild(row);
      const slider = row.querySelector(`#slider-${m.id}`);
      slider.addEventListener("input", () => {
        const v = parseFloat(slider.value);
        let display;
        if (m.id === "balance") {
          if (v === 0) display = i18n.t("balance.center");
          else if (v < 0) display = `${i18n.t("balance.left")}${Math.abs(v).toFixed(1)}`;
          else display = `${i18n.t("balance.right")}${v.toFixed(1)}`;
        } else display = `${v}${m.unit}`;
        document.getElementById(`val-${m.id}`).textContent = display;
        if (m.id === "masterGain") NativeBridge.setMasterGain(v);
        else if (m.id === "volumeLeveling") NativeBridge.setVolumeLeveling(v);
        else if (m.id === "filterQ") NativeBridge.setFilterQ(v);
        else if (m.id === "balance") NativeBridge.setBalance(v);
        this.markPresetModified();
      });
    });
  },

  // ---- Events ----
  bindEvents() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
      };
    });

    document.getElementById("powerBtn").onclick = () => this.togglePower();

    document.getElementById("langBtn").onclick = (e) => {
      e.stopPropagation();
      document.getElementById("langPopover").classList.toggle("show");
    };
    document.addEventListener("click", (e) => {
      const pop = document.getElementById("langPopover");
      const btn = document.getElementById("langBtn");
      if (pop && !pop.contains(e.target) && !btn.contains(e.target)) pop.classList.remove("show");
    });
  },

  // ---- Power / capture ----
  togglePower() {
    this.powerOn = !this.powerOn;
    const btn = document.getElementById("powerBtn");
    btn.classList.toggle("on", this.powerOn);
    if (this.powerOn) {
      NativeBridge.startCapture();
    } else {
      NativeBridge.stopCapture();
      this.onCaptureState(false);
    }
  },

  onCaptureState(active) {
    this.capturing = active;
    document.getElementById("captureIndicator").classList.toggle("active", active);
    const artist = document.getElementById("trackArtist");
    if (active) {
      artist.textContent = i18n.t("track.active");
    } else {
      artist.textContent = i18n.t("track.loadHint");
    }
    if (!active) {
      this.powerOn = false;
      document.getElementById("powerBtn").classList.remove("on");
    }
  },

  applyPreset(index) {
    this.currentPreset = index;
    const p = PRESETS[index];
    document.querySelectorAll(".preset-chip").forEach((c, i) => c.classList.toggle("active", i === index));

    // Push all parameters to native engine
    for (const e in p.effects) NativeBridge.setEffect(e, p.effects[e]);
    for (let i = 0; i < 10; i++) NativeBridge.setEqBand(i, p.eq[i]);
    NativeBridge.setMasterGain(p.master.masterGain);
    NativeBridge.setVolumeLeveling(p.master.volumeLeveling);
    NativeBridge.setFilterQ(p.master.filterQ);
    NativeBridge.setBalance(p.master.balance);

    this.syncControlsFromState(p);
    this.toast(i18n.t("toast.preset", { name: i18n.t(p.nameKey) }));
  },

  syncControlsFromState(p) {
    if (!p) p = PRESETS[this.currentPreset];
    EFFECTS.forEach((e) => {
      const v = p.effects[e.id];
      const slider = document.getElementById(`slider-${e.id}`);
      if (slider) { slider.value = v; document.getElementById(`val-${e.id}`).textContent = v; }
    });
    for (let i = 0; i < 10; i++) {
      const v = p.eq[i];
      const slider = document.getElementById(`eq-${i}`);
      if (slider) { slider.value = v; document.getElementById(`eq-gain-${i}`).textContent = v > 0 ? `+${v}` : v; }
    }
    MASTER_CONTROLS.forEach((m) => {
      const v = p.master[m.id];
      const slider = document.getElementById(`slider-${m.id}`);
      if (slider) {
        slider.value = v;
        let display;
        if (m.id === "balance") {
          if (v === 0) display = i18n.t("balance.center");
          else if (v < 0) display = `${i18n.t("balance.left")}${Math.abs(v).toFixed(1)}`;
          else display = `${i18n.t("balance.right")}${v.toFixed(1)}`;
        } else display = `${v}${m.unit}`;
        document.getElementById(`val-${m.id}`).textContent = display;
      }
    });
  },

  markPresetModified() {
    document.querySelectorAll(".preset-chip").forEach((c) => c.classList.remove("active"));
  },

  updateUI() {
    document.getElementById("powerBtn").classList.toggle("on", this.powerOn);
  },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
};

window.addEventListener("DOMContentLoaded", () => app.init());
