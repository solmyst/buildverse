"use client";
import { useEffect, useState } from "react";
import { personal } from "@/lib/data";
import { ago, latestPush, type PushEvent } from "@/lib/terminal";

const key = "solmyst-pulse";
// A small proof the portfolio is alive: the newest public push, fetched from GitHub.
export default function GithubPulse() {
  const [push, setPush] = useState<ReturnType<typeof latestPush>>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const cached = sessionStorage.getItem(key);
        const events: PushEvent[] = cached ? JSON.parse(cached) : await (await fetch(`https://api.github.com/users/${personal.github.split("/").pop()}/events/public?per_page=30`)).json();
        if (!cached && Array.isArray(events)) sessionStorage.setItem(key, JSON.stringify(events));
        if (live && Array.isArray(events)) setPush(latestPush(events));
      } catch {
        /* Offline or rate limited: the chip simply stays hidden. */
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  if (!push) return null;
  return (
    <a className="city-pulse" href={`${personal.github}/${push.repo}`} target="_blank" rel="noopener noreferrer">
      <i aria-hidden="true" /> Shipping now · last push to <b>{push.repo}</b> {ago(push.when)}
    </a>
  );
}
