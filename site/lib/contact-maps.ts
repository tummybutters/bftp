import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
let started = false;
export const mapsConfigured = Boolean(
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
);
export async function loadPlaces() {
  if (!mapsConfigured) throw new Error("Maps unavailable");
  if (!started) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
    });
    started = true;
  }
  return importLibrary("places") as Promise<google.maps.PlacesLibrary>;
}
export async function loadMap() {
  await loadPlaces();
  return importLibrary("maps") as Promise<google.maps.MapsLibrary>;
}
