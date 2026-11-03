import { useEffect, useState } from "react";
import type { createCity } from "./engine";
type Stats = ReturnType<ReturnType<typeof createCity>["stats"]>;
const history = 48;
const number = new Intl.NumberFormat("en");
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
// Live renderer counters, with a switch that undoes static batching so the saving is visible.
export default function PerfHud({
  stats,
  onBatching,
  onClose,
}: {
  stats: () => Stats | undefined;
  onBatching: (value: boolean) => void;
  onClose: () => void;
}) {
  const [sample, setSample] = useState<Stats>();
  const [fps, setFps] = useState<number[]>([]);
  const [batching, setBatching] = useState(true);
  useEffect(() => {
    stats();
    const timer = setInterval(() => {
      const next = stats();
      if (!next) return;
      setSample(next);
      setFps((list) => [...list.slice(1 - history), next.fps]);
    }, 500);
    return () => clearInterval(timer);
  }, [stats]);
  useEffect(() => () => onBatching(true), [onBatching]);
  const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
  const path = fps.map((value, i) => `${i ? "L" : "M"}${(i / (history - 1)) * 100} ${30 - (Math.min(value, 60) / 60) * 28}`).join(" ");
  return (
    <aside className="city-perf" aria-label="Engine performance">
      <header>
        <span className="city-kicker">ENGINE · LIVE</span>
        <button type="button" onClick={onClose} aria-label="Close engine panel">×</button>
      </header>
      <p className="city-perf-gpu" title={sample?.gpu}>{sample?.gpu ?? "Sampling…"}</p>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 2 H100" />
        <path d={path} />
      </svg>
      <dl>
        <div><dt>FPS</dt><dd>{sample ? Math.round(sample.fps) : "–"}</dd></div>
        <div><dt>CPU / frame</dt><dd>{sample ? `${sample.frameMs.toFixed(1)} ms` : "–"}</dd></div>
        <div><dt>Draw calls</dt><dd>{sample ? number.format(sample.calls) : "–"}</dd></div>
        <div><dt>Triangles</dt><dd>{sample ? compact.format(sample.triangles) : "–"}</dd></div>
        <div><dt>Geometries</dt><dd>{sample ? number.format(sample.geometries) : "–"}</dd></div>
        <div><dt>Textures</dt><dd>{sample ? sample.textures : "–"}</dd></div>
        {heap !== undefined && <div><dt>JS heap</dt><dd>{Math.round(heap / 2 ** 20)} MB</dd></div>}
        <div><dt>Pixel ratio</dt><dd>{sample ? `${sample.pixelRatio}× ${sample.shadows ? "· shadows" : ""}` : "–"}</dd></div>
      </dl>
      <button
        type="button"
        className="city-perf-toggle"
        aria-pressed={batching}
        onClick={() => { setBatching(!batching); onBatching(!batching); }}
      >
        <span>Static batching {batching ? "ON" : "OFF"}</span>
        <small>
          {sample ? `${number.format(sample.batchedMeshes)} props folded into ${sample.batches} draws` : ""}
        </small>
      </button>
      <p className="city-perf-hint">Press <kbd>~</kbd> to hide · counts include shadow and post passes</p>
    </aside>
  );
}
