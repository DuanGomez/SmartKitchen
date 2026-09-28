/**
 * Build para GitHub Pages: no hay backend, así que la API se simula en el
 * navegador (ver core/demo/demo-backend.interceptor.ts) con datos en localStorage.
 */
export const environment = {
  production: true,
  demo: true,
  apiUrl: '/api',
  uploadsUrl: '',
};
