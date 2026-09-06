// FxSound Mobile - Internationalization (i18n) module
// Supports: English, 简体中文, 日本語, Español
// Usage: i18n.t('key') or i18n.t('key', { name: 'value' }) for interpolation

const I18N_LANGS = [
  { code: "en", label: "English", flag: "EN" },
  { code: "zh-CN", label: "简体中文", flag: "中" },
  { code: "ja", label: "日本語", flag: "日" },
  { code: "es", label: "Español", flag: "ES" }
];

const I18N_DICT = {
  en: {
    "brand.subtitle": "Mobile Audio Enhancer",
    "track.noTrack": "System Audio",
    "track.loadHint": "Tap power to capture all device audio",
    "track.active": "Processing all device audio",
    "section.preset": "Preset",
    "tab.effects": "Effects",
    "tab.equalizer": "Equalizer",
    "tab.master": "Master",
    "eq.flat": "Flat",
    "lang.label": "Language",
    "effect.clarity.name": "Clarity",
    "effect.clarity.desc": "Enhances and elevates high end fidelity and presence",
    "effect.ambience.name": "Ambience",
    "effect.ambience.desc": "Thickens and smooths audio with controlled reverberation",
    "effect.surround.name": "Surround Sound",
    "effect.surround.desc": "Widens the left-right balance for expansive, wide sound",
    "effect.dynamicBoost.name": "Dynamic Boost",
    "effect.dynamicBoost.desc": "Increases overall volume and balance with responsive processing",
    "effect.bass.name": "Bass Boost",
    "effect.bass.desc": "Boosts low end for full, impactful response",
    "master.masterGain.name": "Master Gain",
    "master.masterGain.desc": "Overall output volume",
    "master.volumeLeveling.name": "Volume Leveling",
    "master.volumeLeveling.desc": "Evens out volume differences",
    "master.filterQ.name": "Filter Q",
    "master.filterQ.desc": "Equalizer bandwidth",
    "master.balance.name": "Balance",
    "master.balance.desc": "Left / Right channel balance",
    "preset.standard": "Standard",
    "preset.bassBoost": "Bass Boost",
    "preset.vocalBoost": "Vocal Boost",
    "preset.trebleBoost": "Treble Boost",
    "preset.ambience": "Ambience",
    "preset.surround3d": "3D Surround",
    "preset.jazz": "Jazz",
    "preset.classical": "Classical",
    "preset.rock": "Rock",
    "preset.pop": "Pop",
    "preset.electronic": "Electronic",
    "preset.country": "Country",
    "toast.preset": "Preset: {name}",
    "toast.enabled": "FxSound enabled",
    "toast.disabled": "FxSound disabled",
    "toast.loadFile": "Load an audio file first",
    "toast.eqReset": "Equalizer reset",
    "toast.langChanged": "Language changed",
    "balance.center": "C",
    "balance.left": "L",
    "balance.right": "R"
  },
  "zh-CN": {
    "brand.subtitle": "移动音频增强器",
    "track.noTrack": "系统音频",
    "track.loadHint": "点击电源捕获设备全部音频",
    "track.active": "正在处理设备全部音频",
    "section.preset": "预设",
    "tab.effects": "效果",
    "tab.equalizer": "均衡器",
    "tab.master": "主控",
    "eq.flat": "平直",
    "lang.label": "语言",
    "effect.clarity.name": "清晰度",
    "effect.clarity.desc": "增强并提升高频保真度和临场感",
    "effect.ambience.name": "氛围",
    "effect.ambience.desc": "通过可控的混响使声音更醇厚平滑",
    "effect.surround.name": "环绕声",
    "effect.surround.desc": "扩展左右平衡，营造宽广的声场",
    "effect.dynamicBoost.name": "动态增强",
    "effect.dynamicBoost.desc": "通过响应式处理提升整体音量和平衡",
    "effect.bass.name": "低音增强",
    "effect.bass.desc": "提升低频，带来饱满有力的响应",
    "master.masterGain.name": "主增益",
    "master.masterGain.desc": "整体输出音量",
    "master.volumeLeveling.name": "音量均衡",
    "master.volumeLeveling.desc": "平滑音量差异",
    "master.filterQ.name": "滤波器 Q 值",
    "master.filterQ.desc": "均衡器带宽",
    "master.balance.name": "平衡",
    "master.balance.desc": "左右声道平衡",
    "preset.standard": "标准",
    "preset.bassBoost": "低音增强",
    "preset.vocalBoost": "人声增强",
    "preset.trebleBoost": "高音增强",
    "preset.ambience": "氛围",
    "preset.surround3d": "3D 环绕",
    "preset.jazz": "爵士",
    "preset.classical": "古典",
    "preset.rock": "摇滚",
    "preset.pop": "流行",
    "preset.electronic": "电子",
    "preset.country": "乡村",
    "toast.preset": "预设：{name}",
    "toast.enabled": "FxSound 已启用",
    "toast.disabled": "FxSound 已禁用",
    "toast.loadFile": "请先加载音频文件",
    "toast.eqReset": "均衡器已重置",
    "toast.langChanged": "语言已切换",
    "balance.center": "中",
    "balance.left": "左",
    "balance.right": "右"
  },
  ja: {
    "brand.subtitle": "モバイルオーディオエンハンサー",
    "track.noTrack": "システムオーディオ",
    "track.loadHint": "電源をタップして全音声をキャプチャ",
    "track.active": "デバイスの全音声を処理中",
    "section.preset": "プリセット",
    "tab.effects": "エフェクト",
    "tab.equalizer": "イコライザー",
    "tab.master": "マスター",
    "eq.flat": "フラット",
    "lang.label": "言語",
    "effect.clarity.name": "クラリティ",
    "effect.clarity.desc": "高域の忠実度とプレゼンスを強化",
    "effect.ambience.name": "アンビエンス",
    "effect.ambience.desc": "制御された残響で音を厚く滑らかに",
    "effect.surround.name": "サラウンド",
    "effect.surround.desc": "左右バランスを広げ、広がりのある音に",
    "effect.dynamicBoost.name": "ダイナミックブースト",
    "effect.dynamicBoost.desc": "応答性の高い処理で全体の音量とバランスを向上",
    "effect.bass.name": "バスブースト",
    "effect.bass.desc": "低域をブーストし、インパクトのある音に",
    "master.masterGain.name": "マスターゲイン",
    "master.masterGain.desc": "全体の出力音量",
    "master.volumeLeveling.name": "ボリューム平準化",
    "master.volumeLeveling.desc": "音量差を均一化",
    "master.filterQ.name": "フィルター Q",
    "master.filterQ.desc": "イコライザーの帯域幅",
    "master.balance.name": "バランス",
    "master.balance.desc": "左右チャンネルのバランス",
    "preset.standard": "スタンダード",
    "preset.bassBoost": "バスブースト",
    "preset.vocalBoost": "ボーカルブースト",
    "preset.trebleBoost": "トレブルブースト",
    "preset.ambience": "アンビエンス",
    "preset.surround3d": "3D サラウンド",
    "preset.jazz": "ジャズ",
    "preset.classical": "クラシック",
    "preset.rock": "ロック",
    "preset.pop": "ポップ",
    "preset.electronic": "エレクトロニック",
    "preset.country": "カントリー",
    "toast.preset": "プリセット：{name}",
    "toast.enabled": "FxSound を有効にしました",
    "toast.disabled": "FxSound を無効にしました",
    "toast.loadFile": "先にオーディオファイルを読み込んでください",
    "toast.eqReset": "イコライザーをリセットしました",
    "toast.langChanged": "言語を変更しました",
    "balance.center": "中",
    "balance.left": "左",
    "balance.right": "右"
  },
  es: {
    "brand.subtitle": "Mejorador de Audio Móvil",
    "track.noTrack": "Audio del Sistema",
    "track.loadHint": "Toca el botón para capturar todo el audio",
    "track.active": "Procesando todo el audio del dispositivo",
    "section.preset": "Preajuste",
    "tab.effects": "Efectos",
    "tab.equalizer": "Ecualizador",
    "tab.master": "Maestro",
    "eq.flat": "Plano",
    "lang.label": "Idioma",
    "effect.clarity.name": "Claridad",
    "effect.clarity.desc": "Mejora y eleva la fidelidad y presencia de los agudos",
    "effect.ambience.name": "Ambiente",
    "effect.ambience.desc": "Espesa y suaviza el audio con reverberación controlada",
    "effect.surround.name": "Sonido Envolvente",
    "effect.surround.desc": "Amplía el balance izquierdo-derecho para un sonido expansivo",
    "effect.dynamicBoost.name": "Refuerzo Dinámico",
    "effect.dynamicBoost.desc": "Aumenta el volumen y balance general con procesamiento responsivo",
    "effect.bass.name": "Refuerzo de Graves",
    "effect.bass.desc": "Refuerza los graves para una respuesta completa e impactante",
    "master.masterGain.name": "Ganancia Maestra",
    "master.masterGain.desc": "Volumen de salida general",
    "master.volumeLeveling.name": "Nivelación de Volumen",
    "master.volumeLeveling.desc": "Equilibra las diferencias de volumen",
    "master.filterQ.name": "Filtro Q",
    "master.filterQ.desc": "Ancho de banda del ecualizador",
    "master.balance.name": "Balance",
    "master.balance.desc": "Balance de canales izquierdo / derecho",
    "preset.standard": "Estándar",
    "preset.bassBoost": "Refuerzo de Graves",
    "preset.vocalBoost": "Refuerzo Vocal",
    "preset.trebleBoost": "Refuerzo de Agudos",
    "preset.ambience": "Ambiente",
    "preset.surround3d": "Envolvente 3D",
    "preset.jazz": "Jazz",
    "preset.classical": "Clásica",
    "preset.rock": "Rock",
    "preset.pop": "Pop",
    "preset.electronic": "Electrónica",
    "preset.country": "Country",
    "toast.preset": "Preajuste: {name}",
    "toast.enabled": "FxSound activado",
    "toast.disabled": "FxSound desactivado",
    "toast.loadFile": "Carga primero un archivo de audio",
    "toast.eqReset": "Ecualizador reiniciado",
    "toast.langChanged": "Idioma cambiado",
    "balance.center": "C",
    "balance.left": "I",
    "balance.right": "D"
  }
};

