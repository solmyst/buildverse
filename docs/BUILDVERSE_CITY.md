# Buildverse City

The whole portfolio becomes one spatial experience. There is no scrolling landing page, project grid, or professional section beneath the canvas. Fourteen destinations house all nine projects, experience, skills, biography, decisions, and contact. Each project has three physical floors: problem/outcome, engineering, and decisions. Public buildings use content-driven floor counts.

## Interaction contract

- Full-viewport 3D city with perspective camera, zoom/orbit, streets, an avatar, and multi-storey buildings.
- Click a facade floor or use the directory to visit it. Enter the floor for a furnished, cutaway 3D room. Select the room display to read its complete dossier.
- WASD/arrow keys move the hero relative to the camera, bounded by the district and blocked by building footprints. Shift sprints, Space jumps, E enters a nearby doorway. A touch direction pad provides the same movement.
- In the street the camera chases the hero, swings behind it while walking unless the visitor is dragging, and pulls in front of any building between it and the hero.
- A title screen (Enter or Play) opens over a slowly orbiting city. A Hire Level of five stars fills as addresses are discovered (1, 3, 6, 9, 12) with a level-up banner.
- A parked coupe near the plaza: F gets in or out (or the on-screen prompt). W/S throttle and brake/reverse, A/D steer, Shift boosts, Space handbrakes. Arcade physics (`driveCar`) scrape along walls and bounce off head-on hits; the camera chases the car and widens with speed. Pedestrians leap clear of a fast car.
- Missions (`cityMissions`) chain real addresses: a glowing checkpoint column marks the next door, a tracker shows the stop and distance, and arriving triggers Checkpoint / Mission passed banners.
- The minimap is a circular radar centred on the visitor, rotated to the camera, with building blips, the parked car, and the mission waypoint clamped to the rim.
- The district is an island: a ring highway (`ringRoad`) circles it inside a palm-lined beach, the grid streets run out to meet it, and an animated ocean surrounds it. A ferris wheel, a lighthouse with a sweeping night beam, and a pier sit on the waterfront; the wheel and lighthouse are solid (`cityProps`). Walking and driving reach the beach (`islandEdge`).
- Traffic follows lanes (`lanePoint`) around both directions of the highway and along the central streets, keeps its distance from the car ahead, and stops for the visitor or their car. Street-lane cars wrap from one end of the island to the other.
- A gradient sky dome replaces the flat background. The day/night toggle sweeps through a sunset over a few seconds, moving the sun, light colour, fog and sky together; reduced motion and pause switch instantly.
- Night mode adds a bloom pass so lit windows, lamps, headlights and the checkpoint glow; bloom is skipped in daylight.
- Pedestrians walk sidewalk lanes clear of every footprint. Near the hero they stop, turn, and speak a line drawn from real project taglines and proof stats.
- The floor selector works as an elevator. City overview, exit, camera reset, day/night, animation pause, and minimap remain reachable.
- Floor/dossier URLs are shareable hashes. Browser back/forward resolves the same destination. Unknown floors do not crash the city.
- Readable HTML pages and HUD controls are allowed when entering a place, as requested. They are not a second 2D portfolio. A directory is also the keyboard and WebGL-unavailable navigation path.
- Actual career/project content is reused, not replaced with decorative or invented activity. No account, chat API, fake player count, or production deployment.

## Verification

Eight automated tests cover project/building coverage, all 50 floors’ written content, movement speed bounds, collision/edge sliding, nearby entrances, valid/invalid floor deep links, and finite/pickable architectural geometry at every address. These tests also run in CI. The production static export, ESLint, and TypeScript checks pass.

Browser verification covers rendered city and furnished rooms, clicking the physical display, elevators (including the eighth skills floor), dossier content, back/forward routes, walking, E door entry, return to street, day/night, and native dialog focus wrapping. Responsive checks cover 320, 375, 768, 1024, and 1440 pixel widths. The production browser console is free of errors and warnings. The avatar uses footprint collision outdoors and bounded movement indoors; furniture is decorative rather than a physics simulation.

