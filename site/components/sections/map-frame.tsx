import type { MapEmbedData } from "@/lib/content/types";

function buildMapSrc(map: MapEmbedData) {
  if (map.latitude != null && map.longitude != null) {
    return `https://www.google.com/maps?q=${map.latitude},${map.longitude}&z=${map.zoom || "14"}&output=embed`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(map.title)}&output=embed`;
}

export function MapFrame({ map }: { map: MapEmbedData | null }) {
  if (!map) {
    return null;
  }

  return (
    <div className="bftp-map-frame">
      <div className="bftp-map-frame__overlay">
        <p className="bftp-map-frame__kicker">Service Map</p>
        <h3 className="bftp-map-frame__title">{map.title}</h3>
        {map.tooltip ? <p className="bftp-map-frame__tooltip">{map.tooltip}</p> : null}
      </div>
      <iframe
        title={map.title}
        src={buildMapSrc(map)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="bftp-map-frame__iframe"
      />
    </div>
  );
}
