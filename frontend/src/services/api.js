import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default {
  joinUser: async (data) => {
    const res = await axios.post(`${API_URL}/users/join`, data);
    return res.data;
  },
  getAssignments: async (userId) => {
    const res = await axios.get(`${API_URL}/users/${userId}/assignments`);
    return res.data;
  },
};
