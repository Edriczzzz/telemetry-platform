import { useEffect, useRef } from "react";
import { CircleMarker, LayerGroup, LayersControl, MapContainer, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { CircleMarker as LCircleMarker, LatLngBoundsExpression, Map as LMap } from "leaflet";
import { Link } from "react-router-dom";
import { fmtArea, fmtCoord, fmtDateTime, SEVERITY_COLOR, SEVERITY_LABEL, ATTENTION_LABEL, VALIDATION_LABEL } from "../lib/labels";
import type { DetectionRow, LatLng, Severity } from "../types/domain";

export type Bbox = [number, number, number, number];

interface Props {
  detections: DetectionRow[];
  track?: LatLng[];
  areas?: LatLng[][];
  waypoints?: LatLng[];
  uav?: { position: LatLng; label: string };
  selectedId?: string | null;
  onBoundsChange?: (b: Bbox) => void;
  className?: string;
}

const DEFAULT_CENTER: LatLng = [19.5047, -99.147];

function extent(points: LatLng[]): LatLngBoundsExpression | undefined {
  if (points.length === 0) return undefined;
  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
}

/** Mantiene el VANT dentro de la vista cuando se mueve. */
function KeepInView({ position }: { position?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (position && !map.getBounds().contains(position)) map.panTo(position);
  }, [position?.[0], position?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const readBounds = (map: LMap): Bbox => {
  const b = map.getBounds();
  return [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()];
};

function BoundsReporter({ onChange }: { onChange: (b: Bbox) => void }) {
  const map = useMap();
  useMapEvents({ moveend: () => onChange(readBounds(map)) });
  useEffect(() => onChange(readBounds(map)), [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function FocusSelected({ detection, refs }: { detection?: DetectionRow; refs: React.RefObject<Record<string, LCircleMarker | null>> }) {
  const map = useMap();
  useEffect(() => {
    if (!detection) return;
    map.setView([detection.latitude, detection.longitude], 19);
    const t = setTimeout(() => refs.current[detection.id]?.openPopup(), 150);
    return () => clearTimeout(t);
  }, [detection?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function DetectionMap({ detections, track, areas, waypoints, uav, selectedId, onBoundsChange, className = "h-[60vh]" }: Props) {
  const refs = useRef<Record<string, LCircleMarker | null>>({});
  const rings = (areas ?? []).filter((r) => r.length >= 3);
  const bounds = extent([
    ...detections.map((d): LatLng => [d.latitude, d.longitude]),
    ...rings.flat(),
    ...(waypoints ?? []),
  ]);
  const selected = selectedId ? detections.find((d) => d.id === selectedId) : undefined;

  return (
    <div className={`relative w-full ${className}`}>
      <MapContainer
        {...(bounds ? { bounds, boundsOptions: { padding: [40, 40], maxZoom: 18 } } : { center: DEFAULT_CENTER, zoom: 17 })}
        className="h-full w-full rounded border border-line"
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Calles">
            <TileLayer attribution="&copy; colaboradores de OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              attribution="Imágenes &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Áreas de inspección">
            <LayerGroup>
              {rings.map((ring, i) => (
                <Polygon key={i} positions={ring} pathOptions={{ color: "#1f6fb2", weight: 2, dashArray: "6 4", fillOpacity: 0.05 }} />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          <LayersControl.Overlay checked name="Trayectoria">
            <LayerGroup>{track && track.length > 1 && <Polyline positions={track} pathOptions={{ color: "#14262e", weight: 2, opacity: 0.7 }} />}</LayerGroup>
          </LayersControl.Overlay>
          {waypoints && waypoints.length > 0 && (
            <LayersControl.Overlay checked name="Waypoints planificados">
              <LayerGroup>
                {waypoints.length > 1 && <Polyline positions={waypoints} pathOptions={{ color: "#1f6fb2", weight: 1.5, dashArray: "2 6" }} />}
                {waypoints.map((w, i) => (
                  <CircleMarker key={i} center={w} radius={4} pathOptions={{ color: "#1f6fb2", weight: 2, fillColor: "#fff", fillOpacity: 1 }}>
                    <Tooltip>Waypoint {i + 1}</Tooltip>
                  </CircleMarker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          )}
          <LayersControl.Overlay checked name="Baches detectados">
            <LayerGroup>
              {detections.map((d) => {
                const isSel = d.id === selectedId;
                return (
                  <CircleMarker
                    key={d.id}
                    ref={(m) => { refs.current[d.id] = m; }}
                    center={[d.latitude, d.longitude]}
                    radius={isSel ? 11 : 7}
                    pathOptions={{ color: isSel ? "#000" : "#fff", weight: isSel ? 3 : 1.5, fillColor: SEVERITY_COLOR[d.severity], fillOpacity: 0.95 }}
                  >
                    <Popup>
                      <div className="min-w-56 text-sm">
                        <p className="font-mono font-bold">{d.id}</p>
                        <dl className="mt-1 grid grid-cols-[6rem_1fr] gap-x-2 gap-y-0.5">
                          <dt>Ubicación</dt><dd className="font-mono">{fmtCoord(d.latitude, d.longitude)}</dd>
                          <dt>Detectado</dt><dd>{fmtDateTime(d.detected_at)}</dd>
                          <dt>Severidad</dt><dd>{SEVERITY_LABEL[d.severity]}</dd>
                          <dt>Área</dt><dd>{fmtArea(d.area_value, d.area_unit)}</dd>
                          <dt>Misión</dt><dd>{d.mission_name}</dd>
                          <dt>Atención</dt><dd>{ATTENTION_LABEL[d.attention_status]}</dd>
                          <dt>Validación</dt><dd>{VALIDATION_LABEL[d.validation_status]}</dd>
                        </dl>
                        <Link className="mt-2 inline-block font-bold text-survey underline" to={`/detections/${d.id}`}>Ver detalle</Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>
        {uav && (
          <CircleMarker center={uav.position} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#1f6fb2", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>{uav.label}</Tooltip>
          </CircleMarker>
        )}
        <KeepInView position={uav?.position} />
        {onBoundsChange && <BoundsReporter onChange={onBoundsChange} />}
        <FocusSelected detection={selected} refs={refs} />
      </MapContainer>
      <Legend />
    </div>
  );
}

function Legend() {
  const items = Object.keys(SEVERITY_LABEL) as Severity[];
  return (
    <div className="absolute bottom-3 left-3 z-[1000] rounded border border-line bg-white/95 px-3 py-2 text-sm shadow">
      <p className="font-bold">Severidad</p>
      <ul>
        {items.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />
            {SEVERITY_LABEL[s]}
          </li>
        ))}
      </ul>
    </div>
  );
}
