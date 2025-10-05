import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-73.05, -36.82],
  zoom: 13
});

// fetch(`${import.meta.env.VITE_API_URL}/pois`)
//   .then(res => res.json())
//   .then(data => {
//     data.forEach(p => {
//       const coords = p.wkt_geometry
//         .replace("POINT (", "")
//         .replace(")", "")
//         .split(" ")
//         .map(Number);
//       new mapboxgl.Marker().setLngLat(coords).addTo(map);
//     });
//   });
