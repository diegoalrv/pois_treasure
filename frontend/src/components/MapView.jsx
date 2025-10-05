import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import { ScatterplotLayer } from "@deck.gl/layers";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ assignments }) {
  const layers = [
    new ScatterplotLayer({
      id: "pois",
      data: assignments.map(a => ({
        ...a,
        coordinates: parseWKT(a.poi.wkt_geometry)
      })),
      getPosition: d => d.coordinates,
      getFillColor: [255, 140, 0],
      getRadius: 20,
      pickable: true,
    }),
  ];

  return (
    <DeckGL
      initialViewState={{ longitude: -73.05, latitude: -36.82, zoom: 13 }}
      controller={true}
      layers={layers}
    >
      {/* Usamos el componente de DeckGL para el mapa base */}
      <DeckMapView mapboxApiAccessToken={MAPBOX_TOKEN} />
    </DeckGL>
  );
}

// --- helper para convertir WKT POINT a [lon, lat]
function parseWKT(wkt) {
  if (!wkt || !wkt.startsWith("POINT")) return [0, 0];
  const coords = wkt.replace("POINT", "").replace(/[()]/g, "").trim().split(" ");
  return [parseFloat(coords[0]), parseFloat(coords[1])];
}
