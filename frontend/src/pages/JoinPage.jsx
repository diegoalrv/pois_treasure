// frontend/src/pages/JoinPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../css/JoinPage.css";

export default function JoinPage() {
  const { profile } = useParams();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya hay un userId guardado
    const checkExistingUser = async () => {
      const storedUserId = localStorage.getItem('workshop_user_id');
      
      if (storedUserId) {
        try {
          // Verificar que el usuario existe en la BD
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/${storedUserId}/assignments`);
          if (res.data) {
            // Usuario válido, redirigir directamente
            navigate(`/map/${storedUserId}`);
            return;
          }
        } catch (err) {
          // Usuario no existe en BD, limpiar localStorage
          localStorage.removeItem('workshop_user_id');
        }
      }
      setChecking(false);
    };

    checkExistingUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa un nombre de usuario' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/join`, {
        username: username.trim(),
        profile
      });
      
      const userId = res.data.id;
      
      // Guardar en localStorage
      localStorage.setItem('workshop_user_id', userId);
      
      setMessage({ type: 'success', text: `¡Bienvenido ${username}! Redirigiendo a tu mapa...` });
      
      setTimeout(() => navigate(`/map/${userId}`), 1500);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || "Error al crear usuario. Por favor intenta de nuevo."
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="loading-spinner"></div>
          <p>Verificando...</p>
        </div>
      </div>
    );
  }

  const profileNames = {
    student: "Estudiante",
    elderly: "Adulto Mayor",
    worker: "Trabajador",
    tourist: "Turista"
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <img 
          src="https://d26q11cgz8q0ri.cloudfront.net/2023/08/21115443/logo-CLBB.png" 
          alt="Logo CLBB" 
          className="join-logo"
        />
        
        <h1 className="join-title">Únete al Workshop</h1>
        
        <div className="profile-badge">
          <span className="profile-icon">
            {profile === 'student' ? '🎓' : 
             profile === 'elderly' ? '👴' : 
             profile === 'worker' ? '💼' : '🧳'}
          </span>
          <span className="profile-name">Perfil: {profileNames[profile] || profile}</span>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="Ingresa tu nombre"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.type === 'error' ? '⚠️' : '✓'} {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="join-button">
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Procesando...
              </>
            ) : (
              'Comenzar'
            )}
          </button>
        </form>

        <div className="join-footer">
          <p>Al unirte, aceptas participar en la recolección de datos de movilidad urbana</p>
        </div>
      </div>
    </div>
  );
}