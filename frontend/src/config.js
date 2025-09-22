 // Use the VITE_API_URL from environment variables if it exists,
 // otherwise, fall back to the local proxy path.
 export const API_URL = import.meta.env.VITE_API_URL || '/api';

 export const API_BASE_URL = `${API_URL}/v1`;