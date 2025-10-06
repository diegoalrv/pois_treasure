import React from 'react';
import '../css/ScanRequired.css';

export default function ScanRequired() {
  return (
    <div className="scan-required-container">
      <div className="scan-required-content">
        <div className="scan-icon">📱</div>
        <h1>Acceso Requerido</h1>
        <p>Para acceder al workshop de movilidad, necesitas escanear el código QR.</p>
        
        <div className="scan-instructions">
          <h3>¿Cómo acceder?</h3>
          <ol>
            <li>Busca el código QR en el evento</li>
            <li>Escanéalo con la cámara de tu teléfono</li>
            <li>Selecciona tu perfil de usuario</li>
            <li>¡Comienza a participar!</li>
          </ol>
        </div>

        <div className="help-section">
          <p className="help-text">
            ¿No tienes el código QR? Contacta a los organizadores del evento.
          </p>
        </div>
      </div>
    </div>
  );
}