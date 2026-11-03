"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Building2,
  CarFront,
  ChevronDown,
  ChevronUp,
  Footprints,
  Gauge,
  Link2,
  Home,
  Info,
  Map,
  Moon,
  Pause,
  Play,
  Star,
  Sun,
} from "lucide-react";
import {
  cityBuildings,
  cityMissions,
  cityRoute,
  doorPoint,
  parseCityRoute,
  type CityRoute,
} from "@/lib/city-layout";
import { personal } from "@/lib/data";
import type { createCity, CitySnapshot } from "./engine";
import DiscoveryJournal from "./discovery-journal";
import { isDiscovery, restoreDiscoveries, advanceSecret, type DiscoveryId } from "@/lib/city-discoveries";
import CityDirectory from "./directory";
import CityDialog from "./dialog";
import { activities, type ActivityId } from "@/lib/city-activities";
import Dossier from "./dossier";
import CityMinimap from "./minimap";
import PerfHud from "./perf-hud";
import HireCard from "./hire-card";
import { cityTour, tourStopSeconds } from "@/lib/city-tour";
import DirectionPad from "./dpad";
const initialSnapshot: CitySnapshot = {
  mode: "overview",
  position: { x: 0, z: 7 },
  nearby: null,
  heading: 0,
  sprinting: false,
  driving: false,
  nearCar: false,
  car: { x: 3, z: 9.5, heading: 0, speed: 0 },
};
const visitKey = "anush-buildverse-city-addresses";
// Addresses discovered to reach each Hire Level star.
const hireSteps = [1, 3, 6, 9, 12];
const buildingName = (id: string) =>
  cityBuildings.find((building) => building.id === id)?.name ?? id;
const hireLevel = (count: number) =>
  hireSteps.filter((step) => count >= step).length;
