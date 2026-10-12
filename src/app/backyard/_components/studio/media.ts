import type { Cue } from "./formats";

/**
 * Aufnahme im Browser: Canvas-Stream + Ton (Originalton des Videos und
 * leise Effekte) → MediaRecorder. Safari liefert MP4 (H.264/AAC), Chrome
 * je nach Version MP4 oder WebM. Läuft in Echtzeit: 8 s Video = 8 s warten.
 */

export function pickMime(): string {
  const c = [
    "video/mp4;codecs=avc1.640028,mp4a.40.2",
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return c.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

/** Leise Effekte, synthetisch, damit keine Tondateien nötig sind */
export function playCue(ac: AudioContext, out: AudioNode, kind: Cue["kind"], when: number) {
  const g = ac.createGain();
  g.connect(out);
  if (kind === "tick") {
    const o = ac.createOscillator();
    o.type = "square";
    o.frequency.value = 1900;
    g.gain.setValueAtTime(0.035, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.018);
    o.connect(g);
    o.start(when);
    o.stop(when + 0.03);
  } else if (kind === "pop") {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(620, when);
    o.frequency.exponentialRampToValueAtTime(240, when + 0.09);
    g.gain.setValueAtTime(0.16, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    o.connect(g);
    o.start(when);
    o.stop(when + 0.16);
  } else if (kind === "whoosh") {
    const len = 0.4;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(350, when);
    bp.frequency.exponentialRampToValueAtTime(2400, when + len);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.09, when + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    src.connect(bp).connect(g);
    src.start(when);
    src.stop(when + len);
  } else {
    // Glocke: zwei Teiltöne, langer Ausklang
    for (const [f, a] of [[880, 0.11], [1320, 0.05], [2210, 0.025]] as const) {
      const o = ac.createOscillator();
      const gg = ac.createGain();
      o.frequency.value = f;
      gg.gain.setValueAtTime(a, when);
      gg.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
      o.connect(gg).connect(out);
      o.start(when);
      o.stop(when + 1.7);
    }
  }
}

export type RecordOpts = {
  canvas: HTMLCanvasElement;
  /** zeichnet das Bild für Sekunde t */
  frame: (t: number) => void;
  duration: number;
  video?: HTMLVideoElement;
  cues: Cue[];
  sound: boolean;
  onProgress?: (p: number) => void;
};

export async function record(o: RecordOpts): Promise<Blob> {
  const mime = pickMime();
  if (!mime) throw new Error("Dieser Browser kann keine Videos aufnehmen. Safari oder Chrome nehmen.");
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ac = new AC();
  await ac.resume();
  const dest = ac.createMediaStreamDestination();

  if (o.video) {
    o.video.muted = false;
    o.video.currentTime = 0;
    const src = ac.createMediaElementSource(o.video);
    src.connect(dest);
  }

  o.frame(0);
  const stream = (o.canvas as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(30);
  dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: mime.split(";")[0] }))));

  rec.start(250);
  const t0 = ac.currentTime + 0.05;
  if (o.sound) for (const c of o.cues) playCue(ac, dest, c.kind, t0 + c.at);
  if (o.video) await o.video.play();
  const start = performance.now();

  await new Promise<void>((res) => {
    const step = () => {
      const t = o.video ? o.video.currentTime : (performance.now() - start) / 1000;
      o.frame(Math.min(t, o.duration));
      o.onProgress?.(Math.min(1, t / o.duration));
      if (t >= o.duration || (o.video && o.video.ended)) return res();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  o.video?.pause();
  rec.stop();
  const blob = await done;
  stream.getTracks().forEach((tr) => tr.stop());
  await ac.close();
  return blob;
}

/** Teilen (iPhone: «Video sichern» landet in Fotos) oder herunterladen */
export async function saveFile(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
