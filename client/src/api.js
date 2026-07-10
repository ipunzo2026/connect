import axios from 'axios';

const api = axios.create({
    // Le agregamos el /api directamente aquí al final
    baseURL: 'https://plunging-krypton-tran/api'
});

export default api;
export { api };