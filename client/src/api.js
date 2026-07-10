import axios from 'axios';

const api = axios.create({
    baseURL: 'https://plunging-krypton-transform.ngrok-free.dev/api',
    headers: {
        'ngrok-skip-browser-warning': 'true' // Salta la alerta de Ngrok
    }
});

//ESTO SOLUCIONA EL 401: Inyecta el token automáticamente antes de cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Agrega el token en las cabeceras tal como lo espera tu backend
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
export { api };