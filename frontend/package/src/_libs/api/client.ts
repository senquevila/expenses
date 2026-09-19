import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // set in .env.local
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token on every request if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && window.localStorage) {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // redirect to login or clear session
    }
    return Promise.reject(error);
  }
);

export default apiClient;