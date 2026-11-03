import { ImageResponse } from "next/og";
import { cityBuildings } from "@/lib/city-layout";

export const dynamic = "force-static";

const ink = "#9fc4ff";
const projects = cityBuildings.filter((building) => building.kind === "project").length;

// Exported as /og.png so static hosts serve it with an image content type.
// Rendered at build time, so the skyline always matches the city's real buildings and floor counts.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "#eaf2ff",
          backgroundColor: "#0b1730",
          backgroundImage:
            "linear-gradient(to bottom, #9fc4ff1a 1px, transparent 1px), linear-gradient(to right, #9fc4ff1a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: ink }}>BUILDVERSE CITY · THREE.JS ENGINE</div>
          <div style={{ fontSize: 84, fontWeight: 700, marginTop: 16 }}>Anush Gupta</div>
          <div style={{ fontSize: 30, marginTop: 8, color: "#c9d8f2" }}>
            {`A portfolio you drive through. ${projects} project buildings, every floor a story.`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 190, borderBottom: `2px solid ${ink}`, marginBottom: 20 }}>
          {cityBuildings.map((building) => (
            <div
              key={building.id}
              style={{
                flex: building.width,
                height: 36 + building.floors.length * 18,
                display: "flex",
                backgroundColor: `${building.color}33`,
                border: `2px solid ${building.color}`,
                borderBottom: "none",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: ink }}>
          <span>Static batching · adaptive quality · blueprint X-ray</span>
          <span>buildverse.anush.tech</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