const i18n = {
  currentLang: "en",
  listeners: [],

  init() {
    const saved = localStorage.getItem("fxsound_lang");
    if (saved && I18N_DICT[saved]) {
      this.currentLang = saved;
    } else {
      // auto-detect from browser
      const nav = navigator.language || "en";
      const match = I18N_LANGS.find((l) => nav.startsWith(l.code.split("-")[0]));
      this.currentLang = match ? match.code : "en";
    }
    this.applyDOM();
    document.documentElement.lang = this.currentLang;
  },

  t(key, vars = {}) {
    const dict = I18N_DICT[this.currentLang] || I18N_DICT.en;
    let str = dict[key] ?? I18N_DICT.en[key] ?? key;
    for (const k in vars) str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
    return str;
  },

  setLang(code) {
    if (!I18N_DICT[code]) return;
    this.currentLang = code;
    localStorage.setItem("fxsound_lang", code);
    document.documentElement.lang = code;
    this.applyDOM();
    this.listeners.forEach((fn) => fn(code));
  },

  onChange(fn) {
    this.listeners.push(fn);
  },

  // Apply translations to all elements with data-i18n attribute
  applyDOM() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const text = this.t(key);
      // Support both text content and placeholder
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", text);
      } else {
        el.textContent = text;
      }
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const [attr, key] = el.getAttribute("data-i18n-attr").split(":");
      el.setAttribute(attr, this.t(key));
    });
  }
};
