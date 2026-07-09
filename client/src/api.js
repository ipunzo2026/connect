import axios from 'axios';

const api = axios.create({
    baseURL: 'https://plunging-krypton-transform.ngrok-free.dev'
});

// Esto soluciona los archivos que usan: import api from './api'
export default api;

// Esto soluciona los archivos que usan: import { api } from './api'
export { api };