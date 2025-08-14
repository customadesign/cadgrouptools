import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        message.error('Session expired. Please login again.');
        window.location.href = '/auth/signin';
      } else if (status === 403) {
        message.error('You do not have permission to perform this action.');
      } else if (status === 404) {
        message.error('Resource not found.');
      } else if (status === 500) {
        message.error('Server error. Please try again later.');
      } else {
        message.error(data.message || 'An error occurred.');
      }
    } else if (error.request) {
      message.error('Network error. Please check your connection.');
    } else {
      message.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Client API calls
export const clientApi = {
  getAll: () => api.get('/clients'),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/clients/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteAvatar: (id: string) => api.delete(`/clients/${id}/avatar`),
};

// Proposal API calls
export const proposalApi = {
  getAll: () => api.get('/proposals'),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  generate: (id: string) => api.post(`/proposals/${id}/generate`),
};

// Upload API calls
export const uploadApi = {
  getPresignedUrl: (fileName: string, fileType: string) =>
    api.post('/uploads/presign', { fileName, fileType }),
  uploadToS3: async (url: string, file: File) => {
    return axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },
};

export default api;