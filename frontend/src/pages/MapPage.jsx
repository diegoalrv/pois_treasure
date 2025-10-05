import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MapView from "../components/MapView";

export default function MapPage() {
  const { userId } = useParams();
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/assignments_geojson`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setGeojson(JSON.parse(data));
      } catch (err) {
        console.error("❌ Error fetching GeoJSON:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) return <div>Loading map data...</div>;
  if (!geojson) return <div>No data found for map {userId}</div>;

  const handleFabClick = () => {
    alert("Abrir modal o encuesta aquí");
  };

  return (
    <>
      <MapView data={geojson} initialCenter={[-73.0586, -36.8274]} initialZoom={13} />
      <button className="floating-action-button" onClick={handleFabClick}>
        +
      </button>
    </>
  );
}
