export interface ClientFingerprint {
  engine: "chromium" | "firefox" | "unknown";
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: string;
  };
  timezone: string;
  timezoneOffset: number;
  canvasHash: string;
  webgl: {
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
    version: string;
    shadingLanguageVersion: string;
    extensions: string[];
  } | null;
  audioHash: string | null;
  automation: {
    isAutomated: boolean;
    signals: string[];
  };
  fonts: string[];
  mathHash: string;
  plugins: string[];
  connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  } | null;
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
  };
  battery: {
    charging?: boolean;
    level?: number;
  } | null;
  // Consistency checks the backend can cross-reference
  // with JA3/JA4 and server-side UA
  consistency: {
    engineMatchesUA: boolean;
    timezoneMatchesOffset: boolean;
    pluginsMatchEngine: boolean;
    webglMatchesPlatform: boolean;
  };
  hash: string;
}

// ─── Hashing ───────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Engine Detection ──────────────────────────────────────
// Chromium can handle huge switch/case blocks; Firefox throws.
// Backend can cross-reference this with JA3/JA4 TLS fingerprint
// since Chromium and Firefox have distinct TLS stacks.

function detectEngine(): "chromium" | "firefox" | "unknown" {
  try {
    const code: string[] = ["var p=NaN;switch(p){"];
    for (let c = 0; c < 66000; c++) {
      code.push("case " + c + ":");
    }
    code.push("}");
    // eslint-disable-next-line no-eval
    eval(code.join(""));
    return "chromium";
  } catch {
    if (
      typeof (window as any).InstallTrigger !== "undefined" ||
      navigator.userAgent.includes("Firefox")
    ) {
      return "firefox";
    }
    return "unknown";
  }
}

// ─── Canvas Fingerprint ────────────────────────────────────
// Renders text + shapes; GPU/font rendering differences
// produce a unique hash per device. Verifiable if backend
// stores previous hashes for the same account.

function getCanvasData(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return "unsupported";

    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = "#069";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint:$&@#)(!%", 2, 15);

    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.font = "18px Times New Roman";
    ctx.fillText("canvas fp 🎨", 4, 45);

    ctx.globalCompositeOperation = "multiply";

    ctx.fillStyle = "rgb(255,0,255)";
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgb(0,255,255)";
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgb(255,255,0)";
    ctx.beginPath();
    ctx.arc(75, 100, 50, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f0f";
    ctx.font = "bold 16px Georgia";
    ctx.fillText("Cwm fjordbank glyphs vext quiz", 10, 100);

    return c.toDataURL();
  } catch {
    return "error";
  }
}

// ─── WebGL Fingerprint ─────────────────────────────────────
// GPU vendor/renderer can be verified against platform claim.
// e.g. "Apple GPU" on a claimed Windows machine is suspicious.

function getWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") ||
      c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;

    const dbg = gl.getExtension("WEBGL_debug_renderer_info");

    return {
      vendor: gl.getParameter(gl.VENDOR) || "",
      renderer: gl.getParameter(gl.RENDERER) || "",
      unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || "" : "",
      unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "" : "",
      version: gl.getParameter(gl.VERSION) || "",
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || "",
      extensions: gl.getSupportedExtensions() || [],
    };
  } catch {
    return null;
  }
}

// ─── Audio Fingerprint ─────────────────────────────────────
// OfflineAudioContext output varies per browser/OS audio stack.
// Stable across sessions on same device.

async function getAudioHash(): Promise<string | null> {
  try {
    const AC = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!AC) return null;

    const ctx = new AC(1, 44100, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(10000, ctx.currentTime);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-50, ctx.currentTime);
    comp.knee.setValueAtTime(40, ctx.currentTime);
    comp.ratio.setValueAtTime(12, ctx.currentTime);
    comp.attack.setValueAtTime(0, ctx.currentTime);
    comp.release.setValueAtTime(0.25, ctx.currentTime);

    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);

    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);

    let sum = 0;
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(data[i]);
    }
    return sum.toString();
  } catch {
    return null;
  }
}

// ─── Automation / Bot Detection ────────────────────────────
// Checks for WebDriver, Selenium, Puppeteer, Playwright,
// PhantomJS, Nightmare, headless indicators, CDP traces.
// Backend can flag sessions with any signals.

