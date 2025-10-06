// frontend/src/components/MapView.jsx
import { useEffect, useRef, useState, memo } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer, IconLayer } from "@deck.gl/layers";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "../css/style.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const github_raw_base =
  "https://raw.githubusercontent.com/diegoalrv/mobility-workshop/refs/heads/master";

// Variable de entorno para distancia de validación
const VALIDATE_DISTANCE_TO_POI = parseInt(import.meta.env.VITE_VALIDATE_DISTANCE_TO_POI || '50', 10);

// Puntos de inicio y fin
const START_POINT = {
  name: "Inicio: Gobierno Regional del Biobío",
  address: "Arturo Prat 525, Concepción",
  coordinates: [-73.05920967083465, -36.83033675428697],
  type: "start"
};

const END_POINT = {
  name: "Fin: Estadio Ester Roa",
  address: "Concepción",
  coordinates: [-73.02421982103992, -36.81671312018202],
  type: "end"
};

function MapView({
  data,
  initialCenter = [-73.0586, -36.8274],
  initialZoom = 13,
  userLocation = null,
  onMarkVisited = null,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const mapInitialized = useRef(false);

  useEffect(() => {
    if (mapInitialized.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    mapInitialized.current = true;

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
      .catch((e) => console.error("Error al ajustar vista del área:", e));

    return () => {
      mapInitialized.current = false;
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !data) return;

    const layers = [
      new GeoJsonLayer({
        id: "area-fill",
        data: `${github_raw_base}/urban_explore/pois_manager/static/geometries/area_mobility_workshop.geojson`,
        stroked: true,
        filled: true,
        getFillColor: [254, 195, 31, 25],
        getLineColor: [254, 195, 31, 200],
        lineWidthMinPixels: 2,
      }),
      new GeoJsonLayer({
        id: "pois",
        data,
        pointRadiusMinPixels: 6,
        getFillColor: d => {
          return d.properties.visited 
            ? [34, 197, 94, 255] 
            : [254, 195, 31, 200];
        },
        getLineColor: [0, 0, 0, 255],
        pickable: true,
        onClick: (info) => {
          if (!info.object) return setPopupInfo(null);
          const coords = info.object.geometry.coordinates;
          const props = info.object.properties || {};
          setPopupInfo({
            type: 'poi',
            name: props.name || props.Name || "Sin nombre",
            category: props.category,
            visited: props.visited,
            poi_id: props.id,
            coordinates: coords,
          });
        },
      }),
      new IconLayer({
        id: 'start-marker',
        data: [START_POINT],
        getPosition: d => d.coordinates,
        getIcon: d => ({
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#10b981" stroke="#000" stroke-width="2"/>
              <text x="20" y="26" font-size="20" text-anchor="middle" fill="white" font-weight="bold">S</text>
            </svg>
          `),
          width: 40,
          height: 40,
        }),
        getSize: 40,
        pickable: true,
        onClick: () => setPopupInfo({
          type: 'marker',
          ...START_POINT
        }),
      }),
      new IconLayer({
        id: 'end-marker',
        data: [END_POINT],
        getPosition: d => d.coordinates,
        getIcon: d => ({
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="#000" stroke-width="2"/>
              <text x="20" y="26" font-size="20" text-anchor="middle" fill="white" font-weight="bold">F</text>
            </svg>
          `),
          width: 40,
          height: 40,
        }),
        getSize: 40,
        pickable: true,
        onClick: () => setPopupInfo({
          type: 'marker',
          ...END_POINT
        }),
      }),
    ];

    const overlay = new MapboxOverlay({ layers });

    if (overlayRef.current) {
      overlayRef.current.finalize();
    }

    mapRef.current.addControl(overlay);
    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        overlayRef.current.finalize();
      }
    };
  }, [data]);

  useEffect(() => {
    if (!mapRef.current || !popupInfo) return;

    let html = '';
    
    if (popupInfo.type === 'marker') {
      html = `
        <div style="font-family:Inter,sans-serif;max-width:280px">
          <h3 style="color:#000;margin:0 0 5px 0;">
            ${popupInfo.type === 'start' ? '🟢' : '🔴'} ${popupInfo.name}
          </h3>
          <p style="margin:5px 0;color:#666;font-size:0.9rem">${popupInfo.address}</p>
          <div style="font-size:0.9rem;margin-top:8px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${popupInfo.coordinates[1]},${popupInfo.coordinates[0]}"
               target="_blank"
               style="display:inline-block;padding:6px 10px;background:#000;color:#FEC31F;text-decoration:none;border-radius:4px;font-weight:600;">
              Ver en Google Maps
            </a>
          </div>
        </div>
      `;
    } else if (popupInfo.type === 'poi') {
      let distance = null;
      let isNearby = false;
      
      if (userLocation) {
        const from = turf.point([userLocation.longitude, userLocation.latitude]);
        const to = turf.point(popupInfo.coordinates);
        distance = turf.distance(from, to, { units: 'meters' });
        isNearby = distance <= VALIDATE_DISTANCE_TO_POI;
      }

      html = `
        <div style="font-family:Inter,sans-serif;max-width:280px">
          <div style="background:#f3f4f6;padding:8px;margin:-15px -15px 10px -15px;border-radius:4px 4px 0 0;">
            <strong style="color:#374151;text-transform:uppercase;font-size:0.75rem;">
              ${popupInfo.category || 'POI'}
            </strong>
          </div>
          <h3 style="color:#000;margin:0 0 5px 0;">${popupInfo.name}</h3>
          ${popupInfo.visited ? '<p style="color:#10b981;font-weight:600;margin:5px 0;">✅ Visitado</p>' : ''}
          ${distance !== null ? `
            <p style="margin:5px 0;color:#666;font-size:0.85rem;">
              📏 ${Math.round(distance)}m de tu ubicación
            </p>
          ` : ''}
          <div style="margin-top:10px;display:flex;gap:8px;flex-direction:column;">
            ${!popupInfo.visited && onMarkVisited ? `
              <button 
                id="mark-visited-btn"
                ${!isNearby ? 'disabled' : ''}
                style="padding:8px 12px;background:${isNearby ? '#10b981' : '#9ca3af'};color:white;border:none;border-radius:4px;font-weight:600;cursor:${isNearby ? 'pointer' : 'not-allowed'};">
                ${isNearby ? '✓ Marcar como visitado' : `⚠️ Debes estar cerca (${VALIDATE_DISTANCE_TO_POI}m)`}
              </button>
            ` : ''}
            <a href="https://www.google.com/maps/search/?api=1&query=${popupInfo.coordinates[1]},${popupInfo.coordinates[0]}"
               target="_blank"
               style="display:inline-block;padding:8px 12px;background:#000;color:#FEC31F;text-decoration:none;border-radius:4px;font-weight:600;text-align:center;">
              Ver en Google Maps
            </a>
          </div>
        </div>
      `;
    }

    const popup = new mapboxgl.Popup({ closeButton: true })
      .setLngLat(popupInfo.coordinates)
      .setHTML(html)
      .addTo(mapRef.current);

    if (popupInfo.type === 'poi' && onMarkVisited && !popupInfo.visited) {
      setTimeout(() => {
        const btn = document.getElementById('mark-visited-btn');
        if (btn && !btn.disabled) {
          btn.addEventListener('click', () => {
            onMarkVisited(popupInfo.poi_id);
            popup.remove();
          });
        }
      }, 100);
    }

    return () => popup.remove();
  }, [popupInfo, userLocation, onMarkVisited]);

  return (
    <>
      {/* AppBar */}
      <div className="app-bar">
        <img 
          src="https://d26q11cgz8q0ri.cloudfront.net/2023/08/21115443/logo-CLBB.png" 
          alt="Logo CLBB" 
          className="app-bar-logo"
        />
        <h1 className="app-bar-title">Workshop Movilidad: Human Agents</h1>
      </div>
      <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
    </>
  );
}

export default memo(MapView);