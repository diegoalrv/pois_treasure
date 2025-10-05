import { useRoutes } from "react-router-dom";
import Home from "./pages/Home";
import JoinPage from "./pages/JoinPage";

export default function App() {
  const routes = useRoutes([
    { path: "/", element: <Home /> },
    { path: "/join/:profile", element: <JoinPage /> },
  ]);
  return routes;
}
