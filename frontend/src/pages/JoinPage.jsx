import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function JoinPage() {
  const { profile } = useParams();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/join`, {
        username,
        profile
      });
      setMessage(`Usuario creado con id ${res.data.id}`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Error al crear usuario");
    }
  };

  return (
    <div>
      <h2>Unirse como {profile}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button type="submit">Unirme</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
