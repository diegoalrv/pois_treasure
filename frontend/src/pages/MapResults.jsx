import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { GeoJsonLayer } from "@deck.gl/layers";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";
import "../css/MapResults.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const github_raw_base =
  "https://raw.githubusercontent.com/diegoalrv/mobility-workshop/refs/heads/master";

// Colores por categoría
const CATEGORY_COLORS = {
  infrastructure: [254, 195, 31, 200],      // Amarillo
  user_experience: [59, 130, 246, 200],     // Azul
  vehicles: [239, 68, 68, 200],             // Rojo
  regulation: [168, 85, 247, 200],          // Púrpura
  equity: [34, 197, 94, 200],               // Verde
  other: [156, 163, 175, 200],              // Gris
};

export default function MapResults() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const mapInitialized = useRef(false);

  // Estados para datos
  const [surveysData, setSurveysData] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [stats, setStats] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filters, setFilters] = useState({
    category: 'all',
    showSurveys: true,
    showTracking: false,
  });

  // ⭐ Cargar TODOS los datos UNA SOLA VEZ al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      
      try {
        // Cargar estadísticas
        const statsRes = await fetch(`${API_URL}/results/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
        
        // Cargar encuestas
        const surveysRes = await fetch(`${API_URL}/results/surveys/geojson`);
        const surveysData = await surveysRes.json();
        // Si ya es un objeto, usarlo directamente; si es string, parsearlo
        const surveysParsed = typeof surveysData === 'string' 
          ? JSON.parse(surveysData) 
          : surveysData;
        setSurveysData(surveysParsed);
        console.log('📊 Encuestas cargadas:', surveysParsed);
        
        // Cargar tracking
        const trackingRes = await fetch(`${API_URL}/results/tracking/geojson`);
        const trackingData = await trackingRes.json();
        // Si ya es un objeto, usarlo directamente; si es string, parsearlo
        const trackingParsed = typeof trackingData === 'string'
          ? JSON.parse(trackingData)
          : trackingData;
        setTrackingData(trackingParsed);
        console.log('📍 Tracking cargado:', trackingParsed);
        
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []); // ⭐ Solo se ejecuta UNA VEZ al montar

  // Inicializar mapa
  useEffect(() => {
    if (mapInitialized.current || !mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-73.0586, -36.8274],
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    mapInitialized.current = true;

    // Ajustar vista al área
    fetch(`${github_raw_base}/urban_explore/pois_manager/static/geometries/area_mobility_workshop.geojson`)
      .then(r => r.json())
      .then(area => {
        const bbox = turf.bbox(area);
        if (bbox && bbox.length === 4) {
          map.fitBounds(bbox, { padding: 50, maxZoom: 15 });
        }
      })
      .catch(e => console.error('Error ajustando vista:', e));

    return () => {
      mapInitialized.current = false;
      map.remove();
    };
  }, []);

  // ⭐ Filtrar datos en memoria según la categoría seleccionada
  const filteredSurveysData = surveysData && filters.category !== 'all'
    ? {
        type: 'FeatureCollection',
        features: surveysData.features.filter(
          feature => feature.properties.category === filters.category
        )
      }
    : surveysData;

  // Actualizar capas
  useEffect(() => {
    if (!mapRef.current) return;

    const layers = [
      // Área base
      new GeoJsonLayer({
        id: 'area-fill',
        data: `${github_raw_base}/urban_explore/pois_manager/static/geometries/area_mobility_workshop.geojson`,
        stroked: true,
        filled: true,
        getFillColor: [254, 195, 31, 25],
        getLineColor: [254, 195, 31, 200],
        lineWidthMinPixels: 2,
      }),
    ];

    // Capa de encuestas
    if (filters.showSurveys && filteredSurveysData) {
      layers.push(
        new GeoJsonLayer({
          id: 'surveys',
          data: filteredSurveysData,
          pointRadiusMinPixels: 8,
          pointRadiusMaxPixels: 12,
          getFillColor: d => CATEGORY_COLORS[d.properties.category] || [255, 255, 255, 200],
          getLineColor: [0, 0, 0, 255],
          lineWidthMinPixels: 2,
          pickable: true,
          onClick: info => {
            if (!info.object) return setPopupInfo(null);
            const coords = info.object.geometry.coordinates;
            const props = info.object.properties || {};
            setPopupInfo({
              type: 'survey',
              coords,
              data: props,
            });
          },
        })
      );
    }

    // Capa de tracking
    if (filters.showTracking && trackingData) {
      layers.push(
        new GeoJsonLayer({
          id: 'tracking',
          data: trackingData,
          pointRadiusMinPixels: 3,
          pointRadiusMaxPixels: 5,
          getFillColor: [139, 92, 246, 150],
          getLineColor: [139, 92, 246, 255],
          lineWidthMinPixels: 1,
          pickable: true,
          onClick: info => {
            if (!info.object) return setPopupInfo(null);
            const coords = info.object.geometry.coordinates;
            const props = info.object.properties || {};
            setPopupInfo({
              type: 'tracking',
              coords,
              data: props,
            });
          },
        })
      );
    }

    const overlay = new MapboxOverlay({ layers });

    if (overlayRef.current) {
      overlayRef.current.finalize();
    }

    mapRef.current.addControl(overlay);
    overlayRef.current = overlay;

    return () => {
      if (overlayRef.current) {
        overlayRef.current.finalize();
      }
    };
  }, [filteredSurveysData, trackingData, filters.showSurveys, filters.showTracking]); // ⭐ Actualizar cuando cambian los filtros de visualización

  // Popup
  useEffect(() => {
    if (!mapRef.current || !popupInfo) return;

    let html = '';
    
    if (popupInfo.type === 'survey') {
      const { category, description, photo_url, created_at } = popupInfo.data;
      const date = new Date(created_at).toLocaleDateString('es-CL');
      
      html = `
        <div class="result-popup">
          <div class="popup-category" style="background: rgba(${CATEGORY_COLORS[category]?.slice(0, 3).join(',')}, 0.2)">
            ${category.replace('_', ' ').toUpperCase()}
          </div>
          ${photo_url ? `<img src="${photo_url}" class="popup-photo" />` : ''}
          <p class="popup-description">${description || 'Sin descripción'}</p>
          <div class="popup-footer">
            <span>📅 ${date}</span>
          </div>
        </div>
      `;
    } else if (popupInfo.type === 'tracking') {
      const { timestamp, user_id } = popupInfo.data;
      const date = new Date(timestamp).toLocaleString('es-CL');
      
      html = `
        <div class="result-popup">
          <div class="popup-category" style="background: rgba(139, 92, 246, 0.2)">
            TRACKING POINT
          </div>
          <p class="popup-description">Usuario: ${user_id}</p>
          <div class="popup-footer">
            <span>📅 ${date}</span>
          </div>
        </div>
      `;
    }

    const popup = new mapboxgl.Popup({ closeButton: true })
      .setLngLat(popupInfo.coords)
      .setHTML(html)
      .addTo(mapRef.current);

    return () => popup.remove();
  }, [popupInfo]);

  return (
    <div className="map-results-container">
      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      )}

      {/* Panel de control */}
      <div className="results-panel">
        <h1>📊 Resultados del Proyecto</h1>
        
        {/* Estadísticas */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.total_surveys}</span>
              <span className="stat-label">Encuestas</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.total_tracking_points}</span>
              <span className="stat-label">Puntos GPS</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.users_with_surveys}</span>
              <span className="stat-label">Participantes</span>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="filters-section">
          <h3>Filtros</h3>
          
          {/* Categorías */}
          <div className="filter-group">
            <label>Categoría</label>
            <select 
              value={filters.category}
              onChange={e => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">Todas</option>
              <option value="infrastructure">Infraestructura</option>
              <option value="user_experience">Experiencia de Usuario</option>
              <option value="vehicles">Vehículos</option>
              <option value="regulation">Regulación</option>
              <option value="equity">Equidad</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Capas */}
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showSurveys}
                onChange={e => setFilters({...filters, showSurveys: e.target.checked})}
              />
              Mostrar Encuestas
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.showTracking}
                onChange={e => setFilters({...filters, showTracking: e.target.checked})}
              />
              Mostrar Tracking GPS
            </label>
          </div>
        </div>

        {/* Distribución por categoría */}
        {stats?.surveys_by_category && (
          <div className="category-distribution">
            <h3>Distribución por Categoría</h3>
            {stats.surveys_by_category.map(item => (
              <div key={item.category} className="category-bar">
                <span className="category-name">{item.category}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{
                      width: `${(item.count / stats.total_surveys) * 100}%`,
                      background: `rgb(${CATEGORY_COLORS[item.category]?.slice(0, 3).join(',')})`
                    }}
                  />
                </div>
                <span className="category-count">{item.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* ⭐ Participación por perfil */}
        {stats?.profile_participation && stats.profile_participation.length > 0 && (
          <div className="category-distribution">
            <h3>Participación por Perfil</h3>
            {stats.profile_participation.map(item => (
              <div key={item.profile} className="profile-participation-item">
                <div className="profile-header">
                  <span className="profile-name">{item.profile}</span>
                  <span className="profile-rate">{item.participation_rate}%</span>
                </div>
                <div className="profile-stats">
                  <span className="profile-stat">
                    👥 {item.total_users} usuarios
                  </span>
                  <span className="profile-stat">
                    ✅ {item.users_with_surveys} activos
                  </span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{
                      width: `${item.participation_rate}%`,
                      background: '#3b82f6'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ⭐ Encuestas por perfil */}
        {stats?.surveys_by_profile && stats.surveys_by_profile.length > 0 && (
          <div className="category-distribution">
            <h3>Encuestas por Perfil</h3>
            {stats.surveys_by_profile.map(item => (
              <div key={item.profile} className="category-bar">
                <span className="category-name">{item.profile}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{
                      width: `${(item.count / stats.total_surveys) * 100}%`,
                      background: '#10b981'
                    }}
                  />
                </div>
                <span className="category-count">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div ref={mapContainer} className="results-map" />
    </div>
  );
}