export default function CityApp() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof createCity>>();
  const actions = useRef<{
    activity: (id: ActivityId) => void;
    enter: (id: string, floor: number) => void;
    discover: (id: string) => void;
    read: () => void;
    exit: () => void;
    play: () => void;
  }>({
    activity: () => {},
    enter: () => {},
    discover: () => {},
    read: () => {},
    exit: () => {},
    play: () => {},
  });
  const routeRef = useRef<CityRoute | null>(null);
  const [route, setRoute] = useState<CityRoute | null>(null);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [ready, setReady] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const [directory, setDirectory] = useState(false),
    [help, setHelp] = useState(true),
    [expanded, setExpanded] = useState(false);
  const [activityMenu, setActivityMenu] = useState(false);
  const [activityRequest, setActivityRequest] = useState<{ id: ActivityId } | null>(null);
  const [guide, setGuide] = useState(false);
  const [journal, setJournal] = useState(false);
  const [selectedDiscovery, setSelectedDiscovery] = useState<DiscoveryId | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoveryId[]>([]);
  const [illustrated, setIllustrated] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [place, setPlace] = useState<string | null>(null);
  const [living, setLiving] = useState(true);
  const [night, setNight] = useState(false),
    [paused, setPaused] = useState(false);
  const [hover, setHover] = useState("");
  const [perf, setPerf] = useState(false);
  const [xray, setXray] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
  const [hire, setHire] = useState(false);
  const [copied, setCopied] = useState(false);
  const perfStats = useCallback(() => engine.current?.stats(), []);
  const perfBatching = useCallback((value: boolean) => engine.current?.setBatching(value), []);
  const tier = snapshot.quality?.tier;
  const [travel, setTravel] = useState<"overview" | "walk">("overview");
  const [enterVersion, setEnterVersion] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  // One big GTA-style announcement at a time: level ups, checkpoints, missions.
  const [banner, setBanner] = useState<{
    id: number;
    title: string;
    sub: string;
    stars?: number;
  } | null>(null);
  const announce = (title: string, sub: string, stars?: number) =>
    setBanner({ id: Date.now(), title, sub, stars });
  const [mission, setMission] = useState<{ index: number; stop: number } | null>(
    null,
  );
  const active =
    cityBuildings.find((building) => building.id === route?.id) ?? null;
  const floor = route?.floor ?? 0;
  function updateRoute(next: CityRoute | null, replace = false) {
    setTour(null);
    routeRef.current = next;
    setRoute(next);
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      next ? cityRoute(next) : "#city",
    );
  }
  function visit(id: string, level = 0, reading = false) {
    setPlace(null);
    const building = cityBuildings.find((item) => item.id === id);
    if (!building || level < 0 || level >= building.floors.length) return;
    setDirectory(false);
    setHelp(false);
    setExpanded(window.innerWidth > 650);
    updateRoute({ id, floor: level, reading: reading || unavailable });
    setEnterVersion((current) => current + 1);
    if (
      !visited.includes(id) &&
      hireLevel(visited.length + 1) > hireLevel(visited.length)
    ) {
      const level = hireLevel(visited.length + 1);
      announce(
        level === 5 ? "Hire level maxed" : "Hire level up",
        level === 5
          ? "The Contact Terminal is waiting for you."
          : `${hireSteps[level] - visited.length - 1} more addresses to the next star`,
        level,
      );
    }
    setVisited((current) => {
      const next = current.includes(id) ? current : [...current, id];
      try {
        sessionStorage.setItem(visitKey, JSON.stringify(next));
      } catch {
        /* Exploration works without browser storage. */
      }
      return next;
    });
  }
  function openDossier() {
    if (routeRef.current) updateRoute({ ...routeRef.current, reading: true });
  }
  function closeDossier() {
    if (routeRef.current)
      updateRoute({ ...routeRef.current, reading: false }, true);
  }
  function goOverview() {
    setPlace(null);
    setHelp(false);
    setTravel("overview");
    updateRoute(null);
    engine.current?.overview();
  }
  function launchActivity(id: ActivityId) {
    setActivityMenu(false); setGuide(false); goWalking(); setBanner(null); setActivityRequest({ id });
  }
  function startTour() {
    setHelp(false); setGuide(false); setDirectory(false); setHire(false); setBanner(null);
    if (routeRef.current) updateRoute(null);
    setTour(0);
  }
  function startJourney() {
    goWalking();
    setBanner(null);
    setGuide(true);
  }
  function goWalking() {
    setPlace(null);
    if (!mission) {
      setMission({ index: 0, stop: 0 });
      announce(cityMissions[0].title, `Mission start · go to ${buildingName(cityMissions[0].stops[0])}`);
    }
    setHelp(false);
    setTravel("walk");
    updateRoute(null);
    engine.current?.walk();
  }
  function discover(id: string) {
    if (!isDiscovery(id)) return;
    setSelectedDiscovery(id); setJournal(true);
    setDiscoveries(current => {
      const next = current.includes(id) ? current : [...current, id];
      try { sessionStorage.setItem("solmyst-discoveries", JSON.stringify(next)); } catch { /* Optional journal storage. */ }
      return next;
    });
    engine.current?.celebrateDiscovery();
  }
  useEffect(() => {
    try { setDiscoveries(restoreDiscoveries(sessionStorage.getItem("solmyst-discoveries"))); } catch { /* Optional storage. */ }
    let progress = 0;
    const handler = (event: KeyboardEvent) => {
      if (event.repeat || (event.target as HTMLElement)?.closest("input,textarea,dialog,[contenteditable=true]")) return;
      if (event.key === "~" || event.key === "`") setPerf((value) => !value);
      if (event.key.toLowerCase() === "x") setXray((value) => !value);
      if (event.key === "Escape") setTour(null);
      const result = advanceSecret(progress, event.key); progress = result.progress;
      if (result.unlocked) actions.current.discover("konami");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  actions.current = {
    discover,
    activity: launchActivity,
    enter: visit,
    read: openDossier,
    exit: goWalking,
    play: startJourney,
  };
  useEffect(() => {
    const synchronize = () => {
      setTour(null);
      setPlace(null);
      const next = parseCityRoute(window.location.hash);
      if (
        next?.id !== routeRef.current?.id ||
        next?.floor !== routeRef.current?.floor
      )
        setEnterVersion((value) => value + 1);
      if (!next) setTravel("overview");
      routeRef.current = next;
      setRoute(next);
      if (next) {
        setHelp(false);
        setExpanded(window.innerWidth > 650);
      }
    };
    synchronize();
    window.addEventListener("hashchange", synchronize);
    window.addEventListener("popstate", synchronize);
    try {
      const saved = JSON.parse(sessionStorage.getItem(visitKey) ?? "[]");
      if (Array.isArray(saved))
        setVisited(
          Array.from(
            new Set(
              saved.filter(
                (id: unknown): id is string =>
                  typeof id === "string" &&
                  cityBuildings.some((building) => building.id === id),
              ),
            ),
          ),
        );
    } catch {
      /* Optional local passport. */
    }
    return () => {
      window.removeEventListener("hashchange", synchronize);
      window.removeEventListener("popstate", synchronize);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    import("./engine")
      .then(({ createCity }) => {
        if (cancelled) return;
        try {
          engine.current = createCity(canvas.current!, {
            onEnter: (id, level) => actions.current.enter(id, level),
            onActivity: (id) => actions.current.activity(id),
            onRead: () => actions.current.read(),
            onDiscover: (id) => actions.current.discover(id),
            onExit: () => actions.current.exit(),
            onUpdate: setSnapshot,
            onHover: setHover,
            onUnavailable: () => {
              setUnavailable(true);
              setDirectory(true);
            },
          });
          setReady(true);
        } catch {
          setUnavailable(true);
          setDirectory(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true);
          setDirectory(true);
        }
      });
    return () => {
      cancelled = true;
      engine.current?.dispose();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (route?.id) engine.current?.enter(route.id, route.floor);
    else if (place) engine.current?.visitPlace(place);
    else if (travel === "walk") engine.current?.walk();
    else engine.current?.overview();
  }, [ready, route?.id, route?.floor, travel, enterVersion, place]);
  const titleScreen = help && !route;
  useEffect(() => {
    engine.current?.setBlocked(titleScreen || directory || journal || activityMenu || hire || !!route?.reading);
  }, [ready, titleScreen, directory, journal, activityMenu, hire, route?.reading]);
  useEffect(() => {
    if (ready && activityRequest) engine.current?.startActivity(activityRequest.id);
  }, [ready, activityRequest]);
  useEffect(() => {
    engine.current?.setNight(night);
  }, [ready, night]);
  useEffect(() => {
    engine.current?.setPaused(paused);
  }, [ready, paused]);
  useEffect(() => {
    engine.current?.setPreview(titleScreen);
  }, [ready, titleScreen]);
  useEffect(() => {
    if (!titleScreen) return;
    const start = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        !(event.target as HTMLElement)?.closest?.("button,a,input,dialog")
      )
        actions.current.play();
    };
    window.addEventListener("keydown", start);
    return () => window.removeEventListener("keydown", start);
  }, [titleScreen]);
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3600);
    return () => clearTimeout(timer);
  }, [banner]);
  const currentMission =
    mission && mission.index < cityMissions.length
      ? cityMissions[mission.index]
      : null;
  const waypoint =
    currentMission && mission ? doorPoint(currentMission.stops[mission.stop]) : null;
  const waypointDistance = waypoint
    ? Math.hypot(snapshot.position.x - waypoint.x, snapshot.position.z - waypoint.z)
    : Infinity;
  useEffect(() => {
    engine.current?.setCheckpoint(route ? null : waypoint);
  }, [ready, route, waypoint?.x, waypoint?.z]); // eslint-disable-line react-hooks/exhaustive-deps
  // Fires once each time the visitor arrives at the current waypoint.
  useEffect(() => {
    if (snapshot.activity || !currentMission || !mission || waypointDistance > 3.4) return;
    const next = mission.stop + 1;
    if (next < currentMission.stops.length) {
      setMission({ index: mission.index, stop: next });
      announce(
        "Checkpoint",
        `${next}/${currentMission.stops.length} · next: ${buildingName(currentMission.stops[next])}`,
      );
    } else {
      setMission({ index: mission.index + 1, stop: 0 });
      const upcoming = cityMissions[mission.index + 1];
      announce(
        "Mission passed",
        upcoming
          ? `${currentMission.title} · Respect + · next: ${upcoming.title}`
          : `${currentMission.title} · Respect + · every mission complete`,
      );
    }
  }, [waypointDistance < 3.4]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { engine.current?.setLiving(living); }, [ready, living]);
  useEffect(() => { engine.current?.setXray(xray); }, [ready, xray]);
  useEffect(() => {
    if (tour === null || !ready) return;
    if (tour >= cityTour.length) {
      setTour(null);
      engine.current?.overview();
      setHire(true);
      return;
    }
    engine.current?.inspect(cityTour[tour].id);
    const timer = setTimeout(() => {
      setTour((current) => current === tour ? tour + 1 : current);
    }, tourStopSeconds * 1000);
    return () => clearTimeout(timer);
  }, [ready, tour]);
  useEffect(() => setCopied(false), [route?.id, route?.floor]);
  useEffect(() => { engine.current?.setIllustrated(illustrated); }, [ready, illustrated]);
  useEffect(() => { engine.current?.setShowLabels(showLabels); }, [ready, showLabels]);
  const nearby = cityBuildings.find(
    (building) => building.id === snapshot.nearby,
  );
  return (
    <main
      id="main-content"
      className={`city-app ${titleScreen ? "city-preview" : ""} ${ready ? "city-ready" : ""} ${(living ? snapshot.weather?.night : night) ? "city-night" : ""}`}
      tabIndex={-1}
    >
      <h1 className="sr-only">
        Anush Gupta’s Buildverse City — an explorable 3D portfolio
      </h1>
      <canvas
        ref={canvas}
        className="city-canvas"
        tabIndex={0}
        role="application"
        aria-label="Buildverse City. Drag to look around, scroll to zoom, use W A S D or arrow keys to walk, hold Shift to sprint, Space to jump, F to get in or out of the car, E to enter a nearby building or read a room display. The city directory provides keyboard navigation to every destination."
      />
      {!ready && !unavailable && (
        <div className="city-loading" role="status">
          <span className="city-loading-mark">
            a<span>✳</span>
          </span>
          <h2>Opening the district.</h2>
          <p>{cityBuildings.length} buildings. A whole portfolio inside.</p>
          <i />
        </div>
      )}
      {unavailable && (
        <div className="city-unavailable">
          <Building2 size={34} />
          <h2>The city is still open.</h2>
          <p>
            The 3D view is unavailable on this device. Use the directory to
            enter every building and read its floors.
          </p>
          <button type="button" onClick={() => setDirectory(true)}>
            Open city directory
            <ArrowUpRight size={16} />
          </button>
        </div>
      )}
      <header className="city-topbar">
        <button
          type="button"
          className="city-brand"
          onClick={() => { if (!titleScreen) goOverview(); }}
          aria-label="Return to city overview"
        >
          <span>
            a<span>✳</span>
          </span>
          <div>
            BUILDVERSE<span>ANUSH GUPTA / PRODUCT × CODE</span>
          </div>
        </button>
        <div className="city-top-location">
          <span className="city-signal" />
          {active ? active.name : "A SOCIETY OF IDEAS"}
          <small>
            {active
              ? `F${String(floor + 1).padStart(2, "0")} / ${snapshot.mode === "building" ? "EXTERIOR" : "INTERIOR"}`
              : "EST. 2023 · ALWAYS BUILDING"}
          </small>
        </div>
        <button
          type="button"
          className="city-hire"
          aria-label={`Hire level ${hireLevel(visited.length)} of 5. Open contact card`}
          onClick={() => setHire(true)}
        >
          <span>
            {hireSteps.map((step, index) => (
              <Star
                key={step}
                size={15}
                className={index < hireLevel(visited.length) ? "is-earned" : ""}
              />
            ))}
          </span>
          <small>HIRE LEVEL</small>
        </button>
          <button type="button" className="city-weather-control" aria-pressed={living} aria-label="Automatic simulated weather and day cycle" onClick={() => setLiving(!living)}>
            {living && snapshot.weather ? `SIM · ${String(Math.floor(snapshot.weather.hour)).padStart(2, "0")}:${String(Math.floor(snapshot.weather.hour % 1 * 60)).padStart(2, "0")} · ${snapshot.weather.temperature}°C · ${snapshot.weather.condition}` : "Live world"}
          </button>
        <div className="city-top-actions">

          <button
            type="button"
            className="city-icon"
            onClick={() => { const target = !(living ? snapshot.weather?.night : night); setLiving(false); setNight(target); engine.current?.setNight(target); }}
            aria-label={(living ? snapshot.weather?.night : night) ? "Switch to daylight" : "Switch to night"}
          >
            {(living ? snapshot.weather?.night : night) ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="city-icon"
            aria-label={
              paused ? "Resume city animation" : "Pause city animation"
            }
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            type="button"
            className="city-icon"
            aria-label={`Show engine performance (~). Quality: ${tier ?? "loading"}`}
            title={tier && `Quality: ${tier}${snapshot.quality?.mode === "auto" ? " (auto)" : ""}`}
            aria-pressed={perf}
            onClick={() => setPerf(!perf)}
          >
            <Gauge size={18} />
            {tier && <span className={`city-quality-dot city-quality-${tier}`} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="city-icon"
            onClick={() => setHelp(!help)}
            aria-label="Show game controls"
            aria-pressed={help}
          >
            <Info size={18} />
          </button>
          <a href="https://anush.tech/" className="city-quick-portfolio" title="Read projects, experience and resume on the quick portfolio">
            <span className="city-quick-label">Quick </span>Portfolio <ArrowUpRight size={14} />
          </a>
          <a
            href={personal.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="city-resume"
          >
            Resume
            <ArrowUpRight size={14} />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </header>
      {perf && ready && <PerfHud stats={perfStats} onBatching={perfBatching} onClose={() => setPerf(false)} quality={snapshot.quality} onQuality={(mode) => engine.current?.setQuality(mode)} xray={xray} onXray={setXray} />}
      {tour !== null && cityTour[tour] && (
        <aside className="city-tour" aria-live="polite" aria-label="Autopilot tour">
          <p className="city-kicker">AUTOPILOT TOUR · {tour + 1} / {cityTour.length}</p>
          <h2>{cityTour[tour].name}</h2>
          <p>{cityTour[tour].line}</p>
          <span className="city-tour-bar" aria-hidden="true">
            <span key={tour} style={{ animationDuration: `${tourStopSeconds}s` }} />
          </span>
          <div>
            <button type="button" className="city-primary" onClick={() => { const id = cityTour[tour].id; setTour(null); visit(id); }}>
              Step inside
            </button>
            <button type="button" className="city-secondary" onClick={() => setTour(tour + 1)}>Next</button>
            <button type="button" className="city-secondary" onClick={() => setTour(null)}>Stop</button>
          </div>
        </aside>
      )}
      <HireCard open={hire} onClose={() => setHire(false)} onTour={startTour} stars={hireLevel(visited.length)} />
      {xray && ready && (
        <p className="city-xray-legend" role="status">
          <strong>Blueprint X-ray</strong> Colours mark separate draw calls · <kbd>X</kbd> to exit
        </p>
      )}
      {titleScreen && (
        <aside className="city-title" aria-labelledby="city-title-heading">
          <p className="city-title-eyebrow">ANUSH GUPTA PRESENTS</p>
          <h2 id="city-title-heading" className="city-title-logo">
            <span>BUILD</span>
            <span>VERSE</span>
          </h2>
          <p className="city-title-tagline">
            {cityBuildings.length} buildings. Nine projects. One city you can walk.
          </p>
          <a href="https://anush.tech/" className="city-recruiter-link">Short on time? Read my quick portfolio ↗</a>
          <div className="city-title-actions">
            <button type="button" className="city-play" onClick={startJourney}>
              <Play size={18} />
              Enter the district
              <kbd>ENTER</kbd>
            </button>
            <button
              type="button"
              className="city-secondary"
              onClick={() => setDirectory(true)}
            >
              Choose an address
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button type="button" className="city-recruiter-link" onClick={startTour}>
            <Play size={13} /> Watch the 60-second tour
          </button>
          <ul className="city-title-controls">
            <li>
              <kbd>W A S D</kbd>Move
            </li>
            <li>
              <kbd>SHIFT</kbd>Sprint
            </li>
            <li>
              <kbd>SPACE</kbd>Jump
            </li>
            <li>
              <kbd>E</kbd>Enter
            </li>
            <li>
              <kbd>F</kbd>Drive
            </li>
            <li>
              <kbd>DRAG</kbd>Look
            </li>
          </ul>
        </aside>
      )}
      {guide && !titleScreen && !active && !directory && (
        <aside className="city-guide" aria-labelledby="guide-heading">
          <div className="city-guide-avatar" aria-hidden="true">✳</div>
          <div className="city-guide-copy">
            <p>YOUR FIRST DAY IN BUILDVERSE <span>01 / ARRIVAL</span></p>
            <h2 id="guide-heading">Hey, welcome to my little world.</h2>
            <p>I’m Anush. Every building here is something I’ve built, learned, or am working on. Where should we begin?</p>
            <div className="city-guide-actions">
              <button onClick={() => { setGuide(false); visit("interview-ace"); }}>01 · InterviewAce ↗</button>
              <button onClick={() => { setGuide(false); visit("relay-voice"); }}>02 · AI calling ↗</button>
              <button onClick={() => { setGuide(false); setPlace("courtyard"); setEnterVersion(v => v + 1); }}>03 · After hours ↗</button>
              <button className="city-guide-skip" onClick={() => setGuide(false)}>I’ll explore · close guide</button>
            </div>
          </div>
        </aside>
      )}
      {active && (
        <aside
          className={`city-floor-panel ${expanded ? "is-expanded" : ""}`}
          style={{ "--district-color": active.color } as React.CSSProperties}
        >
          <button
            type="button"
            className="city-floor-heading"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="city-floor-list"
          >
            <span>
              <small>
                {snapshot.mode === "building"
                  ? "BUILDING EXTERIOR"
                  : "YOU ARE INSIDE"}
              </small>
              <strong>{active.name}</strong>
            </span>
            {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
          <div
            id="city-floor-list"
            className="city-floor-list"
            role="group"
            aria-label={`Floors in ${active.name}`}
          >
            {active.floors.map((label, index) => (
              <button
                type="button"
                key={label}
                aria-pressed={floor === index && snapshot.mode === "room"}
                onClick={() => visit(active.id, index)}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="city-floor-actions">
            <button
              type="button"
              className="city-primary"
              onClick={() =>
                snapshot.mode === "building"
                  ? visit(active.id, floor)
                  : openDossier()
              }
            >
              <BookOpen size={15} />
              {snapshot.mode === "building" ? "Enter floor" : "Read dossier"}
            </button>
            <button
              type="button"
              className="city-secondary"
              onClick={() => engine.current?.inspect(active.id)}
            >
              <Building2 size={15} />
              Exterior
            </button>
            <button
              type="button"
              className="city-secondary"
              onClick={goWalking}
            >
              <ArrowDown size={15} />
              Exit to street
            </button>
            {route && (
              <button
                type="button"
                className="city-secondary"
                onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true), () => setCopied(false))}
              >
                <Link2 size={15} />
                {copied ? "Copied" : "Copy link"}
              </button>
            )}
          </div>
        </aside>
      )}
      <CityMinimap
        position={snapshot.position}
        heading={snapshot.heading}
        active={active?.id ?? null}
        car={snapshot.car}
        driving={snapshot.driving}
        waypoint={route ? null : waypoint}
        onOpen={() => setDirectory(true)}
      />
      {currentMission && mission && !snapshot.activity && !titleScreen && !route && (
        <div className="city-objective" role="status">
          <small>
            MISSION {mission.index + 1}/{cityMissions.length}
          </small>
          <strong>{currentMission.title}</strong>
          <p>
            Go to <b>{buildingName(currentMission.stops[mission.stop])}</b>
            <span>{Math.round(waypointDistance)}m</span>
          </p>
          <i
            style={{
              width: `${(mission.stop / currentMission.stops.length) * 100}%`,
            }}
          />
        </div>
      )}
      {!snapshot.activity && (snapshot.mode === "street" || snapshot.mode === "room") && (
        <DirectionPad onMove={(point) => engine.current?.setMovement(point)} />
      )}
      <div
        className={`city-speed ${snapshot.sprinting ? "is-on" : ""}`}
        aria-hidden="true"
      />
      <div className="city-levelup" role="status">
        {banner && (
          <div key={banner.id}>
            <strong>{banner.title}</strong>
            {banner.stars !== undefined && (
              <span aria-hidden="true">
                {"★".repeat(banner.stars)}
                <i>{"★".repeat(5 - banner.stars)}</i>
              </span>
            )}
            <p>{banner.sub}</p>
          </div>
        )}
      </div>
      <div className="city-hover-note" role="status">
        {hover && (
          <>
            <span className="city-signal" />
            {hover}
          </>
        )}
      </div>
      <footer className="city-bottom-hud">
        <div className="city-travel-controls">
          <button
            type="button"
            onClick={goOverview}
            className={snapshot.mode === "overview" ? "active" : ""}
          >
            <Home size={17} />
            <span>City overview</span>
          </button>
          <button
            type="button"
            onClick={goWalking}
            className={snapshot.mode === "street" ? "active" : ""}
          >
            <Footprints size={17} />
            <span>Walk</span>
          </button>
          <button type="button" onClick={() => setDirectory(true)}>
            <Map size={17} />
            <span>Directory</span>
          </button>
          <button type="button" className="city-mobile-activities" onClick={() => setActivityMenu(true)}>
            <Star size={17} />
            <span>Activities</span>
          </button>
        </div>
        <div className="city-interact">
          {snapshot.activity ? <span>{snapshot.activity.stage === "riding" ? "SEATED" : "AT THE DOCK"} · ESC TO RETURN TO THE STREET</span> : snapshot.driving ? (
            <button type="button" onClick={() => engine.current?.toggleCar()}>
              <kbd>F</kbd>Exit car
              <span className="city-interact-hint">
                SHIFT BOOST · SPACE HANDBRAKE
              </span>
            </button>
          ) : snapshot.nearCar && snapshot.mode === "street" ? (
            <button type="button" onClick={() => engine.current?.toggleCar()}>
              <kbd>F</kbd>Get in the car
              <CarFront size={14} />
            </button>
          ) : snapshot.mode === "room" ? (
            <button type="button" onClick={openDossier}>
              <kbd>E</kbd>Read this floor’s dossier
              <ArrowUpRight size={14} />
            </button>
          ) : nearby ? (
            <button type="button" onClick={() => visit(nearby.id, 0)}>
              <kbd>E</kbd>Enter {nearby.name}
              <ArrowUpRight size={14} />
            </button>
          ) : (
            <span>
              {snapshot.mode === "street"
                ? "WASD MOVE · SHIFT SPRINT · SPACE JUMP · F DRIVE"
                : "SELECT A BUILDING OR A FACADE FLOOR TO ENTER"}
            </span>
          )}
        </div>
        <button type="button" className="city-passport" aria-label={`Open discovery journal, ${discoveries.length} secrets found`} onClick={() => { setSelectedDiscovery(null); setJournal(true); }}>
          <span>
            {String(visited.length).padStart(2, "0")}
            <small> / {cityBuildings.length}</small>
          </span>
          <p>ADDRESSES · {discoveries.length}/4 SECRETS</p>
        </button>
      </footer>
      <button className="city-activity-launch" type="button" onClick={() => setActivityMenu(true)}>✳ Things to do</button>
      {snapshot.nearbyActivity && !snapshot.activity && !titleScreen && !route && (
        <button className="city-activity-nearby" type="button" onClick={() => { launchActivity(snapshot.nearbyActivity!); }}>
          <kbd>E</kbd> {activities.find(a => a.id === snapshot.nearbyActivity)?.name}
        </button>
      )}
      {snapshot.activity && (
        <aside className="city-ride-hud" aria-label="Current activity">
          <small>{snapshot.activity.stage === "calling" ? "ON THE WAY TO YOUR DOCK" : snapshot.activity.stage === "ready" ? "READY TO BOARD" : "TAKE A MOMENT. ENJOY THE VIEW."}</small>
          <h2>{snapshot.activity.stage === "riding" && snapshot.activity.id === "plane" ? "Sightseeing flight" : snapshot.activity.stage === "riding" && snapshot.activity.id === "boat" ? "Coastal cruise" : activities.find(a => a.id === snapshot.activity?.id)?.name}</h2>
          <p>{snapshot.activity.stage === "calling" ? "Your ride is approaching. It will be ready in a few seconds." : snapshot.activity.stage === "ready" ? "Your ride has arrived. Hop aboard when you’re ready." : snapshot.activity.id === "cinema" ? "An original animated landscape and coding reel, playing on the outdoor screen." : "You’re seated. Leave whenever you like to return to your starting point."}</p>
          {snapshot.activity.stage === "ready" && <button type="button" onClick={() => engine.current?.boardActivity()}>Board {snapshot.activity.id} · E</button>}
          {snapshot.activity.stage === "riding" && (snapshot.activity.id === "plane" || snapshot.activity.id === "boat") && <button type="button" aria-pressed={!!snapshot.activity.passenger} onClick={() => engine.current?.toggleActivityView()}>{snapshot.activity.passenger ? "Outside view" : "View from seat"}</button>}
          <button type="button" onClick={() => engine.current?.leaveActivity()}>{snapshot.activity.stage === "riding" ? "Leave activity" : "Cancel pickup"} · Esc</button>
        </aside>
      )}
      <CityDialog open={activityMenu} onClose={() => setActivityMenu(false)} label="Things to do in Buildverse" side="directory">
        <div className="city-activity-menu">
          <small>AFTER HOURS / MAKE YOURSELF AT HOME</small>
          <h2>A city you can live in.</h2>
          <p>Pick a place to take a seat. Plane and boat pickups arrive at the waterfront dock before you board.</p>
          {activities.map(item => <button type="button" key={item.id} onClick={() => {
            launchActivity(item.id);
          }}><strong>{item.name} ↗</strong><span>{item.detail}</span></button>)}
        </div>
      </CityDialog>
      <CityDirectory
        open={directory}
        onClose={() => setDirectory(false)}
        onVisit={(id) => visit(id, 0)}
        onExplore={unavailable ? undefined : (id) => { setDirectory(false); setHelp(false); setTravel("walk"); setPlace(id); setEnterVersion(value => value + 1); updateRoute(null); }}
        visited={visited}
        illustrated={illustrated}
        showLabels={showLabels}
        renderingAvailable={ready && !unavailable}
        onIllustrated={() => setIllustrated(value => !value)}
        onLabels={() => setShowLabels(value => !value)}
        onJournal={() => { setDirectory(false); setSelectedDiscovery(null); setJournal(true); }}
      />
      <DiscoveryJournal open={journal} onClose={() => setJournal(false)} found={discoveries} selected={selectedDiscovery} onDiscover={discover} />
      <Dossier
        building={active}
        floor={floor}
        open={!!route?.reading}
        onClose={closeDossier}
        onFloor={(next) => active && visit(active.id, next, true)}
      />
    </main>
  );
}
