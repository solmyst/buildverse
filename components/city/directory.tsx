"use client";
import { useState } from "react";
import { ArrowUpRight, Building2, Search } from "lucide-react";
import { cityBuildings } from "@/lib/city-layout";
import { valleyPlaces } from "@/lib/valley-motion";
import CityDialog from "./dialog";
export default function CityDirectory({
  open,
  onClose,
  onVisit,
  onExplore,
  onJournal,
  visited, illustrated, showLabels, renderingAvailable, onIllustrated, onLabels,
}: {
  open: boolean;
  onClose: () => void;
  onVisit: (id: string) => void;
  visited: string[];
  illustrated: boolean; showLabels: boolean; renderingAvailable: boolean;
  onIllustrated: () => void; onLabels: () => void;
  onExplore?: (id: string) => void;
  onJournal: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All addresses");
  const results = cityBuildings.filter(
    (building) =>
      (filter === "All addresses" ||
        (filter === "Projects"
          ? building.kind === "project"
          : building.kind !== "project")) &&
      `${building.name} ${building.floors.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const places = onExplore && filter !== "Projects" ? valleyPlaces.filter(place => `${place.name} ${place.detail}`.toLowerCase().includes(query.toLowerCase())) : [];
  return (
    <CityDialog
      open={open}
      onClose={onClose}
      label="City directory"
      side="directory"
    >
      <div className="directory-intro">
        <p className="city-kicker">ANUSH’S DATA SOCIETY</p>
        <h2>
          Everything has
          <br />
          an address.
        </h2>
        <p>Choose a building. Take the elevator. Step inside the story.</p>
      </div>
      <div className="directory-controls">
        <label>
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a building or a floor"
            aria-label="Search city destinations"
          />
        </label>
        <div role="group" aria-label="Filter city destinations">
          {["All addresses", "Projects", "Life & work"].map((label) => (
            <button
              type="button"
              key={label}
              aria-pressed={filter === label}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="city-directory-count" role="status">
        {results.length + places.length} destinations
      </p>
      <div className="directory-buildings">
        {places.map(place => <button type="button" key={place.id} onClick={() => onExplore?.(place.id)} aria-label={`Explore ${place.name}`}><span className="directory-building-icon">✿</span><span><strong>{place.name}</strong><small>{place.detail}</small></span><ArrowUpRight size={16}/></button>)}
        {results.map((building) => (
          <button
            type="button"
            key={building.id}
            onClick={() => onVisit(building.id)}
            style={
              { "--district-color": building.color } as React.CSSProperties
            }
            aria-label={`Visit ${building.name}`}
          >
            <span className="directory-building-icon">
              <Building2 size={20} />
            </span>
            <span>
              <strong>{building.name}</strong>
              <small>
                {building.floors.length} floors ·{" "}
                {building.kind === "project"
                  ? "Project building"
                  : "Life & work"}
                {visited.includes(building.id) ? " · Visited" : ""}
              </small>
            </span>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      {results.length === 0 && places.length === 0 && (
        <div className="directory-empty">
          <p>No address found.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("All addresses");
            }}
          >
            Reset directory
          </button>
        </div>
      )}
      <div className="city-view-options" role="group" aria-label="World appearance">
        <button type="button" className="city-secondary" disabled={!renderingAvailable} aria-pressed={illustrated} onClick={onIllustrated}>Illustrated rendering {illustrated ? "On" : "Off"}</button>
        <button type="button" className="city-secondary" disabled={!renderingAvailable} aria-pressed={showLabels} onClick={onLabels}>Show all building names {showLabels ? "On" : "Off"}</button>
      </div>
      <button type="button" className="city-secondary" onClick={onJournal}>Open discovery journal</button>
      <p className="directory-note">
        The directory also works when the 3D view is unavailable. Every
        destination’s written content is accessible here.
      </p>
    </CityDialog>
  );
}
