import { useRoutes } from "react-router-dom";
import Home from "./pages/Home";
import JoinPage from "./pages/JoinPage";
import MapPage from "./pages/MapPage";
import MapResults from "./pages/MapResults";

export default function App() {
  const routes = useRoutes([
    { path: "/", element: <Home /> },
    { path: "/join/:profile", element: <JoinPage /> },
    { path: "/map/:userId", element: <MapPage /> },
    { path: "/results", element: <MapResults /> }, // ⭐ Nueva ruta
  ]);
  return routes;
}