import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const load = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const url = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const data = url(load("../lib/data.ts"));
const layout = url(load("../lib/city-layout.ts"));
const content = url(load("../lib/city-content.ts").replaceAll('"@/lib/data"', `"${data}"`).replaceAll('"@/lib/city-layout"', `"${layout}"`));
const term = url(load("../lib/terminal.ts").replaceAll('"@/lib/data"', `"${data}"`).replaceAll('"@/lib/city-layout"', `"${layout}"`).replaceAll('"@/lib/city-content"', `"${content}"`));
const { runCommand, complete, findBuilding, projectsUsing, formatRepos, formatLog } = await import(term);
const { projects } = await import(data);
const text = (result) => result.lines.map((line) => line.text).join("\n");
test("ls lists every project and each line is clickable", () => {
  const result = runCommand("ls");
  for (const project of projects) assert.ok(result.lines.some((line) => line.run === `cat ${project.id}`), project.id);
});
test("cd flies to a project by id or fuzzy name", () => {
  assert.deepEqual(runCommand("cd krate").actions, [{ type: "visit", id: "krate" }]);
  assert.equal(findBuilding("relay").id, "relay-voice");
  assert.match(text(runCommand("cd nope")), /no such address/);
});
test("cat prints the brief without leaving the terminal", () => {
  const result = text(runCommand("cat interview-ace"));
  assert.match(result, /The problem/);
  assert.match(result, /Result/);
});
test("skills <tech> proves a skill with projects and highlights their buildings", () => {
  const result = runCommand("skills react");
  const ids = result.actions.find((action) => action.type === "highlight").ids;
  assert.deepEqual(ids.sort(), projectsUsing("react").map((project) => project.id).sort());
  assert.ok(ids.length >= 2);
  assert.equal(runCommand("skills cobol").actions[0].type, "unhighlight");
});
test("unknown commands suggest the nearest real one, easter eggs answer", () => {
  assert.match(text(runCommand("hlep")), /Did you mean 'help'/);
  assert.deepEqual(runCommand("sudo hire me").actions, [{ type: "hire" }]);
  assert.match(text(runCommand("rm -rf /")), /Permission denied/);
  assert.deepEqual(complete("ne"), ["neofetch"]);
  assert.deepEqual(complete("cd kr"), ["cd krate"]);
});
test("live GitHub data is formatted, forks dropped, empty answers handled", () => {
  const repos = [
    { name: "old", description: null, stargazers_count: 0, language: "Go", pushed_at: "2024-01-01", html_url: "u1", fork: false },
    { name: "fork", description: "x", stargazers_count: 9, language: null, pushed_at: "2025-01-01", html_url: "u2", fork: true },
    { name: "new", description: "hi", stargazers_count: 3, language: "TypeScript", pushed_at: "2025-06-01", html_url: "u3", fork: false },
  ];
  const lines = formatRepos(repos);
  assert.match(lines[1].text, /^\s+new/);
  assert.ok(!lines.some((line) => /fork/.test(line.text)));
  assert.match(formatLog([]).at(0).text, /No recent/);
  const log = formatLog([{ type: "PushEvent", created_at: "2025-06-01T00:00:00Z", repo: { name: "solmyst/krate" }, payload: { commits: [{ message: "fix: a\nbody" }] } }]);
  assert.match(log[1].text, /krate\s+fix: a$/);
});
