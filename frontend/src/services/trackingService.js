import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const STORAGE_KEY = 'mobility_tracking_buffer';

class TrackingService {
  constructor() {
    this.buffer = [];
    this.batchSize = 10; // Enviar cada 10 puntos
    this.intervalMs = 30000; // O cada 30 segundos
    this.trackingIntervalMs = 30000; // ⭐ Capturar ubicación cada 30 segundos
    this.minDistanceMeters = 10; // Mínimo 10m de distancia para registrar
    this.intervalId = null;
    this.trackingIntervalId = null;
    this.userId = null;
    this.watchId = null;
    this.lastPosition = null;
    this.lastCaptureTime = null;
    this.isTracking = false;
    
    // ⭐ NUEVO: Detener cualquier tracking previo al iniciar
    this.stopAllTracking();
    
    // Cargar buffer desde localStorage al iniciar
    this.loadBufferFromStorage();
  }

  /**
   * Inicia el tracking automático para un usuario
   */
  startTracking(userId) {
    if (this.isTracking) {
      console.log('⚠️ Tracking ya está activo');
      return;
    }

    // ⭐ Limpiar cualquier tracking previo
    this.stopAllTracking();

    this.userId = userId;
    this.isTracking = true;
    this.lastCaptureTime = null;

    console.log(`📍 Iniciando tracking para user ${userId}...`);

    // ⭐ Usar setInterval para capturar cada minuto
    this.trackingIntervalId = setInterval(() => {
      console.log(`⏰ Capturando posición (intervalo: ${this.trackingIntervalMs/1000}s)`);
      this.captureCurrentPosition();
    }, this.trackingIntervalMs);

    // Capturar posición inicial inmediatamente
    this.captureCurrentPosition();

    // Enviar batch periódicamente
    this.intervalId = setInterval(() => {
      this.flushBuffer();
    }, this.intervalMs);

    // Intentar enviar buffer pendiente al iniciar
    this.flushBuffer();

    console.log(`✅ Tracking iniciado (captura cada ${this.trackingIntervalMs/1000}s, flush cada ${this.intervalMs/1000}s)`);
  }

