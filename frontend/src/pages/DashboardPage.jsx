import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import MapView from "../components/MapView";

export default function DashboardPage() {
  const { userId } = useParams();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    api.getAssignments(userId).then(setAssignments);
  }, [userId]);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-semibold">Tu mapa de POIs asignados</h1>
      </div>
      <div className="flex-1">
        <MapView assignments={assignments} />
      </div>
    </div>
  );
}
