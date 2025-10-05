import { useState } from "react";
import "../css/SurveyModal.css";
import trackingService from "../services/trackingService";

export default function SurveyModal({ onClose, userId, location }) {
  const [form, setForm] = useState({
    description: "",
    category: "",
    photo: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: "infrastructure", label: "Infrastructure | Infraestructura" },
    { value: "user_experience", label: "User Experience | Experiencia de Usuario" },
    { value: "vehicles", label: "Vehicles | Vehículos" },
    { value: "regulation", label: "Regulation | Regulación" },
    { value: "equity", label: "Equity | Equidad" },
    { value: "other", label: "Other | Otro" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhoto = (e) => {
    setForm({ ...form, photo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location) {
      alert("No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación.");
      return;
    }

    setSubmitting(true);

    try {
      // Crear FormData para enviar la foto
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("description", form.description);
      formData.append("category", form.category);
      
      // 📍 Agregar ubicación en formato WKT
      const wktPoint = trackingService.constructor.getWKTPoint(
        location.latitude,
        location.longitude
      );
      formData.append("wkt_point", wktPoint);
      
      // Agregar foto si existe
      if (form.photo) {
        formData.append("photo", form.photo);
      }

      console.log("📤 Enviando encuesta:", {
        user_id: userId,
        description: form.description,
        category: form.category,
        location: { lat: location.latitude, lng: location.longitude },
        wkt_point: wktPoint,
      });

      // TODO: Descomentar cuando tengas el endpoint configurado
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/surveys/`, {
      //   method: "POST",
      //   body: formData
      // });
      // 
      // if (!response.ok) throw new Error('Error al enviar encuesta');

      alert("✅ Encuesta enviada correctamente");
      onClose();
    } catch (error) {
      console.error("❌ Error enviando encuesta:", error);
      alert("Error al enviar la encuesta. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survey-modal-backdrop" onClick={onClose}>
      <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
        <div className="survey-modal-header">
          <h2>Mobility Survey | Encuesta de Movilidad</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="survey-modal-body">
          {/* Mostrar ubicación actual */}
          {location && (
            <div className="location-info">
              📍 Ubicación actual: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              <span className="location-accuracy">
                (±{Math.round(location.accuracy)}m)
              </span>
            </div>
          )}

          {/* Pregunta 2: What do you see? */}
          <div className="form-group">
            <label className="form-label">
              What do you see? | ¿Qué estás viendo? <span className="required">*</span>
            </label>
            <p className="form-hint">
              Briefly describe, objectively or subjectively, the physical aspects of the place
            </p>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Describe what you observe..."
            />
          </div>

          {/* Pregunta 3: Choose category */}
          <div className="form-group">
            <label className="form-label">
              Choose the appropriate category | Escoge la categoría adecuada
            </label>
            <div className="radio-group">
              {categories.map((cat) => (
                <label key={cat.value} className="radio-option">
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={form.category === cat.value}
                    onChange={handleChange}
                  />
                  <span className="radio-label">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pregunta 4: Insert photo */}
          <div className="form-group">
            <label className="form-label">
              Insert a photo
            </label>
            <p className="form-hint">
              Provides the sharpest and widest image possible
            </p>
            <div className="photo-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                id="photo-input"
                className="photo-input"
              />
              <label htmlFor="photo-input" className="photo-input-label">
                📷 {form.photo ? form.photo.name : "Select or capture image"}
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting || !location}>
            {submitting ? "Sending..." : "Submit | Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}