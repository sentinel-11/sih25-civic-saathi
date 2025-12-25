import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MaintenanceIssue, User } from "@shared/schema";

// Severity-based marker colors
const createColoredIcon = (severity: string) => {
  const colors = {
    critical: "#dc2626", // red
    high: "#ea580c", // orange
    medium: "#f59e0b", // amber
    low: "#3b82f6", // blue
  };
  
  const color = colors[severity as keyof typeof colors] || "#6b7280"; // gray default
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 41" width="25" height="41">
      <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle fill="#fff" cx="12" cy="9" r="3"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Fix default marker icons for Leaflet when bundling
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

interface MapViewProps {
  issues: (MaintenanceIssue & { reporter: User })[] | undefined;
}

function parseLatLng(location?: string): [number, number] | null {
  if (!location) return null;
  // Expect formats like: "12.97, 77.59" or "lat:12.97 lng:77.59"
  const match = location
    .replace(/lat\s*[:=]?\s*/i, "")
    .replace(/lng|lon\s*[:=]?\s*/i, "")
    .match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (isFinite(lat) && isFinite(lng)) return [lat, lng];
  }
  return null;
}

export function MapView({ issues }: MapViewProps) {
  const [, forceRerender] = useState(0);
  const geoCacheRef = useRef<Map<string, [number, number]>>(new Map());
  const [geocoding, setGeocoding] = useState(false);

  // Fake demo hotspots for demonstration
  const demoHotspots = [
    { id: "demo-1", title: "Broken Street Light", location: [28.6139, 77.2090] as [number, number], reporter: "Demo User 1", severity: "medium" },
    { id: "demo-2", title: "Pothole on Main Road", location: [28.6300, 77.2200] as [number, number], reporter: "Demo User 2", severity: "high" },
    { id: "demo-3", title: "Water Leakage", location: [28.6000, 77.2000] as [number, number], reporter: "Demo User 3", severity: "critical" },
    { id: "demo-4", title: "Graffiti on Wall", location: [28.6250, 77.1950] as [number, number], reporter: "Demo User 4", severity: "low" },
    { id: "demo-5", title: "Broken Bench in Park", location: [28.6180, 77.2150] as [number, number], reporter: "Demo User 5", severity: "low" },
    { id: "demo-6", title: "Damaged Sidewalk", location: [28.6100, 77.2250] as [number, number], reporter: "Demo User 6", severity: "medium" },
  ];

  // Build markers using parsed lat/lng or cached geocoded values
  const markers = useMemo(() => {
    const realMarkers = (issues || [])
      .map((i) => {
        const parsed = parseLatLng(i.location || undefined);
        const cached = i.location ? geoCacheRef.current.get(i.location) : null;
        const loc: [number, number] | null = parsed || cached || null;
        return {
          id: i.id,
          title: i.title,
          reporter: i.reporter?.username ?? "Unknown",
          location: loc,
          rawLocation: i.location || undefined,
          severity: i.severity,
        };
      })
      .filter((m) => m.location !== null) as {
      id: string;
      title: string;
      reporter: string;
      location: [number, number];
      rawLocation?: string;
      severity: string;
    }[];

    // Combine real markers with demo hotspots
    return [...realMarkers, ...demoHotspots];
  }, [issues, geocoding]);

  // On issues change, geocode any locations that aren't numeric
  useEffect(() => {
    const run = async () => {
      if (!issues?.length) return;
      const unique: string[] = [];
      for (const i of issues) {
        const txt = i.location?.trim();
        if (!txt) continue;
        if (parseLatLng(txt)) continue; // already numeric
        if (geoCacheRef.current.has(txt)) continue;
        if (!unique.includes(txt)) unique.push(txt);
      }
      if (unique.length === 0) return;

      setGeocoding(true);
      try {
        // Geocode sequentially with a short delay to be polite to OSM
        for (const q of unique) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
            const res = await fetch(url, {
              headers: {
                "Accept": "application/json",
              },
            });
            const data = (await res.json()) as Array<{ lat: string; lon: string }>;
            if (Array.isArray(data) && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              if (isFinite(lat) && isFinite(lon)) {
                geoCacheRef.current.set(q, [lat, lon]);
                // Force rerender to include newly geocoded marker
                forceRerender((v) => v + 1);
              }
            }
          } catch (err) {
            // Swallow individual errors; continue
            console.warn("Geocoding failed for", q, err);
          }
          // Small delay between requests
          await new Promise((r) => setTimeout(r, 350));
        }
      } finally {
        setGeocoding(false);
      }
    };
    run();
  }, [issues]);

  const center: [number, number] = markers.length
    ? [28.6139, 77.2090] // Delhi center (where demo hotspots are)
    : [20.5937, 78.9629]; // India fallback center

  return (
    <div className="w-full h-full relative">
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 z-[1000] text-xs">
        <div className="font-semibold mb-2">Severity Levels</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
      
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution="&copy; OpenStreetMap contributors" 
        />
        {markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 pointer-events-none z-[1000]">
            {geocoding ? "Locating addresses..." : "No mappable locations yet"}
          </div>
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={m.location} icon={createColoredIcon(m.severity)}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">{m.title}</div>
                <div className="text-gray-600">Reporter: {m.reporter}</div>
                <div className="text-xs mt-1">
                  <span className="font-medium">Severity: </span>
                  <span className={`capitalize font-semibold ${
                    m.severity === 'critical' ? 'text-red-600' :
                    m.severity === 'high' ? 'text-orange-600' :
                    m.severity === 'medium' ? 'text-amber-600' :
                    'text-blue-600'
                  }`}>
                    {m.severity}
                  </span>
                </div>
                {m.rawLocation && (
                  <div className="text-xs text-gray-400 mt-1">
                    📍 {m.rawLocation}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
