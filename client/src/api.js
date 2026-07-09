// src/api.js
import axios from 'axios';

const api = axios.create({
    // Pegamos AQUÍ la URL exacta que te dio Ngrok en el Paso 2
    baseURL: 'https://plunging-krypton-transform.ngrok-free.dev'
});

export default api;