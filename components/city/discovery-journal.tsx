"use client";
import { useEffect, useRef } from "react";
import CityDialog from "./dialog";
import { discoveryItems, type DiscoveryId } from "@/lib/city-discoveries";
import { personal, proofStats } from "@/lib/data";
export default function DiscoveryJournal({ open, onClose, found, selected, onDiscover }: {
  open: boolean; onClose: () => void; found: DiscoveryId[]; selected: DiscoveryId | null;
  onDiscover: (id: string) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (open && selected) heading.current?.focus(); }, [open, selected]);
  const item = discoveryItems.find(entry => entry.id === selected);
  const practice = proofStats.find(stat => stat.label.includes("DSA"));
  return <CityDialog open={open} onClose={onClose} label="Discovery journal" side="dossier">
    <div className="city-journal-body">
      <p className="city-kicker">SOL / SOLMYST · {found.length} / {discoveryItems.length} SECRETS</p>
      <h2 ref={heading} tabIndex={-1}>{item?.title ?? "A few things beyond the résumé."}</h2>
      {selected === "guitar" && <p>{personal.outsideCode}</p>}
      {selected === "pitwall" && <p>I’m an F1 fan. The miniature race car and Pit Wall Garage are a tribute to the engineering behind race weekends.</p>}
      {selected === "golden-bug" && <p>{practice?.value} {practice?.label}. A golden bug for the habit of solving one more problem.</p>}
      {selected === "konami" && <p>You found the classic cheat code. Gaming is part of my life, and curiosity gets rewarded here. Player two: welcome to Buildverse.</p>}
      <p className="city-journal-intro">Explore the guitar, miniature race car, and arcade in Solmyst Courtyard. Select an object in 3D, or inspect it below.</p>
      <ul className="city-journal-list">{discoveryItems.map(entry => <li key={entry.id}>
        <strong>{found.includes(entry.id) ? "✦ " : "◇ "}{found.includes(entry.id) ? entry.title : "Undiscovered"}</strong>
        <p>{entry.hint}</p>
        {entry.inspect && <button type="button" className="city-secondary" onClick={() => onDiscover(entry.id)}>{entry.inspect}</button>}
      </li>)}</ul>
    </div>
  </CityDialog>;
}
