import { useEffect, useState } from 'react';
import '../css/TrackingStatus.css';

export default function TrackingStatus({ location, isTracking }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    // Escuchar eventos de sincronización
    const handleTrackingSync = (event) => {
      const { count, success, error } = event.detail;
      
      setSyncStatus({
        count,
        success,
        error,
        timestamp: Date.now()
      });

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => {
        setSyncStatus(null);
      }, 5000);
    };

    window.addEventListener('trackingSync', handleTrackingSync);

    return () => {
      window.removeEventListener('trackingSync', handleTrackingSync);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className="tracking-status-container">
      {/* Estado principal */}
      <div className={`tracking-status ${isTracking ? 'active' : 'inactive'}`}>
        <div className="status-indicator">
          {isTracking ? (
            <>
              <span className="pulse-dot"></span>
              <span className="status-text">Tracking Active</span>
            </>
          ) : (
            <>
              <span className="inactive-dot"></span>
              <span className="status-text">Tracking Inactive</span>
            </>
          )}
        </div>

        {location && isTracking && (
          <div className="location-details">
            <span className="accuracy-badge">
              ±{Math.round(location.accuracy)}m
            </span>
          </div>
        )}
      </div>

      {/* Notificación de sincronización */}
      {syncStatus && (
        <div className={`sync-notification ${syncStatus.success ? 'success' : 'error'}`}>
          {syncStatus.success ? (
            <>
              <span className="sync-icon">✓</span>
              <span className="sync-text">{syncStatus.count} points synced</span>
            </>
          ) : (
            <>
              <span className="sync-icon">⚠</span>
              <span className="sync-text">Sync failed, will retry</span>
            </>
          )}
        </div>
      )}

      {/* Botón para ocultar */}
      <button 
        className="hide-status-btn"
        onClick={() => setShowStatus(false)}
        title="Hide status"
      >
        ×
      </button>
    </div>
  );
}