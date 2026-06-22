import { useState } from "react";
import "../css/DisclaimerFooter.css";

export default function DisclaimerFooter() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <footer className="disclaimer-footer">
        <span>Términos de uso de la plataforma</span>
        <button className="disclaimer-readmore" onClick={() => setShowInfo(true)}>
          Leer más
        </button>
      </footer>

      {showInfo && (
        <div className="info-overlay" onClick={() => setShowInfo(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()}>
            <button
              className="info-close"
              onClick={() => setShowInfo(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2>Acerca de esta plataforma</h2>
            <p>
              Plataforma desarrollada de manera particular y con recursos propios,
              perteneciente en su totalidad a su desarrollador, quien ostenta todos los
              derechos de autor y de propiedad intelectual sobre el software, su código,
              diseño y contenidos.
            </p>
            <p>
              Fue puesta a disposición de forma gratuita y voluntaria, exclusivamente
              con fines demostrativos y educativos, en el marco del evento
              <strong> City Science Summit</strong>. No constituye un producto comercial
              ni un servicio oficial de ninguna institución organizadora del evento.
            </p>
            <p>
              Los datos recolectados jamás serán publicados, vendidos, cedidos ni
              ofrecidos para fines comerciales. Se utilizan únicamente con fines de
              análisis y visualización propios de la actividad, y se tratan conforme a la
              normativa de protección de datos aplicable.
            </p>
            <p>
              La plataforma se ofrece <strong>"tal cual" (as is)</strong>, sin garantías
              de ningún tipo. El desarrollador no se hace responsable por daños directos
              o indirectos, pérdidas de datos, interrupciones del servicio ni por el uso
              o la interpretación que terceros hagan de la información aquí presentada.
              El uso de la plataforma implica la aceptación de estas condiciones.
            </p>
            <p className="info-contact">© Todos los derechos reservados</p>
          </div>
        </div>
      )}
    </>
  );
}
