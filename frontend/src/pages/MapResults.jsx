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
  infrastructure: [254, 195, 31, 200],
  user_experience: [59, 130, 246, 200],
  vehicles: [239, 68, 68, 200],
  regulation: [168, 85, 247, 200],
  equity: [34, 197, 94, 200],
  other: [156, 163, 175, 200],
};

// Colores por perfil de usuario
const PROFILE_COLORS = {
  student: [59, 130, 246, 180],
  elderly: [168, 85, 247, 180],
  worker: [34, 197, 94, 180],
  tourist: [251, 146, 60, 180],
  default: [156, 163, 175, 180],
};

// Función para interpolar color basado en timestamp
const getColorByTime = (timestamp, minTime, maxTime) => {
  const normalized = (timestamp - minTime) / (maxTime - minTime || 1);
  
  // Gradient de azul (mañana) → amarillo (mediodía) → rojo (tarde/noche)
  if (normalized < 0.33) {
    const t = normalized / 0.33;
    return [
      59 + (34 - 59) * t,
      130 + (211 - 130) * t,
      246 + (211 - 246) * t,
      180
    ];
  } else if (normalized < 0.66) {
    const t = (normalized - 0.33) / 0.33;
    return [
      34 + (254 - 34) * t,
      211 + (195 - 211) * t,
      211 + (31 - 211) * t,
      180
    ];
  } else {
    const t = (normalized - 0.66) / 0.34;
    return [
      254 + (239 - 254) * t,
      195 + (68 - 195) * t,
      31 + (68 - 31) * t,
      180
    ];
  }
};

export default function MapResults() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const mapInitialized = useRef(false);

  const [surveysData, setSurveysData] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [stats, setStats] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  
  const [filters, setFilters] = useState({
    category: 'all',
    showSurveys: true,
    showTracking: false,
    trackingColorMode: 'profile',
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      
      try {
        const statsRes = await fetch(`${API_URL}/results/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
        
        const surveysRes = await fetch(`${API_URL}/results/surveys/geojson`);
        const surveysData = await surveysRes.json();
        const surveysParsed = typeof surveysData === 'string' 
          ? JSON.parse(surveysData) 
          : surveysData;
        setSurveysData(surveysParsed);
        
        const trackingRes = await fetch(`${API_URL}/results/tracking/geojson`);
        const trackingData = await trackingRes.json();
        const trackingParsed = typeof trackingData === 'string'
          ? JSON.parse(trackingData)
          : trackingData;
        setTrackingData(trackingParsed);
        
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, []);

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

  const timeRange = trackingData ? (() => {
    const timestamps = trackingData.features.map(f => 
      new Date(f.properties.timestamp).getTime()
    ).filter(t => !isNaN(t));
    
    return timestamps.length > 0 ? {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps)
    } : null;
  })() : null;

  const filteredSurveysData = surveysData && filters.category !== 'all'
    ? {
        type: 'FeatureCollection',
        features: surveysData.features.filter(
          feature => feature.properties.category === filters.category
        )
      }
    : surveysData;

  useEffect(() => {
    if (!mapRef.current) return;

    const layers = [
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

    if (filters.showTracking && trackingData) {
      layers.push(
        new GeoJsonLayer({
          id: 'tracking',
          data: trackingData,
          pointRadiusMinPixels: 4,
          pointRadiusMaxPixels: 6,
          getFillColor: d => {
            if (filters.trackingColorMode === 'time' && timeRange) {
              const timestamp = new Date(d.properties.timestamp).getTime();
              return getColorByTime(timestamp, timeRange.min, timeRange.max);
            } else {
              const profile = d.properties.profile_name?.toLowerCase() || 'default';
              return PROFILE_COLORS[profile] || PROFILE_COLORS.default;
            }
          },
          getLineColor: [0, 0, 0, 255],
          lineWidthMinPixels: 1,
          pickable: false,
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
  }, [filteredSurveysData, trackingData, filters.showSurveys, filters.showTracking, filters.trackingColorMode, timeRange]);

  useEffect(() => {
    if (!mapRef.current || !popupInfo || popupInfo.type !== 'survey') return;

    const { category, description, photo_url, created_at } = popupInfo.data;
    const date = new Date(created_at).toLocaleDateString('es-CL');
    
    const html = `
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

    const popup = new mapboxgl.Popup({ closeButton: true })
      .setLngLat(popupInfo.coords)
      .setHTML(html)
      .addTo(mapRef.current);

    return () => popup.remove();
  }, [popupInfo]);

  return (
    <div className="map-results-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando datos...</p>
        </div>
      )}

      <div className={`results-panel ${panelCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="panel-toggle"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          title={panelCollapsed ? 'Expandir panel' : 'Contraer panel'}
        >
          {panelCollapsed ? '▶' : '◀'}
        </button>

        {!panelCollapsed && (
          <>
            <div className="panel-header">
              <div className="logo-placeholder">🗺️</div>
              <h1>Resultados Workshop Movilidad</h1>
            </div>
        
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

        <div className="filters-section">
          <h3>Filtros</h3>
          
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
            
            {filters.showTracking && (
              <div className="color-mode-selector">
                <label className="radio-mode-small">
                  <input
                    type="radio"
                    name="trackingColorMode"
                    value="profile"
                    checked={filters.trackingColorMode === 'profile'}
                    onChange={e => setFilters({...filters, trackingColorMode: e.target.value})}
                  />
                  <span>Por perfil</span>
                </label>
                <label className="radio-mode-small">
                  <input
                    type="radio"
                    name="trackingColorMode"
                    value="time"
                    checked={filters.trackingColorMode === 'time'}
                    onChange={e => setFilters({...filters, trackingColorMode: e.target.value})}
                  />
                  <span>Por tiempo</span>
                </label>
              </div>
            )}
          </div>
        </div>

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
          </>
        )}
      </div>

      <div ref={mapContainer} className="results-map" />
    </div>
  );
}