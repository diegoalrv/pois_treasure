// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "../style.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const github_raw_base =
  "https://raw.githubusercontent.com/diegoalrv/mobility-workshop/refs/heads/master";

export default function MapView({
  data,
  initialCenter = [-73.0586, -36.8274],
  initialZoom = 13,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  useEffect(() => {
    if (!data) return;

    // ----- Crear mapa -----
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // ----- Crear capas Deck.gl -----
    const overlay = new MapboxOverlay({
      layers: [
        // --- Área ---
        new GeoJsonLayer({
          id: "area-fill",
          data: `${github_raw_base}/urban_explore/pois_manager/static/geometries/area_mobility_workshop.geojson`,
          stroked: true,
          filled: true,
          getFillColor: [254, 195, 31, 25], // relleno amarillo semitransparente
          getLineColor: [254, 195, 31, 200], // borde amarillo
          lineWidthMinPixels: 2,
        }),
        // --- Puntos ---
        new GeoJsonLayer({
          id: "pois",
          data,
          pointRadiusMinPixels: 6,
          getFillColor: [254, 195, 31, 200],
          getLineColor: [0, 0, 0, 255],
          pickable: true,
          onClick: (info) => {
            if (!info.object) return setPopupInfo(null);
            const coords = info.object.geometry.coordinates;
            const props = info.object.properties || {};
            setPopupInfo({
              name: props.name || props.Name || "Sin nombre",
              coordinates: coords,
            });
          },
        }),
      ],
    });

    map.addControl(overlay);
    mapRef.current = map;

    // ----- Ajustar vista al área -----
    fetch(
      `${github_raw_base}/urban_explore/pois_manager/static/geometries/area_mobility_workshop.geojson`
    )
      .then((r) => r.json())
      .then((area) => {
        const bbox = turf.bbox(area);
        if (bbox && bbox.length === 4) {
          map.fitBounds(bbox, { padding: 50, maxZoom: 15 });
        }
      })
      .catch((e) => console.error("❌ Error al ajustar vista del área:", e));

    return () => map.remove();
  }, [data, initialCenter, initialZoom]);

  // ----- Popup -----
  useEffect(() => {
    if (!mapRef.current || !popupInfo) return;

    const popup = new mapboxgl.Popup()
      .setLngLat(popupInfo.coordinates)
      .setHTML(`
        <div style="font-family:Inter,sans-serif;max-width:250px">
          <h3 style="color:#000;margin:0 0 5px 0;">📍 ${popupInfo.name}</h3>
          <div style="font-size:0.9rem;margin-top:8px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${popupInfo.coordinates[1]},${popupInfo.coordinates[0]}"
               target="_blank"
               style="display:inline-block;padding:6px 10px;background:#000;color:#FEC31F;text-decoration:none;border-radius:4px;font-weight:600;">
              Ver en Google Maps
            </a>
          </div>
        </div>
      `)
      .addTo(mapRef.current);

    return () => popup.remove();
  }, [popupInfo]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}
