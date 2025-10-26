import axios from 'axios';

// Create axios instance with base URL
// Dynamically determine API URL based on current host
const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    // For network access, use the same hostname but port 5000
    return `http://${hostname}:5000/api`;
  }
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const menuAPI = {
  // Get menu for a restaurant by slug
  getMenu: async (slug) => {
    try {
      const response = await api.get(`/menu/${slug}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch menu');
    }
  },

  // Add new menu item
  addMenuItem: async (menuItem) => {
    try {
      const response = await api.post('/menu/add', menuItem);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add menu item');
    }
  },

  // Update menu item
  updateMenuItem: async (id, menuItem) => {
    try {
      const response = await api.put(`/menu/${id}`, menuItem);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update menu item');
    }
  },

  // Delete menu item
  deleteMenuItem: async (id) => {
    try {
      const response = await api.delete(`/menu/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete menu item');
    }
  },

  // Search all menu items across all categories
  searchMenu: async (slug, searchTerm) => {
    try {
      const response = await api.get(`/menu/${slug}/search`, {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search menu');
    }
  },

  // Search items within a specific category
  searchCategory: async (slug, categoryName, searchTerm) => {
    try {
      const response = await api.get(`/menu/${slug}/category/${encodeURIComponent(categoryName)}/search`, {
        params: { q: searchTerm }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search category');
    }
  },
};

export const qrAPI = {
  // Generate QR code for restaurant
  generateQR: async (slug, options = {}) => {
    try {
      const response = await api.get(`/qr/${slug}`, { params: options });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate QR code');
    }
  },

  // Download QR code as PNG
  downloadQR: async (slug, options = {}) => {
    try {
      const response = await api.get(`/qr/${slug}/download`, { 
        params: options,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download QR code');
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API is not available');
  }
};

export default api;
