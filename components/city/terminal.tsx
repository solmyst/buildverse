"use client";
import { useEffect, useRef, useState } from "react";
import { personal } from "@/lib/data";
import {
  complete,
  formatLog,
  formatRepos,
  runCommand,
  type PushEvent,
  type Repo,
  type TermAction,
  type TermLine,
} from "@/lib/terminal";

const user = personal.github.split("/").pop();
const welcome: TermLine[] = [
  { text: "Buildverse OS 1.0 — anush@buildverse", tone: "accent" },
  { text: "A portfolio you can type into. Click a suggestion, or type 'help'.", tone: "dim" },
  { text: "" },
  { text: "  ls           what I've built", run: "ls" },
  { text: "  tour         60-second autopilot", run: "tour" },
  { text: "  skills react where I used a skill", run: "skills react" },
  { text: "  repos        my GitHub, live", run: "repos" },
  { text: "  hire         how to reach me", run: "hire" },
];
const github = async (path: string) => {
  const response = await fetch(`https://api.github.com/users/${user}/${path}`);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
};

// A command line over the city: every answer is also a click target, so it works without typing.
export default function Terminal({ open, onClose, onAction }: { open: boolean; onClose: () => void; onAction: (action: TermAction) => void }) {
  const [lines, setLines] = useState<TermLine[]>(welcome);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);
  const append = (more: TermLine[]) => setLines((list) => [...list, ...more]);
  async function fetchGithub(what: "repos" | "log") {
    try {
      const data = await github(what === "repos" ? "repos?per_page=100&sort=pushed" : "events/public?per_page=50");
      append(what === "repos" ? formatRepos(data as Repo[]) : formatLog(data as PushEvent[]));
    } catch {
      append([{ text: "GitHub did not answer (offline or rate limited). Try again in a minute, or open github.com/" + user, tone: "warn", href: personal.github }]);
    }
  }
  function run(command: string) {
    const result = runCommand(command, history);
    setHistory((list) => (command.trim() ? [...list, command.trim()] : list));
    setCursor(null);
    setValue("");
    if (result.actions.some((action) => action.type === "clear")) setLines([]);
    else append([{ text: `$ ${command}`, tone: "dim" }, ...result.lines]);
    for (const action of result.actions) {
      if (action.type === "github") void fetchGithub(action.what);
      else if (action.type !== "clear") onAction(action);
    }
  }
  function key(event: React.KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();
    if (event.key === "Escape") onClose();
    else if (event.key === "Enter") {
      // Without this the same Enter then activates whatever the command focused, such as a dialog's close button.
      event.preventDefault();
      run(value);
    }
    else if (event.key === "Tab") {
      event.preventDefault();
      const options = complete(value);
      if (options.length === 1) setValue(options[0] + " ");
      else if (options.length > 1) append([{ text: options.join("   "), tone: "dim" }]);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (!history.length) return;
      const next = event.key === "ArrowUp" ? Math.max(0, (cursor ?? history.length) - 1) : (cursor ?? history.length) + 1;
      setCursor(next >= history.length ? null : next);
      setValue(next >= history.length ? "" : history[next]);
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  }
  if (!open) return null;
  return (
    <section className="city-term" aria-label="Terminal" onClick={() => input.current?.focus()}>
      <header>
        <span aria-hidden="true"><i /><i /><i /></span>
        <b>anush@buildverse: ~</b>
        <button type="button" onClick={onClose} aria-label="Close terminal (Esc)">esc</button>
      </header>
      <div className="city-term-out" ref={scroller} role="log" aria-live="polite">
        {lines.map((line, index) => {
          const className = `city-term-line ${line.tone ? `tone-${line.tone}` : ""}`;
          if (line.run) return <button key={index} type="button" className={`${className} is-link`} onClick={(event) => { event.stopPropagation(); run(line.run!); }}>{line.text}</button>;
          if (line.href) return <a key={index} className={`${className} is-link`} href={line.href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>{line.text}</a>;
          return <div key={index} className={className}>{line.text || " "}</div>;
        })}
      </div>
      <label className="city-term-prompt">
        <span aria-hidden="true">$</span>
        <input
          ref={input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={key}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Type a command"
          placeholder="type a command, or click a suggestion"
        />
      </label>
    </section>
  );
}