Three.js reference: https://threejs.org/docs/pages/OrbitControls.html and https://threejs.org/docs/pages/Raycaster.html. No downloaded 3D models or copied portfolio assets.

## Architecture and rendering

Each address has its own massing: interlocked workshop volumes, curved-eave studios, ribbon tower, folded atelier, offset capsules, twin-pier headquarters, helical academy, aerodynamic garage, timber gateway, orbital observatory, dune terraces, pixel clusters, tiered library, and lotus terminal. The roofs are original generated meshes inspired by East Asian architectural forms. All 50 content floors retain their own picking identity after static facade meshes are batched by material.

Rounded edges, smooth cylinders, procedural roughness, distinct stone/wood/metal/glass materials, and a locally generated environment map improve surface quality. Rendering targets 60 frames per second with time-based camera easing and damped orbit/zoom. Pixel ratio, shadows and the ink pass follow the quality tier (`lib/render-quality.ts`): high 2, medium 1.5, low 1. Narrow screens start at medium, and Auto drops a tier when frame rate stays under 40 fps. A pond, curved footbridge, bamboo, and blossom trees frame the district.

Rendering references: https://threejs.org/docs/pages/WebGLRenderer.html and https://threejs.org/docs/pages/RoomEnvironment.html.

## Living world

The automatic world clock represents 24 hours in ten minutes of active play. Local simulated cloud cover, rain, and temperature follow smooth cycles; the HUD labels this as SIM, not real-world weather. The automatic cycle can be disabled; manual day/night lighting remains available. Pausing, hiding the tab, opening a dossier, or requesting reduced motion stops the automatic simulation.

A fenced construction site on the western waterfront represents the existing `currently.learning` portfolio data. Four scripted workers, a lifting/slewing crane, an unfinished frame, and material stacks show work in progress. The footprint blocks visitors and cars. Selecting the site opens the Observatory dossier. This is a visual metaphor for learning, not a claim of an upcoming internship. No AI service, external weather feed, credentials, or paid API is required.

## Sakura Valley

A personal coastal garden layer adds an original red gateway, stone lanterns, seven cherry trees, and 210 instanced falling petals. The southern lawn hosts After Hours Cinema with six seated characters, string lights, and a locally generated screen alternating original landscape animation and playful coding. No third-party film clips, streaming APIs, or external media are loaded. Both places are reachable through the directory and have dedicated arrival cameras.

A forested headland frames the northern bay. A propeller plane circles above the coast and three cabin boats travel offshore, with tangent-aligned headings and wakes. Boat-route tests verify clearance from the island. All scenery animation follows the existing pause, visibility and reduced-motion controls; the screen updates at eight frames per second and petals share one instanced draw call.

## Solmyst Courtyard and discoveries

The previously unassigned central plot at (-8, 8) now holds an open pavilion, benches, planters, a guitar display, a miniature race car, and an arcade cabinet. The directory provides an arrival camera. The three display stands have collision footprints, while the courtyard stays walkable.

Three 3D objects reveal profile details; a classic keyboard sequence unlocks a fourth discovery. The journal is reachable from the desktop passport or the directory on every screen size, and provides keyboard-accessible inspection of the physical objects. Discoveries persist only in session storage, with unknown/duplicate entries rejected. Modal focus and movement blocking use the existing dialog system. No new real-life anecdotes are invented: content uses confirmed hobbies and the existing DSA statistic. Personal incidents can be added once Anush provides them.

## Illustrated rendering and contextual wayfinding

A Messenger reference study informed an original ink-and-paper color pass, quieter rooftop labels, and timed camera arrivals. The directory exposes illustrated rendering and all-label switches. Labels otherwise appear on hover, at nearby doors, and on inspected exteriors. Camera transitions ease over bounded durations with a small lift, respecting reduced-motion and pause settings. See `MESSENGER_DESIGN_STUDY.md` for evidence, coverage limits and implementation choices.