function detectAutomation(): { isAutomated: boolean; signals: string[] } {
  const signals: string[] = [];
  const w = window as any;
  const d = document as any;
  const n = navigator as any;

  // WebDriver flag (set by all major automation tools)
  if (n.webdriver) signals.push("webdriver");

  // WebDriver prototype tampering
  try {
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, "webdriver");
    if (desc?.get && !desc.get.toString().includes("native code")) {
      signals.push("webdriver_tampered");
    }
  } catch {
    /* ignore */
  }

  // Selenium
  const seleniumKeys = [
    "__selenium_unwrapped",
    "__webdriver_evaluate",
    "__driver_evaluate",
    "__webdriver_script_function",
    "__webdriver_script_func",
    "__webdriver_script_fn",
    "__fxdriver_evaluate",
    "__driver_unwrapped",
    "__webdriver_unwrapped",
    "__driver_script_fn",
  ];
  for (const key of seleniumKeys) {
    if (d[key] || w[key]) {
      signals.push("selenium");
      break;
    }
  }

  // Chrome DevTools Protocol (CDP) runtime variables
  const cdcProps = Object.getOwnPropertyNames(w).filter(
    (p) => p.match(/^cdc_/) || p.match(/^\$cdc_/)
  );
  const cdcDocProps = Object.getOwnPropertyNames(d).filter(
    (p) => p.match(/^\$cdc_/) || p.match(/^__cdc_/)
  );
  if (cdcProps.length > 0 || cdcDocProps.length > 0) signals.push("cdp_runtime");

  // PhantomJS
  if (w._phantom || w.callPhantom || w.__phantomas) signals.push("phantomjs");

  // Nightmare.js
  if (w.__nightmare) signals.push("nightmare");

  // Playwright
  if (w.__playwright || w.__pw_manual) signals.push("playwright");

  // Headless Chrome UA
  if (/HeadlessChrome/i.test(n.userAgent)) signals.push("headless_ua");

  // Missing chrome object in Chrome UA
  if (/Chrome/.test(n.userAgent) && !w.chrome) signals.push("missing_chrome_obj");

  // No plugins (common in headless)
  if (!n.plugins || n.plugins.length === 0) signals.push("no_plugins");

  // No languages
  if (!n.languages || n.languages.length === 0) signals.push("no_languages");

  // Zero outer dimensions (headless often has 0x0)
  if (window.outerWidth === 0 && window.outerHeight === 0) signals.push("zero_dimensions");

  // Connection RTT of 0 (common in headless)
  const conn = n.connection;
  if (conn && conn.rtt === 0 && conn.downlink !== 0) signals.push("zero_rtt");

  // Permissions API inconsistency
  // (headless often denies notifications by default)
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "denied" &&
    n.userAgent.includes("Chrome") &&
    !n.userAgent.includes("Firefox")
  ) {
    signals.push("notification_denied_default");
  }

  // Check for iframe-based devtools detection
  try {
    const threshold = 160;
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      signals.push("devtools_open");
    }
  } catch {
    /* ignore */
  }

  return { isAutomated: signals.length > 0, signals };
}

// ─── Font Detection ────────────────────────────────────────
// Measures text width with candidate fonts vs base fonts.
// Font list is a stable device fingerprint. Backend can
// compare across sessions for same user.

function detectFonts(): string[] {
  const baseFonts = ["monospace", "sans-serif", "serif"] as const;
  const testFonts = [
    "Arial", "Arial Black", "Calibri", "Cambria", "Century Gothic",
    "Comic Sans MS", "Consolas", "Courier", "Courier New", "Georgia",
    "Helvetica", "Impact", "Lucida Console", "Lucida Sans Unicode",
    "Microsoft Sans Serif", "Palatino Linotype", "Segoe UI", "Tahoma",
    "Times", "Times New Roman", "Trebuchet MS", "Verdana",
    "Menlo", "Monaco", "SF Pro", "San Francisco",
    "Roboto", "Open Sans", "Ubuntu", "Droid Sans",
    "Noto Sans", "DejaVu Sans", "Liberation Sans",
    "Fira Code", "Source Code Pro", "JetBrains Mono",
  ];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const testStr = "mmmmmmmmmmlli";
  const size = "72px";

  const measure = (font: string) => {
    ctx.font = `${size} ${font}`;
    return ctx.measureText(testStr).width;
  };

  const baseWidths: Record<string, number> = {};
  for (const b of baseFonts) baseWidths[b] = measure(b);

  const detected: string[] = [];
  for (const font of testFonts) {
    for (const base of baseFonts) {
      if (measure(`'${font}', ${base}`) !== baseWidths[base]) {
        detected.push(font);
        break;
      }
    }
  }
  return detected;
}

// ─── Math Fingerprint ──────────────────────────────────────
// Math function results can vary slightly across engines/platforms
// due to different implementations.

function getMathValues(): string {
  return [
    Math.acos(0.5),
    Math.acosh(1e308),
    Math.asin(0.5),
    Math.asinh(1),
    Math.atan(0.5),
    Math.atanh(0.5),
    Math.cbrt(100),
    Math.cos(21 * Math.LN2),
    Math.cosh(1),
    Math.exp(1),
    Math.expm1(1),
    Math.log(10),
    Math.log1p(10),
    Math.log2(10),
    Math.log10(10),
    Math.sin(1),
    Math.sinh(1),
    Math.sqrt(2),
    Math.tan(1),
    Math.tanh(1),
  ].join(",");
}

