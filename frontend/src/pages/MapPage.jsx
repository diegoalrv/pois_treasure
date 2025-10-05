import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MapView from "../components/MapView";
import SurveyModal from "../components/SurveyModal";
import useGeolocation from "../hooks/useGeolocation";
import trackingService from "../services/trackingService";
import "../css/style.css";

export default function MapPage() {
  const { userId } = useParams();
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // 📍 Hook de geolocalización
  const { location, error: geoError, loading: geoLoading } = useGeolocation();

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

  // 📍 Iniciar tracking cuando tengamos ubicación
  useEffect(() => {
    if (!location || !userId) return;

    // Iniciar el servicio de tracking
    trackingService.startTracking(userId);

    // Agregar el primer punto
    trackingService.addPoint(location.latitude, location.longitude);

    return () => {
      // Detener tracking al desmontar
      trackingService.stopTracking();
    };
  }, [userId]); // Solo cuando cambie userId

  // 📍 Agregar punto cada vez que cambie la ubicación
  useEffect(() => {
    if (location && userId) {
      trackingService.addPoint(location.latitude, location.longitude);
    }
  }, [location, userId]);

  if (loading) return <div>Loading map data...</div>;
  if (!geojson) return <div>No data found for map {userId}</div>;

  return (
    <>
      <MapView data={geojson} initialCenter={[-73.0586, -36.8274]} initialZoom={13} />
      
      {/* Mostrar estado de geolocalización */}
      {geoLoading && (
        <div className="geo-status loading">
          📍 Obteniendo ubicación...
        </div>
      )}
      {geoError && (
        <div className="geo-status error">
          ⚠️ {geoError}
        </div>
      )}
      {location && (
        <div className="geo-status success">
          📍 Tracking activo
        </div>
      )}

      <button
        type="button"
        className="floating-action-button"
        onClick={() => setShowModal(true)}
        disabled={!location} // Deshabilitar si no hay ubicación
      >
        +
      </button>
      
      {showModal && (
        <SurveyModal 
          onClose={() => setShowModal(false)} 
          userId={userId}
          location={location}
        />
      )}
    </>
  );
}