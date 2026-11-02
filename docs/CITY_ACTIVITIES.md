# City activities

Open **Things to do** to start an activity from anywhere. Swing, cinema and Ferris wheel can also be clicked in the world. Walk near a marked activity/pickup point and press **E** to interact.

- **Sakura swing:** seated avatar follows the moving swing beneath the cherry trees.
- **Cinema:** seated viewing of the existing original animated landscape/code reel. No external film or audio stream is included.
- **Ferris wheel:** the avatar and camera follow a real gondola; cabins have an open seating area.
- **Plane:** call it to the air dock, wait for arrival, then select Board or press E. The sightseeing loop offers outside and passenger views.
- **Boat:** call it to the pier, wait for arrival, then board for a coastal loop. Outside and passenger views are available.

**Escape** or **Leave activity** restores the saved street position. Starting another activity or using normal city navigation ends the previous activity. Movement, jumping and car entry are disabled while seated. The pause control freezes rides; reduced-motion mode presents static scenic poses and immediate pickups so boarding stays accessible.

Implementation: `lib/city-activities.ts` owns activity definitions and proximity; `components/city/activities.ts` owns ride poses and pickup stages. The engine applies the pose after ambient vehicle animation and bypasses street camera collision while riding. No additional service, API key or downloaded assets are required.

Validation: activity proximity, approach bounds, boarding gates, replacement/stop behavior, finite camera transforms and reduced-motion boarding are covered by automated tests. Browser checks covered swing seating, cinema viewing, Ferris following/exit, plane pickup/boarding, boat pickup/boarding, passenger view and Escape restoration.
