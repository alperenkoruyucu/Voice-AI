import axios from 'axios';

// 🔍 DEDEKTİF: Vite .env dosyasını okuyabilmiş mi konsola yazdırıyoruz!
console.log("🔍 Vite ENV Okuması:", import.meta.env.VITE_API_BASE_URL);

// Eğer Vite .env dosyasını okuyamazsa bile sistem çökmeyip 3000'e gitsin diye ZIRH (Fallback) ekliyoruz:
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// İSTEK YOL KESİCİSİ (Interceptor)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Hangi adrese gittiğimizi net görelim:
    console.log(`🚀 API İstegi Çıktı -> ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;