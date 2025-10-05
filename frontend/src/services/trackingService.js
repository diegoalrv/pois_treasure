import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class TrackingService {
  constructor() {
    this.buffer = [];
    this.batchSize = 5; // Enviar cada 5 puntos
    this.intervalMs = 30000; // O cada 30 segundos
    this.intervalId = null;
  }

  /**
   * Inicia el tracking automático para un usuario
   */
  startTracking(userId, watchId) {
    this.userId = userId;
    this.watchId = watchId;

    // Enviar batch periódicamente
    this.intervalId = setInterval(() => {
      this.flushBuffer();
    }, this.intervalMs);

    console.log(`📍 Tracking iniciado para user ${userId}`);
  }

  /**
   * Agrega un punto de ubicación al buffer
   */
  addPoint(latitude, longitude) {
    if (!this.userId) return;

    const wktPoint = `POINT(${longitude} ${latitude})`;
    
    this.buffer.push({
      user_id: this.userId,
      wkt_point: wktPoint,
      timestamp: new Date().toISOString(),
    });

    console.log(`📌 Punto agregado al buffer (${this.buffer.length}/${this.batchSize})`);

    // Si alcanzamos el tamaño del batch, enviar inmediatamente
    if (this.buffer.length >= this.batchSize) {
      this.flushBuffer();
    }
  }

  /**
   * Envía el buffer al backend
   */
  async flushBuffer() {
    if (this.buffer.length === 0) return;

    const pointsToSend = [...this.buffer];
    this.buffer = []; // Limpiar buffer

    try {
      await axios.post(`${API_URL}/tracking/batch`, {
        points: pointsToSend,
      });
      console.log(`✅ Batch enviado: ${pointsToSend.length} puntos`);
    } catch (err) {
      console.error('❌ Error enviando tracking:', err);
      // Volver a agregar al buffer si falló
      this.buffer.unshift(...pointsToSend);
    }
  }

  /**
   * Detiene el tracking
   */
  stopTracking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Enviar puntos restantes
    this.flushBuffer();
    
    console.log('🛑 Tracking detenido');
  }

  /**
   * Obtiene un WKT POINT para usar en la encuesta
   */
  static getWKTPoint(latitude, longitude) {
    return `POINT(${longitude} ${latitude})`;
  }
}

export default new TrackingService();