// ─── Plugins ───────────────────────────────────────────────

function getPlugins(): string[] {
  if (!navigator.plugins) return [];
  return Array.from(navigator.plugins).map((p) => p.name);
}

// ─── Network Connection ────────────────────────────────────

function getConnection() {
  const c =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;
  if (!c) return null;
  return {
    effectiveType: c.effectiveType,
    downlink: c.downlink,
    rtt: c.rtt,
    saveData: c.saveData,
  };
}

// ─── Storage Support ───────────────────────────────────────

function getStorage() {
  const test = (fn: () => boolean) => {
    try {
      return fn();
    } catch {
      return false;
    }
  };
  return {
    localStorage: test(() => {
      localStorage.setItem("__fp", "1");
      localStorage.removeItem("__fp");
      return true;
    }),
    sessionStorage: test(() => {
      sessionStorage.setItem("__fp", "1");
      sessionStorage.removeItem("__fp");
      return true;
    }),
    indexedDB: typeof indexedDB !== "undefined",
  };
}

// ─── Consistency Checks ────────────────────────────────────
// These help the backend cross-reference client claims with
// server-side data (JA3/JA4, IP geo, etc.)

function checkConsistency(
  engine: string,
  webgl: ClientFingerprint["webgl"],
  plugins: string[]
) {
  const ua = navigator.userAgent;

  // Engine claimed by detection vs UA string
  const uaSaysChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const uaSaysFirefox = /Firefox/.test(ua);
  const engineMatchesUA =
    (engine === "chromium" && uaSaysChrome) ||
    (engine === "firefox" && uaSaysFirefox) ||
    engine === "unknown";

  // Timezone name should be consistent with offset
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().getTimezoneOffset();
  let timezoneMatchesOffset = true;
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const localHour = parseInt(formatter.format(now));
    if (isNaN(localHour)) throw new Error("invalid hour");
    const utcHour = now.getUTCHours();
    const expectedOffset = ((localHour - utcHour + 24) % 24) * 60;
    const actualOffset = (((- offset / 60) % 24 + 24) % 24) * 60;
    const diff = Math.abs(expectedOffset - actualOffset);
    timezoneMatchesOffset = diff <= 60 || diff >= 23 * 60;
  } catch {
    timezoneMatchesOffset = false;
  }

  // Chrome browsers should have Chrome PDF plugins
  const hasChromePDFPlugin = plugins.some((p) =>
    p.toLowerCase().includes("pdf")
  );
  const pluginsMatchEngine =
    engine !== "chromium" || hasChromePDFPlugin || plugins.length > 0;

  // WebGL renderer should match platform
  let webglMatchesPlatform = true;
  if (webgl) {
    const r = (webgl.unmaskedRenderer || webgl.renderer).toLowerCase();
    const p = navigator.platform.toLowerCase();
    if (p.includes("mac") && r.includes("direct3d")) webglMatchesPlatform = false;
    if (p.includes("win") && r.includes("apple gpu")) webglMatchesPlatform = false;
    if (p.includes("linux") && r.includes("direct3d")) webglMatchesPlatform = false;
  }

  return {
    engineMatchesUA,
    timezoneMatchesOffset,
    pluginsMatchEngine,
    webglMatchesPlatform,
  };
}

// ─── Main Collector ────────────────────────────────────────

export async function collectFingerprint(): Promise<ClientFingerprint> {
  const engine = detectEngine();
  const canvasRaw = getCanvasData();
  const webgl = getWebGL();
  const audioHash = await getAudioHash();
  const automation = detectAutomation();
  const fonts = detectFonts();
  const mathRaw = getMathValues();
  const plugins = getPlugins();
  const connection = getConnection();
  const storage = getStorage();

  let battery: "desktop" | "laptop" | "unknown" = "unknown";
  try {
    if ((navigator as any).getBattery) {
      const b = await (navigator as any).getBattery();
      // A device with no battery always reports charging=true, level=1.0
      // That's the kernel's default when no battery hardware exists
      if (b.charging === true && b.level === 1.0) {
        battery = "desktop";
      } else {
        battery = "laptop";
      }
    }
  } catch {
    // API blocked or unavailable (Firefox removed it for privacy)
  }

  const screen = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    orientation: window.screen.orientation?.type || "unknown",
  };

  const canvasHash = await sha256(canvasRaw);
  const mathHash = await sha256(mathRaw);
  const consistency = checkConsistency(engine, webgl, plugins);

  const fp = {
    engine,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || null,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screen,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    canvasHash,
    webgl,
    audioHash,
    automation,
    fonts,
    mathHash,
    plugins,
    connection,
    storage,
    battery,
    consistency,
  };

  const hash = await sha256(JSON.stringify(fp));

  return { ...fp, hash };
}