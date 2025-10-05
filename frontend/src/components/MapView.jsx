import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import Map, { NavigationControl } from 'react-map-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView({ assignments }) {
  const features = assignments.features || [];

  const layers = [
    new IconLayer({
      id: 'pois-icons',
      data: features.map(f => ({
        ...f.properties,
        coordinates: f.geometry.coordinates
      })),
      getPosition: d => d.coordinates,
      getIcon: () => 'marker',
      sizeScale: 5,
      sizeUnits: 'pixels',
      getSize: () => 40,
      getColor: [255, 200, 0], // un amarillo más brillante que contraste en fondo oscuro
      pickable: true,
      onClick: info => {
        if (info.object) {
          alert(`POI: ${info.object.name}`);
        }
      },
      iconAtlas:
        'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
      iconMapping:
        'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.json'
    })
  ];

  return (
    <div style={{ height: '100vh', backgroundColor: '#121212', color: '#f0f0f0' }}>
      <DeckGL
        initialViewState={{ longitude: -73.05, latitude: -36.82, zoom: 13 }}
        controller={true}
        layers={layers}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          // 🔥 Tema oscuro de Mapbox
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-left" />
        </Map>
      </DeckGL>
    </div>
  );
}
