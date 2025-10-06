import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import MapView from "../components/MapView";
import SurveyModal from "../components/SurveyModal";
import TrackingStatus from "../components/TrackingStatus";
import useGeolocation from "../hooks/useGeolocation";
import trackingService from "../services/trackingService";
import "../css/style.css";

export default function MapPage() {
  const { userId } = useParams();
  const [geojson, setGeojson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  const trackingInitialized = useRef(false);
  
  const { location, error: geoError, loading: geoLoading, permissionStatus } = useGeolocation();

  // Cargar datos del mapa
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/assignments_geojson`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setGeojson(JSON.parse(data));
      } catch (err) {
        console.error("Error fetching GeoJSON:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  // Iniciar tracking UNA SOLA VEZ cuando tengamos permisos
  useEffect(() => {
    if (!userId || permissionStatus !== 'granted') {
      return;
    }

    if (!trackingInitialized.current) {
      console.log('Iniciando tracking automático para user:', userId);
      trackingService.startTracking(userId);
      setIsTracking(true);
      trackingInitialized.current = true;
    }

    return () => {
      console.log('Desmontando MapPage, deteniendo tracking');
      trackingService.stopTracking();
      setIsTracking(false);
    };
  }, [userId, permissionStatus]);

  // Manejar antes de cerrar la pestaña/navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      console.log('Cerrando ventana, enviando buffer...');
      trackingService.flushBuffer();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handler para marcar POI como visitado
  const handleMarkVisited = async (poiId) => {
    try {
      // Registrar en tracking que intentó marcar como visitado
      if (location) {
        trackingService.addPoint(location.latitude, location.longitude, location.accuracy);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poi_id: poiId,
          visited: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar como visitado');
      }

      // Recargar datos del mapa para actualizar el estado
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/assignments_geojson`);
      const data = await res.json();
      setGeojson(JSON.parse(data));
      
      alert('POI marcado como visitado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar como visitado: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading map data...</p>
      </div>
    );
  }

  if (!geojson) {
    return (
      <div className="error-container">
        <p>No data found for user {userId}</p>
      </div>
    );
  }

  return (
    <>
      <MapView 
        data={geojson} 
        initialCenter={[-73.0586, -36.8274]} 
        initialZoom={13}
        userLocation={location}
        onMarkVisited={handleMarkVisited}
      />
      
      <TrackingStatus location={location} isTracking={isTracking} />

      {geoLoading && (
        <div className="geo-loading">
          <div className="spinner-small"></div>
          Getting location...
        </div>
      )}
      
      {geoError && (
        <div className="geo-error">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <strong>Location Error</strong>
            <p>{geoError}</p>
            {permissionStatus === 'denied' && (
              <small>Please enable location permissions in your browser settings</small>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="floating-action-button"
        onClick={() => setShowModal(true)}
        disabled={!location}
        title={!location ? 'Waiting for location...' : 'Open survey'}
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