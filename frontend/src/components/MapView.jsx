import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map, { NavigationControl } from 'react-map-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ assignments }) {
  const layers = [
    new ScatterplotLayer({
      id: 'pois',
      data: assignments.map(a => ({
        ...a,
        coordinates: parseWKT(a.poi.wkt_geometry)
      })),
      getPosition: d => d.coordinates,
      getFillColor: [255, 140, 0],
      getRadius: 50,
      pickable: true
    })
  ];

  return (
    <DeckGL
      initialViewState={{ longitude: -73.05, latitude: -36.82, zoom: 13 }}
      controller={true}
      layers={layers}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" />
      </Map>
    </DeckGL>
  );
}

function parseWKT(wkt) {
  if (!wkt?.startsWith('POINT')) return [0, 0];
  const coords = wkt.replace('POINT', '').replace(/[()]/g, '').trim().split(' ');
  return [parseFloat(coords[0]), parseFloat(coords[1])];
}
