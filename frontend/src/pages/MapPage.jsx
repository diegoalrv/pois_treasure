import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import UserMap from "../components/MapView"; // 👈 Cambié el nombre al componente

export default function MapPage() {
  const { userId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/${userId}/assignments_geojson`
        );
        console.log("Assignments GeoJSON:", res.data);
        setAssignments(res.data); // ahora es un FeatureCollection
      } catch (err) {
      console.error("Error cargando POIs:", err);
    } finally {
      setLoading(false);
    }
  }
  fetchAssignments();
}, [userId]);

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Cargando mapa...</p>;

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <UserMap assignments={assignments} />
    </div>
  );
}
