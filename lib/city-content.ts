import {
  projects,
  labProjects,
  experiences,
  skillGroups,
  decisionsLog,
  personal,
  timeline,
  currently,
  heroData,
} from "@/lib/data";
import { cityBuildings, holdsProjects, type CityBuilding } from "@/lib/city-layout";
export type FloorContent = {
  title: string;
  subtitle: string;
  // Short rows (problem, what I built, result, stack) shown before the long text.
  glance?: { label: string; text: string }[];
  sections: { heading: string; text?: string; bullets?: string[] }[];
  links: { label: string; href: string }[];
};
// The project after this one, in city order, so a visitor can read all nine in a row.
export function nextProject(id: string): CityBuilding | null {
  const list = cityBuildings.filter(holdsProjects);
  const index = list.findIndex((building) => building.id === id);
  return index >= 0 ? (list[index + 1] ?? null) : null;
}
// First sentence, trimmed to one readable line.
export function firstSentence(text: string, max = 150) {
  const sentence = text.trim().split(/(?<=[.!?])\s/)[0];
  if (sentence.length <= max) return sentence;
  // Cut at a comma when one is near the end, so the line stops on a whole phrase.
  const cut = sentence.slice(0, max - 1);
  const comma = cut.lastIndexOf(",");
  return `${comma > max * 0.6 ? cut.slice(0, comma) : cut.replace(/\s+\S*$/, "")}…`;
}
export function floorContent(
  building: CityBuilding,
  floor: number,
): FloorContent {
  const level = Math.max(0, Math.min(building.floors.length - 1, floor));
  const result: FloorContent = {
    title: building.floors[level],
    subtitle: building.name,
    sections: [],
    links: [],
  };
  if (building.kind === "project") {
    const project = projects.find((item) => item.id === building.id);
    if (!project) return result;
    result.subtitle = project.tagline;
    if (level === 0) {
      result.glance = [
        { label: "The problem", text: firstSentence(project.userProblem) },
        { label: "What I built", text: firstSentence(project.whatIBuilt) },
        { label: "Result", text: firstSentence(project.outcome) },
        { label: "Built with", text: project.stack.slice(0, 5).join(" · ") },
      ];
      result.sections = [
        { heading: "The problem", text: project.userProblem },
        { heading: "What works today", text: project.outcome },
      ];
    } else if (level === 1)
      result.sections = [
        { heading: "What I built", text: project.whatIBuilt },
        { heading: "Technology stack", bullets: project.stack },
      ];
    else
      result.sections = project.decisions.flatMap((decision) => [
        { heading: decision.statement, text: decision.because },
        {
          heading: "Chosen approach",
          text:
            decision.chose === "A"
              ? `${decision.optionA.label}: ${decision.optionA.why}`
              : `${decision.optionB.label}: ${decision.optionB.why}`,
        },
        { heading: "What I’d revisit", text: decision.wouldDoDifferently },
      ]);
    if (project.links.live)
      result.links.push({
        label: project.status === "pilot" ? "Open pilot" : "Open project",
        href: project.links.live,
      });
    if (project.links.github)
      result.links.push({
        label: "Source & documentation",
        href: project.links.github,
      });
  } else if (building.kind === "lab") {
    const lab = labProjects[level];
    result.title = lab.name;
    result.subtitle = lab.tagline;
    result.glance = [
      { label: "The idea", text: firstSentence(lab.idea, 160) },
      { label: "What I built", text: firstSentence(lab.whatIBuilt, 160) },
      { label: "Result", text: firstSentence(lab.outcome, 160) },
      { label: "Built with", text: lab.stack.slice(0, 5).join(" · ") },
    ];
    result.sections = [
      { heading: "The idea", text: lab.idea },
      { heading: "What works today", text: lab.outcome },
      { heading: "What I built", text: lab.whatIBuilt },
      { heading: "Technology stack", bullets: lab.stack },
      { heading: "Honest limits", text: `${lab.limits} (Status: ${lab.status}.)` },
    ];
    if (lab.links.live) result.links.push({ label: "Open it live", href: lab.links.live });
    result.links.push({ label: "Source & documentation", href: lab.links.github });
  } else if (building.kind === "experience") {
    const experience = experiences[level];
    result.title = experience.role;
    result.subtitle = `${experience.company} · ${experience.period} · ${experience.location}`;
    result.sections = [
      { heading: "The work", text: experience.description },
      { heading: "Contributions & outcomes", bullets: experience.achievements },
      { heading: "Skills in practice", bullets: experience.tech },
    ];
  } else if (building.kind === "skills") {
    const group = skillGroups[level];
    result.title = group.label;
    result.subtitle = "The toolkit / from discovery to implementation";
    result.sections = [
      {
        heading: "Tools & skills",
        bullets: group.skills.map((skill) =>
          skill.note ? `${skill.name} — ${skill.note}` : skill.name,
        ),
      },
      {
        heading: "In context",
        text: "The project buildings show how I use these tools. Explore a project’s engineering floor for its actual stack and architecture.",
      },
    ];
  } else if (building.kind === "education") {
    result.subtitle = `${personal.university} · ${personal.educationPeriod}`;
    const chapters: FloorContent["sections"][] = [
      [
        { heading: "The starting point / 2023", text: `My undergraduate journey at ${personal.university}. ${personal.year}. This chapter is still being written.` },
        { heading: "Building foundations", bullets: ["Computer science, data structures and algorithms", "AI & ML with the Xebia specialization", "Learning to connect technical implementation with a real user problem"] },
        { heading: "About this campus", text: "An original interpretation of the red-brick academic wings, cream entrance bridge, lawns, fountain and gate in my campus photographs. This is a personal portfolio space, not an official university tour." },
      ],
      [
        { heading: "From learning to shipping", text: "Alongside my degree, I have been turning ideas into working products: interview practice, voice agents, developer tools and AI experiments." },
        { heading: "The project notebook", bullets: projects.slice(0, 5).map(project => `${project.name} — ${project.tagline}`) },
        { heading: "Practice", text: "500+ DSA problems solved, alongside full-stack development, system design and AI integration." },
      ],
      [
        { heading: "Beyond the classroom", text: "Product internships at Park+ became another part of my learning journey: research, product decisions and working with engineering teams." },
        { heading: "Experience chapters", bullets: experiences.map(item => `${item.period} / ${item.role} — ${item.company}`) },
        { heading: "Connecting the two", text: "The Experience HQ building holds the detailed contributions and outcomes. This floor connects those experiences to my ongoing education." },
      ],
      [
        { heading: "Class of 2027 / looking ahead", text: `My degree runs from ${personal.educationPeriod}. As I work toward graduation in 2027, I’m continuing to build my product and engineering skills.` },
        { heading: "Still learning", bullets: Object.entries(currently).map(([key, value]) => `${key}: ${value}`) },
        { heading: "A space for memories", text: "Campus stories, friends, favourite spots and personal milestones can be added here when I choose to share them." },
      ],
    ];
    result.sections = chapters[level];
  } else if (building.kind === "about") {
    if (level === 0) {
      result.title = personal.name;
      result.subtitle = "Product thinker × full-stack builder";
      result.sections = [
        { heading: "The short version", text: heroData.description },
        {
          heading: "Education",
          text: `${personal.university}. ${personal.year}. ${personal.educationPeriod}.`,
        },
        { heading: "Looking for", text: personal.openTo },
      ];
    } else if (level === 1)
      result.sections = timeline.map((item) => ({
        heading: `${item.year} / ${item.title}`,
        text: item.description,
      }));
    else
      result.sections = [
        { heading: "Away from the screen", text: personal.outsideCode },
        {
          heading: "Currently",
          bullets: Object.entries(currently).map(
            ([key, value]) => `${key}: ${value}`,
          ),
        },
        { heading: "Continued learning", bullets: personal.certifications },
      ];
  } else if (building.kind === "decisions") {
    const decision = decisionsLog[level];
    result.title = decision.statement;
    result.subtitle = `${decision.date} / ${decision.context}`;
    result.sections = [
      {
        heading: "Option A",
        text: `${decision.optionA.label}: ${decision.optionA.why}`,
      },
      {
        heading: "Option B",
        text: `${decision.optionB.label}: ${decision.optionB.why}`,
      },
      {
        heading: `Chosen: ${decision.chose === "A" ? decision.optionA.label : decision.optionB.label}`,
        text: decision.because,
      },
      { heading: "What I’d revisit", text: decision.wouldDoDifferently },
    ];
  } else {
    result.title = "Let’s build something useful.";
    result.subtitle = personal.openTo;
    result.sections = [
      {
        heading: "Start a conversation",
        text: `If you need someone who can connect the user problem, the product decision, and the implementation, let’s talk. ${personal.email}`,
      },
      {
        heading: "Elsewhere",
        bullets: [personal.github, personal.linkedin, personal.leetcode],
      },
    ];
  }
  if (building.kind !== "project")
    result.links = [
      { label: "Email Anush", href: `mailto:${personal.email}` },
      { label: "LinkedIn", href: personal.linkedin },
      { label: "Resume", href: personal.resume },
    ];
  if (building.kind === "contact")
    result.links = [
      { label: "Email Anush", href: `mailto:${personal.email}` },
      { label: "LinkedIn", href: personal.linkedin },
      { label: "GitHub", href: personal.github },
      { label: "LeetCode", href: personal.leetcode },
      { label: "X / Twitter", href: personal.twitter },
      { label: "Resume", href: personal.resume },
    ];
  if (building.kind === "education") result.links.push(
    { label: "JECRC University / official website", href: "https://jecrcuniversity.edu.in/" },
    { label: "AI & ML with Xebia / program reference", href: "https://jecrcuniversity.edu.in/admission/b-tech-cse-artificial-intelligence-and-machine-learning-xebia/" },
  );
  return result;
}
export const cityProjectCount = cityBuildings.filter(
  (building) => building.kind === "project",
).length;
