// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

// Helper function to make API requests
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Include auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

   const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Important for cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};


// Example API methods
export const productAPI = {
  // Get all products
  getAll: async () => {
    return apiRequest('/products');
  },
  
  // Get single product
  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },
  
  // Create product (admin only)
  create: async (productData) => {
    return apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  
  // Update product (admin only)
  update: async (id, productData) => {
    return apiRequest(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  
  // Delete product (admin only)
  delete: async (id) => {
    return apiRequest(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
};

export default apiRequest;
