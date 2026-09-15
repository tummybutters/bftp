export const mapsConfigured = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
export const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
export const loadMap = () => import("mapbox-gl");
export const loadSearch = () => import("@mapbox/search-js-core");
