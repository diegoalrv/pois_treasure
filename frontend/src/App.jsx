import { useRoutes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import JoinPage from "./pages/JoinPage";
import MapPage from "./pages/MapPage";
import MapResults from "./pages/MapResults";
import ScanRequired from "./pages/ScanRequired";

// Componente para redirección desde la raíz
function RootRedirect() {
  const userId = localStorage.getItem('workshop_user_id');
  
  if (userId) {
    return <Navigate to={`/map/${userId}`} replace />;
  } else {
    // Si no hay userId, mostrar pantalla de escaneo requerido
    return <Navigate to="/scan-required" replace />;
  }
}

export default function App() {
  const routes = useRoutes([
    { path: "/", element: <RootRedirect /> },
    { path: "/scan-required", element: <ScanRequired /> },
    { path: "/join/:profile", element: <JoinPage /> },
    { path: "/map/:userId", element: <MapPage /> },
    { path: "/results", element: <MapResults /> }, // ⭐ Nueva ruta
  ]);
  return routes;
}