import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-recruitment-copilot-backend.onrender.com",
});

export default API;