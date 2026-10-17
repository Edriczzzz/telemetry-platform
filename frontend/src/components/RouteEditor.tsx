import { useState } from "react";
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import type { LatLng } from "../types/domain";

interface Props {
  area: LatLng[];
  waypoints: LatLng[];
  onChange: (v: { area: LatLng[]; waypoints: LatLng[] }) => void;
}

type Mode = "area" | "waypoints";

function Clicks({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onClick([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]) });
  return null;
}

const btn = "rounded border border-line bg-white px-3 py-1.5 text-sm disabled:opacity-50";

/**
 * Editor de zona y ruta. Solo REGISTRA geometrías en la plataforma:
 * no envía nada al VANT ni genera comandos de vuelo.
 */
export function RouteEditor({ area, waypoints, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("area");
  const add = (p: LatLng) =>
    onChange(mode === "area" ? { area: [...area, p], waypoints } : { area, waypoints: [...waypoints, p] });
  const undo = () =>
    onChange(mode === "area" ? { area: area.slice(0, -1), waypoints } : { area, waypoints: waypoints.slice(0, -1) });
  const center: LatLng = area[0] ?? waypoints[0] ?? [19.5047, -99.147];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <fieldset className="flex gap-3">
          <legend className="sr-only">Qué se dibuja al hacer clic en el mapa</legend>
          <label className="flex items-center gap-1.5 text-sm font-bold">
            <input type="radio" name="mode" checked={mode === "area"} onChange={() => setMode("area")} />
            Dibujar zona ({area.length} vértices)
          </label>
          <label className="flex items-center gap-1.5 text-sm font-bold">
            <input type="radio" name="mode" checked={mode === "waypoints"} onChange={() => setMode("waypoints")} />
            Agregar waypoints ({waypoints.length})
          </label>
        </fieldset>
        <button type="button" className={btn} onClick={undo} disabled={(mode === "area" ? area : waypoints).length === 0}>
          Deshacer último punto
        </button>
        <button type="button" className={btn} onClick={() => onChange({ area: [], waypoints: [] })} disabled={!area.length && !waypoints.length}>
          Borrar todo
        </button>
      </div>
      <div className="h-96 w-full">
        <MapContainer center={center} zoom={18} className="h-full w-full rounded border border-line" scrollWheelZoom>
          <TileLayer attribution="&copy; colaboradores de OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <Clicks onClick={add} />
          {area.length >= 3 ? (
            <Polygon positions={area} pathOptions={{ color: "#1f6fb2", weight: 2, dashArray: "6 4", fillOpacity: 0.08 }} />
          ) : (
            area.length > 1 && <Polyline positions={area} pathOptions={{ color: "#1f6fb2", weight: 2 }} />
          )}
          {area.map((p, i) => (
            <CircleMarker key={`a${i}`} center={p} radius={5} pathOptions={{ color: "#1f6fb2", fillColor: "#1f6fb2", fillOpacity: 1 }} />
          ))}
          {waypoints.length > 1 && <Polyline positions={waypoints} pathOptions={{ color: "#14262e", weight: 2 }} />}
          {waypoints.map((p, i) => (
            <CircleMarker key={`w${i}`} center={p} radius={7} pathOptions={{ color: "#14262e", weight: 2, fillColor: "#fff", fillOpacity: 1 }}>
              <Tooltip permanent direction="top" offset={[0, -6]}>{i + 1}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-1 text-sm">Haz clic en el mapa para añadir puntos. La zona necesita al menos 3 vértices y la ruta al menos 2 waypoints.</p>
    </div>
  );
}
