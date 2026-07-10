import axios from 'axios';

const api = axios.create({
    // Le agregamos el /api directamente aquí al final
    baseURL: 'https://plunging-krypton-transform.ngrok-free.dev/api',
    headers: {
        //Se salta la pantalla de advertencia de Ngrok por completo
        'ngrok-skip-browser-warning': 'true'
    }

});

export default api;
export { api };