import { projects, labProjects, personal, skillGroups, experiences, currently } from "@/lib/data";
import { cityBuildings, holdsProjects } from "@/lib/city-layout";
import { floorContent, nextProject } from "@/lib/city-content";

export type TermLine = {
  text: string;
  tone?: "dim" | "ok" | "warn" | "accent";
  // Clicking the line runs this command, so the terminal works without typing.
  run?: string;
  href?: string;
};
export type TermAction =
  | { type: "visit"; id: string; floor?: number }
  | { type: "tour" | "hire" | "night" | "day" | "xray" | "perf" | "overview" | "clear" | "unhighlight" }
  | { type: "open"; href: string }
  | { type: "highlight"; ids: string[] }
  | { type: "github"; what: "repos" | "log" };
export type TermResult = { lines: TermLine[]; actions: TermAction[] };
export type Repo = { name: string; description: string | null; stargazers_count: number; language: string | null; pushed_at: string; html_url: string; fork: boolean };
export type PushEvent = { type: string; created_at: string; repo: { name: string }; payload: { commits?: { message: string }[] } };

const out = (lines: TermLine[], ...actions: TermAction[]): TermResult => ({ lines, actions });
const say = (text: string, tone?: TermLine["tone"]): TermLine => ({ text, tone });
const blank = say("");
const projectBuildings = cityBuildings.filter(holdsProjects);
// Every project with the building and floor that hold it, so a lab build is as reachable as a case study.
const allWork = [
  ...projects.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, status: p.status as string, stack: p.stack, building: p.id, floor: 0 })),
  ...labProjects.map((p, floor) => ({ id: p.id, name: p.name, tagline: p.tagline, status: p.status, stack: p.stack, building: "lab", floor })),
];

export const commands = [
  "help", "whoami", "ls", "cd", "cat", "skills", "stack", "neofetch", "repos", "git", "hire", "resume",
  "contact", "tour", "night", "day", "xray", "perf", "overview", "clear", "history", "jobs", "certs", "fun",
] as const;

// The newest push in a public event feed, for the "shipping now" chip.
export function latestPush(events: PushEvent[]) {
  const event = events.find((item) => item.type === "PushEvent");
  if (!event) return null;
  return { repo: event.repo.name.split("/").pop() ?? "", when: new Date(event.created_at), message: event.payload.commits?.at(-1)?.message.split("\n")[0] ?? "" };
}
export function ago(then: Date, now = new Date()) {
  const minutes = Math.max(0, Math.round((+now - +then) / 60000));
  if (minutes < 60) return `${minutes || 1}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

// Matches an id, a name or a fragment of either ("relay", "krate", "daykit"), and says which floor to open.
export function findTarget(query: string): { building: (typeof cityBuildings)[number]; floor: number } | null {
  const q = query.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!q) return null;
  const work = allWork.find((item) => item.id === q) ?? allWork.find((item) => item.id.includes(q) || item.name.toLowerCase().replace(/\s+/g, "-").includes(q));
  const found =
    cityBuildings.find((building) => building.id === q) ??
    (work && cityBuildings.find((building) => building.id === work.building)) ??
    cityBuildings.find((building) => building.id.includes(q) || building.name.toLowerCase().replace(/\s+/g, "-").includes(q)) ??
    null;
  return found ? { building: found, floor: found.kind === "lab" ? (work?.floor ?? 0) : 0 } : null;
}
export const findBuilding = (query: string) => findTarget(query)?.building ?? null;

// Every technology named in a project stack, with the projects that prove it.
export function techIndex() {
  const index = new Map<string, Set<string>>();
  for (const work of allWork)
    for (const tech of work.stack) {
      const key = tech.toLowerCase();
      if (!index.has(key)) index.set(key, new Set());
      index.get(key)!.add(work.id);
    }
  return index;
}
export function projectsUsing(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allWork.filter((work) => work.stack.some((tech) => tech.toLowerCase().includes(q)));
}

function nearest(word: string) {
  const distance = (a: string, b: string) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const keep = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = keep;
      }
    }
    return row[b.length];
  };
  const best = [...commands].sort((a, b) => distance(word, a) - distance(word, b))[0];
  return distance(word, best) <= 2 ? best : null;
}

export function complete(prefix: string): string[] {
  const [first, ...rest] = prefix.trimStart().split(/\s+/);
  if (rest.length === 0) return commands.filter((name) => name.startsWith(first));
  if (["cd", "cat"].includes(first)) return cityBuildings.filter((b) => b.id.startsWith(rest.join("-"))).map((b) => `${first} ${b.id}`);
  return [];
}

function brief(id: string): TermResult {
  const target = findTarget(id);
  if (!target) return out([say(`cat: ${id}: no such address. Try 'ls'.`, "warn")]);
  const { building, floor } = target;
  const content = floorContent(building, floor);
  const lines: TermLine[] = [say(`# ${building.name}`, "accent"), say(content.subtitle, "dim"), blank];
  for (const row of content.glance ?? []) lines.push(say(`${row.label.padEnd(12)} ${row.text}`));
  if (!content.glance) for (const section of content.sections.slice(0, 2)) lines.push(say(section.heading, "accent"), say(section.text ?? section.bullets?.join(" · ") ?? ""));
  lines.push(blank, { text: `→ cd ${building.kind === "lab" ? labProjects[floor].id : building.id}   (open the full story in the city)`, tone: "ok", run: `cd ${building.kind === "lab" ? labProjects[floor].id : building.id}` });
  return out(lines);
}

