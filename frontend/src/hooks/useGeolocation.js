import { useState, useEffect, useRef } from 'react';

export default function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const updateIntervalRef = useRef(null);

  useEffect(() => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Verificar permisos si la API está disponible
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        
        // Escuchar cambios en permisos
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      }).catch(() => {
        // Si falla la consulta de permisos, continuar normalmente
        console.log('No se pudo consultar el estado de permisos');
      });
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // ⭐ Cache de 30 segundos (más relajado)
      ...options,
    };

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      });
      setError(null);
      setLoading(false);
      setPermissionStatus('granted');
    };

    const handleError = (err) => {
      let errorMessage = 'Unknown error';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          setPermissionStatus('denied');
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'The request to get user location timed out';
          break;
      }
      setError(errorMessage);
      setLoading(false);
    };

    // ⭐ Función para actualizar ubicación
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    };

    // Obtener ubicación inicial
    setLoading(true);
    updateLocation();

    // ⭐ Actualizar ubicación cada 30 segundos (solo para el UI)
    // El tracking real lo maneja TrackingService
    updateIntervalRef.current = setInterval(() => {
      updateLocation();
    }, 30000); // 30 segundos

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []); // Solo se ejecuta al montar

  // Función para reintentar obtener ubicación manualmente
  const retry = () => {
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
        setError(null);
        setLoading(false);
        setPermissionStatus('granted');
      },
      (err) => {
        let errorMessage = 'Unknown error';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            setPermissionStatus('denied');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Request timed out';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { 
    location, 
    error, 
    loading, 
    permissionStatus,
    retry 
  };
}