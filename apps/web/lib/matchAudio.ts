type Sfx = "goal" | "card" | "setup";

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08) {
  const ac = audioCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(ac.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.stop(ac.currentTime + dur);
}

export function playMatchSfx(kind: Sfx) {
  try {
    if (kind === "goal") {
      tone(440, 0.15, "sine");
      window.setTimeout(() => tone(660, 0.25, "sine", 0.1), 80);
    } else if (kind === "card") {
      tone(180, 0.2, "square", 0.05);
    } else {
      tone(520, 0.12, "triangle", 0.07);
      window.setTimeout(() => tone(780, 0.18, "triangle", 0.06), 60);
    }
  } catch {
    /* mute ok */
  }
}