function skills(arg: string): TermResult {
  if (arg) {
    const hits = projectsUsing(arg);
    if (!hits.length) return out([say(`No project lists "${arg}" in its stack. Try 'stack' for everything I used.`, "warn")], { type: "unhighlight" });
    return out(
      [
        say(`${arg} appears in ${hits.length} of ${allWork.length} projects. The buildings are lit up in the city:`, "ok"),
        ...hits.map((work) => ({ text: `  ${work.name.padEnd(26)} ${work.tagline}`, run: `cd ${work.id}` })),
        blank,
        say("Click a line to open that project.", "dim"),
      ],
      { type: "overview" },
      { type: "highlight", ids: Array.from(new Set(hits.map((work) => work.building))) },
    );
  }
  const lines: TermLine[] = [];
  for (const group of skillGroups) lines.push(say(`${group.label.padEnd(12)} ${group.skills.map((skill) => skill.name).join(", ")}`));
  lines.push(blank, say("Pick one to see where I actually used it:", "dim"), { text: "  skills react   skills python   skills typescript   skills go", run: "skills react", tone: "accent" });
  return out(lines);
}

function stack(): TermResult {
  const entries = Array.from(techIndex().entries()).sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  const lines: TermLine[] = [say("Every technology in my projects, most used first. Click one:", "dim"), blank];
  for (const [tech, ids] of entries.slice(0, 14)) lines.push({ text: `  ${"█".repeat(ids.size * 2).padEnd(10)} ${tech} (${ids.size})`, run: `skills ${tech}`, tone: ids.size > 1 ? "accent" : undefined });
  return out(lines);
}

function neofetch(): TermResult {
  const logo = ["   ▄▄▄▄▄   ", "  █ ✳ ✳ █  ", "  █  ▀▀  █ ", "   ▀▀▀▀▀   "];
  const info = [
    `${personal.name.toLowerCase().replace(/\s+/g, "")}@buildverse`,
    "─".repeat(24),
    `Role      ${personal.terminalProfile.roles.join(" + ")}`,
    `Uptime    ${personal.year}`,
    `Shell     ${personal.terminalProfile.stack.join(" · ")}`,
    `Projects  ${allWork.length} built, ${projectBuildings.length} buildings`,
    `Learning  ${personal.terminalProfile.learning.join(", ")}`,
    `Status    ${personal.terminalProfile.status}`,
    `Open to   ${personal.openTo}`,
  ];
  return out([...info.map((text, i) => say(`${logo[i] ?? "           "}  ${text}`, i < 2 ? "accent" : undefined)), blank, { text: "try: help · ls · skills · tour · hire", tone: "dim" }]);
}

export function formatRepos(repos: Repo[]): TermLine[] {
  const own = repos.filter((repo) => !repo.fork).sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at)).slice(0, 10);
  if (!own.length) return [say("No public repos found.", "warn")];
  return [
    say(`${personal.handle} on GitHub, live (${own.length} most recently pushed):`, "ok"),
    ...own.map((repo) => ({
      text: `  ${repo.name.padEnd(24)} ${(repo.language ?? "—").padEnd(12)} ★${repo.stargazers_count}  ${repo.description ?? ""}`.trimEnd(),
      href: repo.html_url,
    })),
    blank,
    say("Click a line to open the repo.", "dim"),
  ];
}
export function formatLog(events: PushEvent[]): TermLine[] {
  const commits = events
    .filter((event) => event.type === "PushEvent")
    .flatMap((event) => (event.payload.commits ?? []).map((commit) => ({ repo: event.repo.name.split("/").pop() ?? "", date: event.created_at.slice(0, 10), message: commit.message.split("\n")[0] })))
    .slice(0, 10);
  if (!commits.length) return [say("No recent public commits.", "warn")];
  return [say("Latest public commits, straight from GitHub:", "ok"), ...commits.map((commit) => say(`  ${commit.date}  ${commit.repo.padEnd(22)} ${commit.message}`))];
}

