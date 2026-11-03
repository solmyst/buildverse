"use client";
import { useState } from "react";
import { ArrowUpRight, Copy, Mail, Play } from "lucide-react";
import { personal } from "@/lib/data";
import CityDialog from "./dialog";
export default function HireCard({
  open,
  onClose,
  onTour,
  stars,
}: {
  open: boolean;
  onClose: () => void;
  onTour: () => void;
  stars: number;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <CityDialog open={open} onClose={onClose} label="Hire Anush" side="dossier">
      <div className="city-hire-card">
        <p className="city-kicker">{stars ? `HIRE LEVEL ${stars} / 5` : "LET’S TALK"}</p>
        <h2>{personal.name}</h2>
        <p>
          {personal.year}. Open to {personal.openTo}.
        </p>
        <div className="city-hire-actions">
          <a className="city-primary" href={`mailto:${personal.email}`}>
            <Mail size={15} />
            Email me
          </a>
          <button
            type="button"
            className="city-secondary"
            onClick={() =>
              navigator.clipboard?.writeText(personal.email).then(() => setCopied(true), () => setCopied(false))
            }
          >
            <Copy size={15} />
            {copied ? "Copied" : personal.email}
          </button>
          <a className="city-secondary" href={personal.resume} target="_blank" rel="noopener noreferrer">
            Resume <ArrowUpRight size={14} />
          </a>
          <a className="city-secondary" href={personal.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn <ArrowUpRight size={14} />
          </a>
          <a className="city-secondary" href={personal.github} target="_blank" rel="noopener noreferrer">
            GitHub <ArrowUpRight size={14} />
          </a>
        </div>
        <button type="button" className="city-recruiter-link" onClick={onTour}>
          <Play size={13} /> Replay the 60-second tour
        </button>
      </div>
    </CityDialog>
  );
}
