import { cityBuildings } from "@/lib/city-layout";
import { floorContent } from "@/lib/city-content";
import { personal } from "@/lib/data";
export const tourStopSeconds = 10;
// Who I am, four buildings that show how I build, then how to reach me: one minute.
export const cityTour = ["about", "interview-ace", "relay-voice", "krate", "skills", "contact"].map((id) => {
  const building = cityBuildings.find((item) => item.id === id)!;
  return {
    id,
    name: building.name,
    line: building.kind === "contact" ? `Open to ${personal.openTo}.` : floorContent(building, 0).subtitle,
  };
});