  /**
   * ⭐ NUEVO: Captura la posición actual usando getCurrentPosition
   */
  captureCurrentPosition() {
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      geoOptions
    );
  }

  /**
   * Maneja actualización de posición desde el GPS
   */
  handlePositionUpdate(position) {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Filtrar puntos con baja precisión (más de 50m de error)
    if (accuracy > 50) {
      console.log(`⚠️ Precisión baja ignorada: ±${Math.round(accuracy)}m`);
      return;
    }

    // Verificar distancia mínima desde último punto
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        latitude,
        longitude
      );
      
      if (distance < this.minDistanceMeters) {
        console.log(`⏭️ Punto ignorado: solo ${Math.round(distance)}m desde último punto`);
        return;
      }
    }

    // Agregar punto al buffer
    this.addPoint(latitude, longitude, accuracy);
    this.lastPosition = { latitude, longitude };
    this.lastCaptureTime = Date.now();
  }

  /**
   * Maneja errores de geolocalización
   */
  handlePositionError(error) {
    let message = 'Error desconocido';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Permiso de ubicación denegado';
        this.stopTracking();
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Ubicación no disponible';
        break;
      case error.TIMEOUT:
        message = 'Timeout obteniendo ubicación';
        break;
    }
    console.error(`❌ Error GPS: ${message}`);
  }

  /**
   * Calcula distancia entre dos puntos en metros (Haversine)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  }

  /**
   * Agrega un punto de ubicación al buffer
   */
  addPoint(latitude, longitude, accuracy = null) {
    if (!this.userId) return;

    const wktPoint = `POINT(${longitude} ${latitude})`;
    
    // ⭐ Usar hora local de Chile (UTC-3)
    const now = new Date();
    const timestamp = new Date(now.getTime() - (3 * 60 * 60 * 1000)).toISOString();
    
    const point = {
      user_id: this.userId,
      wkt_point: wktPoint,
      timestamp: timestamp,
      accuracy: accuracy ? Math.round(accuracy) : null,
    };

    this.buffer.push(point);
    this.saveBufferToStorage();

    const localTime = new Date(timestamp).toLocaleString('es-CL');
    console.log(`📌 Punto agregado (${this.buffer.length}/${this.batchSize}) - ${localTime} - ±${accuracy}m`);

    // Si alcanzamos el tamaño del batch, enviar inmediatamente
    if (this.buffer.length >= this.batchSize) {
      this.flushBuffer();
    }
  }

  /**
   * Guarda el buffer en localStorage
   */
  saveBufferToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        buffer: this.buffer,
        userId: this.userId,
        lastSaved: new Date().toISOString()
      }));
    } catch (err) {
      console.error('❌ Error guardando buffer en storage:', err);
    }
  }

  /**
   * Carga el buffer desde localStorage
   */
  loadBufferFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.buffer = data.buffer || [];
        console.log(`📦 Buffer cargado desde storage: ${this.buffer.length} puntos pendientes`);
      }
    } catch (err) {
      console.error('❌ Error cargando buffer desde storage:', err);
      this.buffer = [];
    }
  }

  /**
   * Envía el buffer al backend
   */
  async flushBuffer() {
    if (this.buffer.length === 0) {
      console.log('📭 Buffer vacío, nada que enviar');
      return;
    }

    const pointsToSend = [...this.buffer];
    const sendCount = pointsToSend.length;
    
    // Limpiar buffer inmediatamente para evitar duplicados
    this.buffer = [];
    this.saveBufferToStorage();

    try {
      console.log(`📤 Enviando batch de ${sendCount} puntos...`);
      
      const response = await axios.post(`${API_URL}/tracking/batch`, {
        points: pointsToSend,
      });

      console.log(`✅ Batch enviado exitosamente:`, response.data);
      
      // Emitir evento personalizado para notificar al UI (opcional)
      window.dispatchEvent(new CustomEvent('trackingSync', { 
        detail: { count: sendCount, success: true }
      }));

    } catch (err) {
      console.error('❌ Error enviando tracking:', err);
      
      // Volver a agregar al buffer si falló
      this.buffer.unshift(...pointsToSend);
      this.saveBufferToStorage();
      
      console.log(`🔄 ${sendCount} puntos devueltos al buffer para reintentar`);
      
      // Emitir evento de error
      window.dispatchEvent(new CustomEvent('trackingSync', { 
        detail: { count: sendCount, success: false, error: err.message }
      }));
    }
  }

  /**
   * Detiene el tracking y envía puntos pendientes
   */
  stopTracking() {
    if (!this.isTracking) return;

    console.log('🛑 Deteniendo tracking...');
    this.stopAllTracking();
    
    // Enviar puntos restantes
    this.flushBuffer();
    
    this.isTracking = false;
    this.lastPosition = null;
    this.lastCaptureTime = null;
    
    console.log('✅ Tracking detenido completamente');
  }

  /**
   * ⭐ NUEVO: Detiene TODOS los intervalos y watchers
   */
  stopAllTracking() {
    // Detener interval de captura
    if (this.trackingIntervalId) {
      clearInterval(this.trackingIntervalId);
      this.trackingIntervalId = null;
      console.log('⏹️ Intervalo de captura detenido');
    }

    // Detener interval de flush
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Intervalo de flush detenido');
    }
    
    // Detener watchPosition si existe
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('⏹️ WatchPosition detenido');
    }
  }

  /**
   * Obtiene estadísticas del tracking
   */
  getStats() {
    return {
      isTracking: this.isTracking,
      userId: this.userId,
      bufferSize: this.buffer.length,
      batchSize: this.batchSize,
      lastPosition: this.lastPosition,
      lastCaptureTime: this.lastCaptureTime,
      trackingIntervalMs: this.trackingIntervalMs,
    };
  }

  /**
   * Obtiene un WKT POINT para usar en la encuesta
   */
  static getWKTPoint(latitude, longitude) {
    return `POINT(${longitude} ${latitude})`;
  }

  /**
   * Limpia todo el buffer (útil para testing o reset)
   */
  clearBuffer() {
    this.buffer = [];
    this.saveBufferToStorage();
    console.log('🗑️ Buffer limpiado');
  }
}

export default new TrackingService();