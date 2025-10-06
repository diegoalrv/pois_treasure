// frontend/src/pages/Home.jsx
import { Link } from "react-router-dom";
import "../css/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <img 
          src="https://d26q11cgz8q0ri.cloudfront.net/2023/08/21115443/logo-CLBB.png" 
          alt="Logo CLBB" 
          className="home-logo"
        />
        
        <h1 className="home-title">Workshop Movilidad: Human Agents</h1>
        
        <div className="home-description">
          <p>
            Bienvenido al workshop de movilidad urbana donde TÚ eres el agente de cambio.
            Explora la ciudad de Concepción y ayúdanos a recopilar datos sobre la experiencia
            de movilidad urbana.
          </p>
          
          <h2>¿Qué harás en este workshop?</h2>
          <ul className="objectives-list">
            <li>
              <span className="icon">📍</span>
              <div>
                <strong>Visitar Puntos de Interés (POIs)</strong>
                <p>Recorre diferentes lugares de la ciudad siguiendo tu mapa personalizado</p>
              </div>
            </li>
            <li>
              <span className="icon">📝</span>
              <div>
                <strong>Reportar Observaciones</strong>
                <p>Documenta tu experiencia sobre infraestructura, seguridad, accesibilidad y más</p>
              </div>
            </li>
            <li>
              <span className="icon">📊</span>
              <div>
                <strong>Contribuir a la Investigación</strong>
                <p>Tus datos ayudarán a mejorar la movilidad urbana en Concepción</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="home-instructions">
          <h3>Para comenzar</h3>
          <p>Escanea el código QR que te fue proporcionado para acceder a tu mapa personalizado</p>
          <div className="qr-placeholder">
            <span>📱</span>
            <p>Escanea tu QR para comenzar</p>
          </div>
        </div>

        <footer className="home-footer">
          <p>City Science Lab • Biobío • Summit 2025</p>
        </footer>
      </div>
    </div>
  );
}