function help(): TermResult {
  const row = (name: string, text: string): TermLine => ({ text: `  ${name.padEnd(18)} ${text}`, run: name.split(" ")[0] });
  return out([
    say("Commands (click any, or type and press Tab to complete):", "dim"),
    row("ls", "list my projects"),
    row("cat <project>", "read a project's brief here"),
    row("cd <project>", "fly to it and open the full story"),
    row("skills [tech]", "where I used a technology"),
    row("stack", "everything I've built with"),
    row("repos", "my GitHub repos, live"),
    row("git log", "my latest commits, live"),
    row("whoami", "the short version"),
    row("neofetch", "system info, but it's me"),
    row("jobs", "where I've worked, and what I shipped"),
    row("certs", "certifications"),
    row("fun", "outside of code"),
    row("tour", "the 60-second autopilot tour"),
    row("hire", "how to reach me"),
    row("night / day / xray / perf", "play with the engine"),
  ]);
}

export function runCommand(input: string, history: string[] = []): TermResult {
  const raw = input.trim();
  if (!raw) return out([]);
  const [name, ...args] = raw.split(/\s+/);
  const arg = args.join(" ");
  const command = name.toLowerCase();
  if (raw === "rm -rf /" || raw === "sudo rm -rf /") return out([say("Nice try. There's no root here, only a Hire card.", "warn"), say("  Permission denied: this portfolio is read-only, like a good production database.", "dim")]);
  if (command === "sudo") return /hire/.test(arg) ? out([say("[sudo] password for recruiter: ********", "dim"), say("Access granted. 😄", "ok")], { type: "hire" }) : out([say("sudo: you're already the most powerful person here, you're the reader.", "dim")]);
  switch (command) {
    case "help": case "?": return help();
    case "whoami": return out([say(personal.name, "accent"), say(`${personal.terminalProfile.roles.join(" + ")} · ${personal.year}`), say(personal.terminalProfile.status, "dim"), say(`Open to ${personal.openTo}.`, "ok")]);
    case "ls": return out([
      say(`${allWork.length} projects. Click one or type 'cat <name>':`, "dim"),
      ...allWork.map((work) => ({ text: `  ${work.id.padEnd(20)} ${work.status.padEnd(11)} ${work.tagline}`, run: `cat ${work.id}` })),
      blank,
      ...experiences.map((job) => say(`  ${job.company.padEnd(20)} ${job.period.padEnd(14)} ${job.role}`, "dim")),
    ]);
    case "cat": return arg ? brief(arg) : out([say("usage: cat <project>   e.g. cat krate", "warn")]);
    case "cd": {
      const target = findTarget(arg);
      if (!target) return out([say(arg ? `cd: ${arg}: no such address. Try 'ls'.` : "usage: cd <project>   e.g. cd krate", "warn")]);
      const { building, floor } = target;
      const next = nextProject(building.id);
      return out([say(`Flying to ${building.kind === "lab" ? labProjects[floor].name : building.name}…`, "ok"), say(next ? `Up next: ${next.name}` : "That's the last project.", "dim")], { type: "visit", id: building.id, floor });
    }
    case "skills": return skills(arg);
    case "stack": return stack();
    case "neofetch": case "fetch": return neofetch();
    case "repos": return out([say("Fetching from api.github.com…", "dim")], { type: "github", what: "repos" });
    case "git": return /^log/.test(arg) ? out([say("Fetching from api.github.com…", "dim")], { type: "github", what: "log" }) : out([say("git: only 'git log' works here. This portfolio is read-only.", "warn")]);
    case "hire": case "contact": return out([say("Opening the contact card.", "ok"), say(`${personal.email}`, "accent")], { type: "hire" });
    case "resume": return out([say("Opening resume.pdf", "ok")], { type: "open", href: personal.resume });
    case "tour": return out([say("Starting the 60-second tour. Esc stops it.", "ok")], { type: "tour" });
    case "night": return out([say("Lights out.", "ok")], { type: "night" });
    case "day": return out([say("Sunrise.", "ok")], { type: "day" });
    case "xray": return out([say("Blueprint view toggled. Press X in the city to switch back.", "ok")], { type: "xray" });
    case "perf": return out([say("Engine panel toggled. It shows live draw calls, fps and the GPU.", "ok")], { type: "perf" });
    case "overview": return out([say("Back to the skyline.", "ok")], { type: "overview" }, { type: "unhighlight" });
    case "clear": return out([], { type: "clear" });
    case "jobs": return out(experiences.flatMap((job) => [say(`${job.role} @ ${job.company}`, "accent"), say(`${job.period} · ${job.location}`, "dim"), ...job.achievements.slice(0, 3).map((line) => say(`  • ${line}`)), blank]));
    case "certs": return out(personal.certifications.map((line) => say(`  ✓ ${line}`)));
    case "fun": return out([say(personal.outsideCode)]);
    case "history": return out(history.map((line, i) => say(`  ${String(i + 1).padStart(3)}  ${line}`, "dim")));
    case "exit": case "quit": return out([say("There is no exit. Only the city. (Press Esc to close this.)", "dim")]);
    case "currently": return out(Object.entries(currently).map(([key, value]) => say(`  ${key}: ${value}`)));
  }
  const guess = nearest(command);
  return out([{ text: `${name}: command not found.${guess ? ` Did you mean '${guess}'?` : ""} Type 'help'.`, tone: "warn", run: guess ?? "help" }]);
}
